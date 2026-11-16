import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

process.env.DATABASE_URL = ":memory:";

let t: typeof import("./translate");

beforeAll(async () => {
  const { db } = await import("@/db");
  migrate(db, { migrationsFolder: "./drizzle" });
  t = await import("./translate");
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_TRANSLATE_API_KEY;
});

const answer = (map: Record<string, string>) =>
  vi.fn(async (_url: string, init: { body: string }) => {
    const q = (JSON.parse(init.body) as { q: string[] }).q;
    return new Response(JSON.stringify({ data: { translations: q.map((x) => ({ translatedText: map[x] ?? `tr:${x}` })) } }), { status: 200 });
  });

const bodyOf = (f: ReturnType<typeof answer>, call = 0) => JSON.parse((f.mock.calls[call][1] as { body: string }).body) as { q: string[]; source: string; target: string };

describe("translate", () => {
  it("does nothing without a key: the English stays", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(t.translationEnabled()).toBe(false);
    expect(await t.translateTexts(["Sleeve length"], "ur")).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("translates once, saves it, and never asks again for the same text", async () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = "test-key";
    const f = answer({ "Sleeve length": "آستین کی لمبائی" });
    vi.stubGlobal("fetch", f);

    expect(await t.translateTexts(["Sleeve length", "  Sleeve   length ", "1234A"], "ur")).toEqual({ "Sleeve length": "آستین کی لمبائی" });
    expect(f).toHaveBeenCalledTimes(1);
    expect(bodyOf(f)).toMatchObject({ q: ["Sleeve length"], source: "en", target: "ur" }); // the code is never sent, the spaces are tidied

    expect(await t.translateTexts(["Sleeve length"], "ur")).toEqual({ "Sleeve length": "آستین کی لمبائی" });
    expect(f).toHaveBeenCalledTimes(1); // from the saved copy
  });

  it("keeps Urdu and Bengali apart: the same text is translated once for each language", async () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = "test-key";
    const f = answer({ "Embroidery colour": "tr:x" });
    vi.stubGlobal("fetch", f);

    expect(await t.translateTexts(["Embroidery colour"], "ur")).toEqual({ "Embroidery colour": "tr:x" });
    expect(await t.translateTexts(["Embroidery colour"], "bn")).toEqual({ "Embroidery colour": "tr:x" });
    expect(f).toHaveBeenCalledTimes(2);
    expect(bodyOf(f, 0).target).toBe("ur");
    expect(bodyOf(f, 1).target).toBe("bn");

    await t.translateTexts(["Embroidery colour"], "bn");
    expect(f).toHaveBeenCalledTimes(2); // both are saved now
  });

  it("leaves a text out when the service fails, and tries again later", async () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    expect(await t.translateTexts(["Collar size"], "bn")).toEqual({});
    vi.stubGlobal("fetch", answer({ "Collar size": "কলারের সাইজ" }));
    expect(await t.translateTexts(["Collar size"], "bn")).toEqual({ "Collar size": "কলারের সাইজ" });
  });

  it("asks for at most MAX_TEXTS texts at once", async () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = "test-key";
    const f = answer({});
    vi.stubGlobal("fetch", f);
    const many = Array.from({ length: t.MAX_TEXTS + 20 }, (_, i) => `Field name ${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}`);
    await t.translateTexts(many, "ur");
    expect(bodyOf(f).q).toHaveLength(t.MAX_TEXTS);
  });
});
