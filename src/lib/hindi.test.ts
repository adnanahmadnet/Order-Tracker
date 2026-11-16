import { describe, expect, it } from "vitest";
import { HINDI, HI_MONTHS, hindiFor } from "./hindi";
import { handWritten } from "./langs";
import { MONTHS, URDU } from "./urdu";

describe("hindi", () => {
  it("has a Hindi for every English text the Urdu list has, and nothing extra", () => {
    expect(Object.keys(URDU).filter((k) => !(k in HINDI))).toEqual([]);
    expect(Object.keys(HINDI).filter((k) => !(k in URDU))).toEqual([]);
    expect(Object.keys(HI_MONTHS)).toEqual(Object.keys(MONTHS));
  });

  it("is Hindi, not English or empty, and keeps the numbers", () => {
    for (const [en, hi] of Object.entries(HINDI)) {
      expect(hi.trim().length, en).toBeGreaterThan(0);
      expect(/[ऀ-ॿ]/.test(hi) || /^[\s{}\dnd.,:+()#-]+$/.test(hi), en).toBe(true); // Devanagari letters (or only numbers and signs)
      expect((hi.match(/\{(n|\d)\}/g) ?? []).length, en).toBe((en.match(/\{n\}/g) ?? []).length);
    }
  });

  it("translates words, sentences with numbers, dates, designs and history lines", () => {
    expect(hindiFor("Cart")).toBe("टोकरी");
    expect(hindiFor("  Cart \n")).toBe("  टोकरी \n");
    expect(hindiFor("sleeve LENGTH")).toBe("आस्तीन की लंबाई");
    expect(hindiFor("Late by 11 days")).toBe("11 दिन लेट");
    expect(hindiFor("1 of 3 items finished. 2 left to make.")).toBe("3 में से 1 आइटम पूरे। 2 बनाने बाकी।");
    expect(hindiFor("12 November 2026")).toBe("12 नवंबर 2026");
    expect(hindiFor("Due 16 November")).toBe("आखिरी तारीख 16 नवंबर");
    expect(hindiFor("Design: #6366")).toBe("डिज़ाइन: #6366");
    expect(hindiFor("Sherwani, Pants")).toBe("शेरवानी, पैंट");
    expect(hindiFor("Naseem finished Cutting (Sherwani)")).toBe("Naseem ने कटिंग पूरा किया (शेरवानी)");
    expect(hindiFor("Something the office typed")).toBeNull();
    expect(hindiFor("i sent the cloth")).toBeNull();
  });

  it("is picked by its code", () => {
    expect(handWritten("hi", "Cart")).toBe("टोकरी");
  });
});
