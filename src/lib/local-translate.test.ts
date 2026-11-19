import { describe, expect, it } from "vitest";
import { pieces } from "./local-translate";
import { cleanSource } from "./i18n";

describe("local translation helpers", () => {
  it("cuts a note into lines and sentences and remembers what separated them", () => {
    expect(pieces("Collar Embroidery\nThin Cuff. No motives!")).toEqual([
      { part: "Collar Embroidery", sep: "\n" },
      { part: "Thin Cuff.", sep: " " },
      { part: "No motives!", sep: "" },
    ]);
  });

  it("keeps the line breaks of a list when tidying a text, but not the extra spaces", () => {
    expect(cleanSource("  Collar   Embroidery \n\n  Thin Cuff  ")).toBe("Collar Embroidery\nThin Cuff");
  });
});
