// Taking back a step that was finished by mistake ("he pressed Mark complete by accident and it now shows the wrong step").
// The step opens again and the one after it locks again; nothing the master added (images, notes) is lost, and the history keeps
// both lines (finished, then reopened), so the office can always see what happened.
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { itemStages, orderItems, orders, shipmentItems, shipments } from "@/db/schema";
import { isAssigned } from "./assign";
import { addEvent } from "./history";
import { itemShipReadiness } from "./shipping";

export type UndoStageResult =
  | { ok: true }
  | { ok: false; reason: "not-found" | "order-closed" | "not-done" | "not-yours" | "not-latest" | "sent" };

/**
 * Open the step again. Rules:
 *  - the order must still be active, and the master must be one of its masters;
 *  - only the LAST finished step can be taken back (a later step is already done: take that one back first);
 *  - a master can only take back a step he finished himself, never one the office finished;
 *  - not once the item has been sent in a shipment (it left the workshop); the office remakes it instead.
 * The step keeps its original start time, so its expected days are not reset by an undo. If the item was ready and sitting in the
 * master's open cart and is no longer ready, it leaves the cart by itself.
 */
export function undoStage(who: { by: "master"; masterId: number } | { by: "admin" }, itemId: number, stageKey: string): UndoStageResult {
  return db.transaction((tx) => {
    const item = tx.select().from(orderItems).where(eq(orderItems.id, itemId)).get();
    const row = item ? tx.select().from(itemStages).where(and(eq(itemStages.itemId, itemId), eq(itemStages.stageKey, stageKey))).get() : undefined;
    if (!item || !row) return { ok: false, reason: "not-found" } as const;
    const order = tx.select().from(orders).where(eq(orders.id, item.orderId)).get()!;
    if (who.by === "master" && !isAssigned(who.masterId, order.id)) return { ok: false, reason: "not-found" } as const;
    if (order.status !== "active") return { ok: false, reason: "order-closed" } as const;
    if (row.status !== "done") return { ok: false, reason: "not-done" } as const;
    if (who.by === "master" && row.completedBy !== "master") return { ok: false, reason: "not-yours" } as const;

    const later = tx.select().from(itemStages).where(eq(itemStages.itemId, itemId)).all().filter((s) => s.position > row.position);
    if (later.some((s) => s.status === "done")) return { ok: false, reason: "not-latest" } as const;

    // already sent in a shipment (and not sent back for a remake): it has left
    const sent = tx
      .select({ id: shipmentItems.id })
      .from(shipmentItems)
      .innerJoin(shipments, eq(shipmentItems.shipmentId, shipments.id))
      .where(and(eq(shipmentItems.itemId, itemId), eq(shipments.status, "submitted"), isNull(shipmentItems.returnedAt)))
      .get();
    if (sent) return { ok: false, reason: "sent" } as const;

    const now = new Date();
    tx.update(itemStages).set({ status: "open", completedAt: null, completedBy: null, startedAt: row.startedAt ?? now }).where(eq(itemStages.id, row.id)).run();
    for (const s of later) if (s.status === "open") tx.update(itemStages).set({ status: "locked", startedAt: null }).where(eq(itemStages.id, s.id)).run(); // the next step waits again
    tx.update(orders)
      .set({ updatedAt: now, ...(who.by === "admin" ? { changedForMasterAt: now } : {}) }) // the master is told when the office reopens his step
      .where(eq(orders.id, order.id))
      .run();
    addEvent({ orderId: order.id, itemId, stageKey, kind: "reopened", by: who.by, masterId: who.by === "master" ? who.masterId : null }, tx);

    // an item that is no longer ready cannot stay in an open cart
    if (!itemShipReadiness(itemId).ready) {
      const drafts = tx.select({ id: shipments.id }).from(shipments).where(eq(shipments.status, "draft")).all().map((d) => d.id);
      if (drafts.length > 0) tx.delete(shipmentItems).where(and(eq(shipmentItems.itemId, itemId), inArray(shipmentItems.shipmentId, drafts))).run();
    }
    return { ok: true } as const;
  });
}
