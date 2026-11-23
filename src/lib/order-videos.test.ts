import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

process.env.DATABASE_URL = ":memory:";
process.env.UPLOAD_DIR = "./data/test-uploads";

let o: typeof import("./orders");
let m: typeof import("./masters");
let v: typeof import("./order-videos");
let r: typeof import("./video-response");

beforeAll(async () => {
  const { db } = await import("@/db");
  migrate(db, { migrationsFolder: "./drizzle" });
  o = await import("./orders");
  m = await import("./masters");
  v = await import("./order-videos");
  r = await import("./video-response");
});

// the first bytes of an MP4 ("ftyp" + brand), a QuickTime MOV and a WebM, then some filler
const bytes = (head: number[], total = 40) => Uint8Array.from([...head, ...new Array(Math.max(0, total - head.length)).fill(7)]);
const ftyp = (brand: string) => [0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, ...brand.split("").map((c) => c.charCodeAt(0))];
const mp4 = (name = "clip.mp4", total = 40) => new File([bytes(ftyp("isom"), total)], name, { type: "video/mp4" });
const mov = () => new File([bytes(ftyp("qt  "))], "clip.mov", { type: "video/quicktime" });
const webm = () => new File([bytes([0x1a, 0x45, 0xdf, 0xa3])], "clip.webm", { type: "video/webm" });

describe("order videos", () => {
  it("tells MP4, MOV and WebM apart by the file itself, and refuses everything else", async () => {
    expect(await v.videoProblem(mp4())).toBeNull();
    expect(await v.videoProblem(mov())).toBeNull();
    expect(await v.videoProblem(webm())).toBeNull();
    expect(v.videoKind(bytes(ftyp("qt  ")))).toEqual({ mime: "video/quicktime", ext: "mov" });
    expect(v.videoKind(bytes(ftyp("isom")))?.mime).toBe("video/mp4");
    // a PDF or a text file renamed to .mp4 is not a video
    expect(await v.videoProblem(new File(["%PDF-1.4 test"], "fake.mp4"))).toMatch(/not a video/);
    expect(await v.videoProblem(new File(["hello there, not a video"], "fake.mp4", { type: "video/mp4" }))).toMatch(/not a video/);
    expect(await v.videoProblem(new File([new Uint8Array(v.MAX_VIDEO_BYTES + 1)], "big.mp4"))).toMatch(/too big/);
    expect(v.MAX_VIDEO_BYTES).toBe(50 * 1024 * 1024);
  });

  it("keeps videos for the order, lets a master see only his own, and removes them", async () => {
    const a = m.createMaster({ name: "Video master A" + Math.random(), pin: "1" });
    const b = m.createMaster({ name: "Video master B" + Math.random(), pin: "2" });
    const input = (masterId: number, name: string) => ({ customerName: name, myDueDate: "2099-01-01", karigarDueDate: "2099-01-02", masterId, details: "" });
    const draft = o.createOrder(input(a, "Draft video"), [], { draft: true });
    const orderId = o.createOrder(input(a, "Video customer"));

    const id = await v.addOrderVideo(orderId, mp4("embroidery.mp4"));
    await v.addOrderVideo(draft, webm());
    const row = v.orderVideo(orderId, id)!;
    expect(v.listOrderVideos(orderId).map((x) => [x.name, x.mime])).toEqual([["embroidery.mp4", "video/mp4"]]);
    expect(row.bytes).toBe(40);
    expect(v.orderVideo(orderId + 99, id)).toBeNull(); // only through its own order

    // the master of the order can open it (the route asks masterOrder first); another master and a draft cannot
    expect(o.masterOrder(a, orderId)).not.toBeNull();
    expect(o.masterOrder(b, orderId)).toBeNull();
    expect(o.masterOrder(a, draft)).toBeNull();
    expect(JSON.stringify(o.masterDashboard(a))).not.toContain("embroidery.mp4");

    // adding one tells the master the order was updated
    expect(o.getOrder(orderId)!.changedForMasterAt).not.toBeNull();

    await v.removeOrderVideo(orderId, id);
    expect(v.listOrderVideos(orderId)).toEqual([]);
  });

  it("answers the pieces a phone player asks for", async () => {
    const orderId = o.createOrder({ customerName: "Range", myDueDate: "2099-01-01", karigarDueDate: "2099-01-02", masterId: m.createMaster({ name: "Range" + Math.random(), pin: "3" }), details: "" });
    const id = await v.addOrderVideo(orderId, mp4("long.mp4", 5000));
    const row = v.orderVideo(orderId, id)!;
    const get = (range?: string) => r.videoResponse(new Request("http://x/v", { headers: range ? { range } : {} }), row);

    const whole = await get();
    expect(whole.status).toBe(200);
    expect(whole.headers.get("content-length")).toBe("5000");
    expect(whole.headers.get("accept-ranges")).toBe("bytes");
    expect((await whole.arrayBuffer()).byteLength).toBe(5000);

    const piece = await get("bytes=100-199");
    expect(piece.status).toBe(206);
    expect(piece.headers.get("content-range")).toBe("bytes 100-199/5000");
    expect((await piece.arrayBuffer()).byteLength).toBe(100);

    const open = await get("bytes=4000-");
    expect(open.headers.get("content-range")).toBe("bytes 4000-4999/5000");
    expect((await get("bytes=-500")).headers.get("content-range")).toBe("bytes 4500-4999/5000");
    expect((await get("bytes=9000-")).status).toBe(416);
    expect((await get("bytes=nonsense")).status).toBe(416);
    expect(piece.headers.get("content-type")).toBe("video/mp4");

    // a piece is never bigger than one chunk, even for "from here to the end"
    expect(r.parseRange("bytes=0-", 50 * 1024 * 1024)).toEqual({ start: 0, end: r.CHUNK_BYTES - 1 });
    expect(r.parseRange("bytes=5-3", 100)).toBeNull();
  });
});
