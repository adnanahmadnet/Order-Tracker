import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

process.env.DATABASE_URL = ":memory:";

let t: typeof import("./templates");
let o: typeof import("./orders");
let m: typeof import("./masters");
let s: typeof import("./stages");
let h: typeof import("./history");
let sh: typeof import("./shipping");
let u: typeof import("./undo-step");
let ur: typeof import("./urdu");

beforeAll(async () => {
  const { db } = await import("@/db");
  migrate(db, { migrationsFolder: "./drizzle" });
  t = await import("./templates");
  o = await import("./orders");
  m = await import("./masters");
  s = await import("./stages");
  h = await import("./history");
  sh = await import("./shipping");
  u = await import("./undo-step");
  ur = await import("./urdu");
});

let seq = 0;
/** An item with three plain steps (no photos), an order for one master, already confirmed. */
function setup(count = 1) {
  const main = t.createMainCategory("U" + ++seq, "#000000");
  t.createSubCategory(main, "Kurta", "#111111");
  const tplId = t.listCategoryTree().find((c) => c.id === main)!.subs[0].template.id;
  t.saveTemplate(tplId, [], t.rowsToStages([
    { key: "", label: "Cutting", photo: "none" },
    { key: "", label: "Embroidery", photo: "none" },
    { key: "", label: "Stitching", photo: "none" },
  ]));
  const snapshot = t.templateForItem(tplId)!.snapshot;
  const master = m.createMaster({ name: "Naseem" + ++seq, pin: "1" });
  const orderId = o.createOrder({ customerName: "Zara", myDueDate: "2099-01-01", karigarDueDate: "2099-01-01", masterId: master, details: "" }, [
    ...Array.from({ length: count }, () => ({ templateId: tplId, label: "Kurta", snapshot, values: {} })),
  ]);
  h.confirmOrder(master, orderId);
  const itemId = o.listItems(orderId)[0].id;
  return { master, orderId, itemId, itemIds: o.listItems(orderId).map((i) => i.id), me: { by: "master", masterId: master } as const, office: { by: "admin" } as const };
}
const status = (itemId: number) => s.itemStageViews(itemId).map((x) => x.status);

describe("taking back a step finished by mistake", () => {
  it("opens the step again, locks the next one, keeps both lines in the history", () => {
    const { master, orderId, itemId, me } = setup();
    expect(s.completeStage(me, itemId, "cutting")).toEqual({ ok: true });
    expect(status(itemId)).toEqual(["done", "open", "locked"]);
    const startedBefore = s.itemStageViews(itemId)[0].startedAt;

    expect(u.undoStage(me, itemId, "cutting")).toEqual({ ok: true });
    expect(status(itemId)).toEqual(["open", "locked", "locked"]);
    const v = s.itemStageViews(itemId)[0];
    expect(v.completedAt).toBeNull();
    expect(v.completedBy).toBeNull();
    expect(v.startedAt ?? startedBefore).toBeTruthy(); // its clock was not reset

    // the history keeps "finished" and then "reopened", in plain words
    const lines = h.orderHistory(orderId);
    expect(lines.slice(0, 2).map((l) => l.kind)).toEqual(["reopened", "done"]);
    expect(h.describeEvent(lines[0])).toMatch(/reopened Cutting/);
    expect(lines[0].by).toBe("master");

    // he can finish it again properly
    expect(s.completeStage(me, itemId, "cutting")).toEqual({ ok: true });
    expect(status(itemId)).toEqual(["done", "open", "locked"]);
    expect(master).toBeGreaterThan(0);
  });

  it("only takes back the LAST finished step", () => {
    const { itemId, me } = setup();
    s.completeStage(me, itemId, "cutting");
    s.completeStage(me, itemId, "embroidery");
    expect(status(itemId)).toEqual(["done", "done", "open"]);
    expect(s.itemStageViews(itemId).map((x) => x.lastDone)).toEqual([false, true, false]);

    expect(u.undoStage(me, itemId, "cutting")).toEqual({ ok: false, reason: "not-latest" });
    expect(u.undoStage(me, itemId, "stitching")).toEqual({ ok: false, reason: "not-done" }); // it is not finished
    expect(u.undoStage(me, itemId, "embroidery")).toEqual({ ok: true });
    expect(status(itemId)).toEqual(["done", "open", "locked"]);
    expect(u.undoStage(me, itemId, "nonsense")).toEqual({ ok: false, reason: "not-found" });
  });

  it("a master cannot take back what the office finished, or another master's step; the office can reopen any last step", () => {
    const { orderId, itemId, me, office } = setup();
    expect(s.completeStage(office, itemId, "cutting")).toEqual({ ok: true });
    expect(u.undoStage(me, itemId, "cutting")).toEqual({ ok: false, reason: "not-yours" });

    const stranger = m.createMaster({ name: "Stranger" + ++seq, pin: "2" });
    s.completeStage(me, itemId, "embroidery");
    expect(u.undoStage({ by: "master", masterId: stranger }, itemId, "embroidery")).toEqual({ ok: false, reason: "not-found" });

    const before = o.getOrder(orderId)!.changedForMasterAt?.getTime() ?? 0;
    expect(u.undoStage(office, itemId, "embroidery")).toEqual({ ok: true });
    expect(h.orderHistory(orderId)[0]).toMatchObject({ kind: "reopened", by: "admin", who: "The office" });
    expect(o.getOrder(orderId)!.changedForMasterAt!.getTime()).toBeGreaterThanOrEqual(before); // the master sees "Updated"
    expect(u.undoStage(office, itemId, "cutting")).toEqual({ ok: true }); // now cutting is the last finished one
    expect(status(itemId)).toEqual(["open", "locked", "locked"]);
  });

  it("not on a closed order", () => {
    const { orderId, itemId, me } = setup();
    s.completeStage(me, itemId, "cutting");
    o.setStatus(orderId, "cancelled");
    expect(u.undoStage(me, itemId, "cutting")).toEqual({ ok: false, reason: "order-closed" });
  });

  it("an item taken back leaves the cart, and an item that was sent can no longer be taken back", () => {
    const { master, itemId, me } = setup(2); // two items: sending one leaves the order open
    for (const k of ["cutting", "embroidery", "stitching"]) s.completeStage(me, itemId, k);
    expect(sh.addToCart(master, itemId)).toBe(true);
    expect(sh.findDraft(master)!.items.map((i) => i.itemId)).toEqual([itemId]);

    expect(u.undoStage(me, itemId, "stitching")).toEqual({ ok: true });
    expect(sh.findDraft(master)!.items).toEqual([]); // no longer ready, so no longer in the cart
    expect(sh.cartCandidates(master).map((c) => c.itemId)).not.toContain(itemId);

    s.completeStage(me, itemId, "stitching");
    expect(sh.addToCart(master, itemId)).toBe(true);
    const sid = sh.findDraft(master)!.id;
    sh.saveShipmentItems(master, sid, [itemId], [itemId]);
    expect(sh.submitShipment(master, sid)).toMatchObject({ ok: true });
    expect(u.undoStage(me, itemId, "stitching")).toEqual({ ok: false, reason: "sent" });
  });

  it("the history line reads in Urdu too", () => {
    expect(ur.urduFor("Naseem reopened Cutting (Kurta)")).toContain("Naseem");
    expect(ur.urduFor("The office reopened Cutting")).toContain("دوبارہ کھول");
  });
});
