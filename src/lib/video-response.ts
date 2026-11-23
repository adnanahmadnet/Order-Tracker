// Sends a stored video the way a phone's player needs it: in pieces ("Range" requests), so it can start at once, skip ahead, and
// never loads the whole file into memory. iPhones refuse to play a video from a server that does not answer Range requests.
import { getRange, sizeOf, streamOf } from "./storage";

/** One piece is at most this much, so an open-ended request ("bytes=0-") does not read the whole file at once. */
export const CHUNK_BYTES = 2 * 1024 * 1024;

/** The bytes a Range header asks for (both ends included), or null when it cannot be answered. */
export function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start: number;
  let end: number;
  if (m[1] === "") {
    const last = Number(m[2]); // "bytes=-500": the last 500 bytes
    if (last === 0) return null;
    start = Math.max(0, size - last);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Number(m[2]);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return null;
  end = Math.min(end, size - 1, start + CHUNK_BYTES - 1);
  return { start, end };
}

export async function videoResponse(req: Request, row: { fileKey: string; mime: string; name: string }): Promise<Response> {
  const size = await sizeOf(row.fileKey);
  if (size === null || size === 0) return new Response("Not found", { status: 404 });
  const base = {
    "content-type": row.mime,
    "accept-ranges": "bytes",
    "cache-control": "private, no-store",
    "content-disposition": `inline; filename="${row.name.replace(/[^\x20-\x7e]/g, "_")}"`,
  };
  const wanted = req.headers.get("range");
  if (!wanted) {
    // a plain request (a download, or a player that does not ask for pieces): the whole file, streamed from the disk
    const body = streamOf(row.fileKey);
    if (!body) return new Response("Not found", { status: 404 });
    return new Response(body, { status: 200, headers: { ...base, "content-length": String(size) } });
  }
  const range = parseRange(wanted, size);
  if (!range) return new Response("Range not satisfiable", { status: 416, headers: { ...base, "content-range": `bytes */${size}` } });
  const data = await getRange(row.fileKey, range.start, range.end);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    status: 206,
    headers: { ...base, "content-length": String(data.length), "content-range": `bytes ${range.start}-${range.start + data.length - 1}/${size}` },
  });
}
