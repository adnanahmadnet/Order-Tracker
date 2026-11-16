import { describe, expect, it } from "vitest";
import { stepIconName } from "./step-icon";

describe("step icons", () => {
  it("knows the usual steps by their words", () => {
    expect(stepIconName("Cutting")).toBe("scissors");
    expect(stepIconName("Stitching")).toBe("thread");
    expect(stepIconName("Embroidery")).toBe("machine");
    expect(stepIconName("Quality Check")).toBe("qc");
    expect(stepIconName("Final check")).toBe("qc");
    expect(stepIconName("Trial")).toBe("hanger");
    expect(stepIconName("Packing")).toBe("box");
    expect(stepIconName("Shipped")).toBe("shipments");
    expect(stepIconName("Order received")).toBe("clipboard");
    expect(stepIconName("Pressing")).toBe("iron");
  });

  it("ignores capitals, and finds the word inside a longer name", () => {
    expect(stepIconName("CUTTING MASTER")).toBe("scissors");
    expect(stepIconName("Hand work and beads")).toBe("machine");
    expect(stepIconName("Kurta stitching")).toBe("thread");
  });

  it("gives nothing for a name with no known word", () => {
    expect(stepIconName("Production")).toBeNull();
    expect(stepIconName("Delivery to Anas")).toBe("shipments");
    expect(stepIconName("Zzz")).toBeNull();
    expect(stepIconName("")).toBeNull();
  });
});
