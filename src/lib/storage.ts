import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import sharp from "sharp";

// All file access goes through this module (save / get / remove),
// so server disk can be swapped for R2 or similar later.
const ROOT = process.env.UPLOAD_DIR ?? "./data/uploads";

const safe = (key: string) => {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(path.resolve(ROOT) + path.sep)) throw new Error("bad key");
  return full;
};

export function randomKey(prefix: string, ext: string): string {
  return `${prefix}/${randomBytes(16).toString("hex")}.${ext}`;
}

export async function save(key: string, data: Buffer): Promise<void> {
  const full = safe(key);
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, data);
}

export async function get(key: string): Promise<Buffer | null> {
  try {
    return await fs.promises.readFile(safe(key));
  } catch {
    return null;
  }
}

/** The size of a stored file in bytes, or null when it is not there. */
export async function sizeOf(key: string): Promise<number | null> {
  try {
    return (await fs.promises.stat(safe(key))).size;
  } catch {
    return null;
  }
}

/** A stored file as a stream (for a plain, non-Range request of a big file), or null when it is not there. */
export function streamOf(key: string): ReadableStream<Uint8Array> | null {
  try {
    const full = safe(key);
    if (!fs.existsSync(full)) return null;
    return Readable.toWeb(fs.createReadStream(full)) as ReadableStream<Uint8Array>;
  } catch {
    return null;
  }
}

/** Bytes start..end (both included) of a stored file: a video is sent in pieces, never read whole. */
export async function getRange(key: string, start: number, end: number): Promise<Buffer | null> {
  let fh: fs.promises.FileHandle | null = null;
  try {
    fh = await fs.promises.open(safe(key), "r");
    const buf = Buffer.alloc(end - start + 1);
    const { bytesRead } = await fh.read(buf, 0, buf.length, start);
    return buf.subarray(0, bytesRead);
  } catch {
    return null;
  } finally {
    await fh?.close();
  }
}

export async function remove(key: string): Promise<void> {
  await fs.promises.rm(safe(key), { force: true });
}

// ------------------------------------------------------------ images

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // what we accept before re-encoding
const TARGET_BYTES = 400 * 1024;
const LONG_SIDE = 1600;

/**
 * Re-encode any JPEG/PNG/WebP to a small WebP (long side 1600 px, about 400 KB or less)
 * plus a thumbnail. The phone already compresses, this guarantees it and strips EXIF.
 */
export async function processImage(input: Buffer): Promise<{ image: Buffer; thumb: Buffer } | null> {
  if (input.length > MAX_UPLOAD_BYTES) return null;
  try {
    const meta = await sharp(input).metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) return null;
    const base = sharp(input).rotate().resize({ width: LONG_SIDE, height: LONG_SIDE, fit: "inside", withoutEnlargement: true });
    let image = Buffer.alloc(0);
    for (const q of [80, 70, 60, 50]) {
      image = await base.clone().webp({ quality: q }).toBuffer();
      if (image.length <= TARGET_BYTES) break;
    }
    const thumb = await sharp(image).resize({ width: 320, height: 320, fit: "inside" }).webp({ quality: 60 }).toBuffer();
    return { image, thumb };
  } catch {
    return null;
  }
}
