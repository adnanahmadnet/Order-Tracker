// Videos attached to a customer (for example the customer's reference video). The office adds them with the Save button, like the
// order PDF; the master only watches them (never adds or removes). A video is never part of the printed sheet.
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderVideos, orders } from "@/db/schema";
import { randomKey, remove, save } from "./storage";

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** The video files chosen in a form (empty file boxes are ignored). */
export function chosenVideos(f: FormData, field = "orderVideo"): File[] {
  return f.getAll(field).filter((x): x is File => x instanceof File && x.size > 0);
}

/** What kind of video the first bytes say it is: MP4 or MOV ("ftyp" box), or WebM (EBML header). null = not a video we play. */
export function videoKind(head: Uint8Array): { mime: string; ext: string } | null {
  if (head.length >= 12 && String.fromCharCode(head[4], head[5], head[6], head[7]) === "ftyp") {
    const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
    return brand === "qt  " ? { mime: "video/quicktime", ext: "mov" } : { mime: "video/mp4", ext: "mp4" };
  }
  if (head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return { mime: "video/webm", ext: "webm" };
  return null;
}

/** A message when a file cannot be accepted, else null. The kind is checked from the file itself, not from its name. */
export async function videoProblem(file: File): Promise<string | null> {
  if (file.size > MAX_VIDEO_BYTES) return `${file.name} is too big. A video can be 50 MB at most.`;
  if (!videoKind(new Uint8Array(await file.slice(0, 12).arrayBuffer()))) return `${file.name} is not a video we can play. Use an MP4, MOV or WebM file.`;
  return null;
}

export async function addOrderVideo(orderId: number, file: File) {
  const kind = videoKind(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  if (!kind) throw new Error("not a video");
  const fileKey = randomKey(`orders/${orderId}`, kind.ext);
  await save(fileKey, Buffer.from(await file.arrayBuffer()));
  const name = (file.name || `video.${kind.ext}`).replace(/[\\/"]/g, "_").slice(0, 120);
  const id = db.insert(orderVideos).values({ orderId, name, fileKey, bytes: file.size, mime: kind.mime }).returning({ id: orderVideos.id }).get().id;
  db.update(orders).set({ changedForMasterAt: new Date() }).where(eq(orders.id, orderId)).run(); // the master sees "Updated"
  return id;
}

export function listOrderVideos(orderId: number) {
  return db.select().from(orderVideos).where(eq(orderVideos.orderId, orderId)).orderBy(orderVideos.id).all();
}

export function orderVideo(orderId: number, videoId: number) {
  return db.select().from(orderVideos).where(and(eq(orderVideos.orderId, orderId), eq(orderVideos.id, videoId))).get() ?? null;
}

export async function removeOrderVideo(orderId: number, videoId: number) {
  const row = orderVideo(orderId, videoId);
  if (!row) return;
  db.delete(orderVideos).where(eq(orderVideos.id, row.id)).run();
  await remove(row.fileKey);
}
