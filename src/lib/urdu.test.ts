import { describe, expect, it } from "vitest";
import { MONTHS, URDU, cleanSource, isTranslatable, urduFor } from "./urdu";

describe("urdu", () => {
  it("translates a known text and keeps the spaces around it", () => {
    expect(urduFor("Cart")).toBe("ٹوکری");
    expect(urduFor("  Cart \n")).toBe("  ٹوکری \n");
    expect(urduFor("Something the office typed")).toBeNull();
  });

  it("puts numbers back into a sentence with a number in it", () => {
    expect(urduFor("Late by 11 days")).toBe("11 دن لیٹ");
    expect(urduFor("Too many tries. Wait 5 minutes.")).toBe("بہت کوششیں ہو گئیں۔ 5 منٹ انتظار کریں۔");
    expect(urduFor("1 of 3 items finished. 2 left to make.")).toBe("3 میں سے 1 آئٹمز مکمل۔ 2 بنانے باقی ہیں۔"); // "1 of 3" is "3 میں سے 1" in Urdu
  });

  it("translates dates, with and without a year, and inside a sentence", () => {
    expect(urduFor("12 November 2026")).toBe("12 نومبر 2026");
    expect(urduFor("5 March")).toBe("5 مارچ");
    expect(urduFor("November 2026")).toBe("نومبر 2026");
    expect(urduFor("Chest")).toBe("سینہ");
    expect(urduFor("sleeve LENGTH")).toBe("آستین کی لمبائی"); // capital letters do not matter
    expect(urduFor("Shoulder:")).toBe("کندھا:");
    expect(urduFor("Measurements (inches)")).toBe("ناپ (انچ میں)");
    expect(urduFor("Add 1 Inch")).toBe("1 انچ بڑھائیں");
    expect(urduFor("Due 16 November")).toBe("آخری تاریخ 16 نومبر");
  });

  it("translates the history lines and keeps the names", () => {
    expect(urduFor("Naseem finished Cutting (Sherwani)")).toBe("Naseem نے کٹائی مکمل کیا (شیروانی)");
    expect(urduFor("The office sent Sherwani back for a remake")).toBe("دفتر نے شیروانی دوبارہ بنانے کے لیے واپس بھیجا");
    expect(urduFor("Naseem sent Pants")).toBe("Naseem نے پینٹ بھیج دیا");
    expect(urduFor("10 Nov 2026, 01:55")).toBe("10 نومبر 2026، 01:55");
    // a note written by a person is not mistaken for a history line
    expect(urduFor("i sent the cloth")).toBeNull();
    expect(urduFor("I sent the cloth")).toBeNull();
  });

  it("leaves the design number as it is", () => {
    expect(urduFor("Design: #6366")).toBe("ڈیزائن: #6366");
    expect(urduFor("- Design: 22")).toBe("- ڈیزائن: 22");
  });

  it("translates a comma list only when every part is known", () => {
    expect(urduFor("Sherwani, Pants")).toBe("شیروانی، پینٹ");
    expect(urduFor("Sherwani, Mystery cloth")).toBeNull();
  });

  it("sends nothing for numbers, codes, links and one-letter bits", () => {
    for (const t of ["1234A", "12", "a", "", "https://example.com/x", "me@example.com", "#21", "5 / 7"]) expect(isTranslatable(t)).toBe(false);
    expect(isTranslatable("Sleeve length")).toBe(true);
    expect(isTranslatable("x".repeat(501))).toBe(false);
    expect(cleanSource("  Sleeve \n  length ")).toBe("Sleeve length");
  });

  it("has an Urdu month for every month the app prints", () => {
    expect(Object.keys(MONTHS)).toHaveLength(12);
    expect(Object.values(MONTHS).every(Boolean)).toBe(true);
  });

  it("has no empty Urdu and no key with a stray space", () => {
    for (const [en, ur] of Object.entries(URDU)) {
      expect(ur.trim().length, en).toBeGreaterThan(0);
      expect(en, en).toBe(en.trim());
      // the same {n} count on both sides, so numbers are never lost
      expect((ur.match(/\{(n|\d)\}/g) ?? []).length, en).toBe((en.match(/\{n\}/g) ?? []).length);
    }
  });
});
