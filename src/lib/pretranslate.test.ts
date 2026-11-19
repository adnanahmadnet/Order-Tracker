import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

process.env.DATABASE_URL = ":memory:";

// the free translator is a big model: the tests use a stand-in that records what it was asked
const asked: string[] = [];
vi.mock("./local-translate", () => ({
  localTranslationEnabled: () => process.env.LOCAL_TRANSLATE === "1",
  localTranslate: vi.fn(async (text: string) => {
    asked.push(text);
    return `tr:${text}`;
  }),
}));

let o: typeof import("./orders");
let m: typeof import("./masters");
let p: typeof import("./pretranslate");
let tr: typeof import("./translate");

beforeAll(async () => {
  const { db } = await import("@/db");
  migrate(db, { migrationsFolder: "./drizzle" });
  o = await import("./orders");
  m = await import("./masters");
  p = await import("./pretranslate");
  tr = await import("./translate");
});

afterEach(() => {
  delete process.env.LOCAL_TRANSLATE;
});

const make = () => {
  const master = m.createMaster({ name: "PreMaster", pin: "1111A" });
  const fields = [
    { key: "note", label: "Fitting notes", type: "longtext" as const, required: false, masterCanEdit: false },
    { key: "chest", label: "Chest", type: "number" as const, required: false, masterCanEdit: false },
  ];
  const stages = [{ key: "cut", label: "Cutting", photo: "none" as const }];
  const item = {
    templateId: 0,
    label: "Sherwani",
    snapshot: { templateName: "Sherwani", path: "Men > Sherwani", colour: "#000000", version: 1, fields, stages },
    values: { note: "Customer has very down shoulders and rounded.", chest: "40" },
  };
  return o.createOrder({ customerName: "Pre", myDueDate: "2099-01-01", karigarDueDate: "2099-03-05", masterId: master, details: "Thin cuff embroidery" }, [item]);
};

describe("pretranslate", () => {
  it("lists what the master would ask for: typed text first, then names, never numbers or what the hand lists already have", () => {
    const id = make();
    const texts = p.textsToTranslate(id);
    expect(texts.slice(0, 2)).toEqual(["Thin cuff embroidery", "Customer has very down shoulders and rounded."]);
    expect(texts).toContain("Fitting notes");
    expect(texts).not.toContain("40");
  });

  it("does nothing when no translator is switched on", async () => {
    asked.length = 0;
    p.pretranslateOrder(make());
    await new Promise((r) => setTimeout(r, 50));
    expect(asked).toEqual([]);
  });

  it("translates the order into all three languages in the background and saves it", async () => {
    process.env.LOCAL_TRANSLATE = "1";
    asked.length = 0;
    const id = make();
    p.pretranslateOrder(id);
    await vi.waitFor(async () => {
      for (const lang of ["ur", "bn", "hi"] as const) expect(await tr.translateTexts(["Thin cuff embroidery"], lang)).toEqual({ "Thin cuff embroidery": "tr:Thin cuff embroidery" });
    });
    expect(asked.filter((t) => t === "Thin cuff embroidery").length).toBe(3); // once per language, then saved
  });
});
