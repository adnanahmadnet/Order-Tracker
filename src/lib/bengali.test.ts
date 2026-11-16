import { describe, expect, it } from "vitest";
import { BENGALI, BN_MONTHS, bengaliFor } from "./bengali";
import { handWritten, LANGS } from "./langs";
import { MONTHS, URDU } from "./urdu";

describe("bengali", () => {
  it("has a Bengali for every English text the Urdu list has, and nothing extra", () => {
    const missing = Object.keys(URDU).filter((k) => !(k in BENGALI));
    const extra = Object.keys(BENGALI).filter((k) => !(k in URDU));
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
    expect(Object.keys(BN_MONTHS)).toEqual(Object.keys(MONTHS));
  });

  it("is Bengali, not English or empty, and keeps the numbers", () => {
    for (const [en, bn] of Object.entries(BENGALI)) {
      expect(bn.trim().length, en).toBeGreaterThan(0);
      expect(/[ঀ-৿]/.test(bn) || /^[\s{}\dnd.,:+()#-]+$/.test(bn), en).toBe(true); // Bengali letters (or only numbers and signs)
      expect((bn.match(/\{(n|\d)\}/g) ?? []).length, en).toBe((en.match(/\{n\}/g) ?? []).length);
      expect(en, en).toBe(en.trim());
    }
  });

  it("translates words, sentences with numbers, dates, designs and history lines", () => {
    expect(bengaliFor("Cart")).toBe("ঝুড়ি");
    expect(bengaliFor("  Cart \n")).toBe("  ঝুড়ি \n");
    expect(bengaliFor("sleeve LENGTH")).toBe("হাতার দৈর্ঘ্য");
    expect(bengaliFor("Late by 11 days")).toBe("11 দিন দেরি");
    expect(bengaliFor("1 of 3 items finished. 2 left to make.")).toBe("3টি আইটেমের মধ্যে 1টি শেষ। 2টি বানানো বাকি।");
    expect(bengaliFor("12 November 2026")).toBe("12 নভেম্বর 2026");
    expect(bengaliFor("Due 16 November")).toBe("শেষ তারিখ 16 নভেম্বর");
    expect(bengaliFor("Design: #6366")).toBe("ডিজাইন: #6366");
    expect(bengaliFor("Sherwani, Pants")).toBe("শেরওয়ানি, প্যান্ট");
    expect(bengaliFor("Naseem finished Cutting (Sherwani)")).toBe("Naseem কাটিং শেষ করেছে (শেরওয়ানি)");
    expect(bengaliFor("The office sent Sherwani back for a remake")).toBe("অফিস শেরওয়ানি আবার বানানোর জন্য ফেরত পাঠিয়েছে");
    expect(bengaliFor("Something the office typed")).toBeNull();
    expect(bengaliFor("i sent the cloth")).toBeNull();
  });

  it("picks the language by its code, and English is never translated", () => {
    expect(handWritten("bn", "Cart")).toBe("ঝুড়ি");
    expect(handWritten("ur", "Cart")).toBe("ٹوکری");
    expect(handWritten("en", "Cart")).toBeNull();
    expect(LANGS.map((l) => l.code)).toEqual(["en", "ur", "bn", "hi"]);
    expect(LANGS.find((l) => l.code === "ur")!.dir).toBe("rtl");
    expect(LANGS.find((l) => l.code === "bn")!.dir).toBe("ltr");
  });
});
