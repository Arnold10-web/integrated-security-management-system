import { describe, it, expect } from "vitest";
import { nextForceNumber, isValidForceNumber } from "../src/utils/forceNumber";

describe("nextForceNumber", () => {
  it("uses a PER-YEAR sequence that resets to 001 each year", () => {
    // Existing PSG024 numbers do not affect the 2025 sequence.
    expect(nextForceNumber(["PSG024/500", "PSG024/499"], new Date("2025-03-01"))).toBe("PSG025/001");
    expect(nextForceNumber(["PSG025/001"], new Date("2025-03-01"))).toBe("PSG025/002");
  });

  it("only counts numbers issued in the same year when advancing the sequence", () => {
    expect(nextForceNumber(["PSG024/900", "PSG025/003"], new Date("2025-03-01"))).toBe("PSG025/004");
    expect(nextForceNumber(["PSG024/999", "PSG026/040"], new Date("2025-03-01"))).toBe("PSG025/001");
  });

  it("returns PSG<YYY>/001 when no force numbers exist for the year yet", () => {
    expect(nextForceNumber([], new Date("2025-01-01"))).toBe("PSG025/001");
    expect(nextForceNumber(undefined, new Date("2026-12-31"))).toBe("PSG026/001");
  });

  it("ignores legacy (non-PSG) force numbers when computing the sequence", () => {
    expect(nextForceNumber(["DRV-UG-001", "UG-G-077", "FORCE-2026-011", "EMP-1000"], new Date("2025-06-01"))).toBe("PSG025/001");
  });

  it("handles variable padding on existing sequence values", () => {
    expect(nextForceNumber(["PSG025/9"], new Date("2025-06-01"))).toBe("PSG025/010");
  });

  it("pads the issued sequence to three digits without truncating larger values", () => {
    expect(nextForceNumber(["PSG025/099"], new Date("2025-06-01"))).toBe("PSG025/100");
    expect(nextForceNumber(["PSG025/999"], new Date("2025-06-01"))).toBe("PSG025/1000");
  });
});

describe("isValidForceNumber", () => {
  it("accepts PSG-series and legacy force numbers", () => {
    expect(isValidForceNumber("PSG026/004")).toBe(true);
    expect(isValidForceNumber("DRV-UG-01")).toBe(true);
  });

  it("rejects empty, too-short, or malformed identifiers", () => {
    expect(isValidForceNumber("")).toBe(false);
    expect(isValidForceNumber("ab")).toBe(false);
    expect(isValidForceNumber("with space and very long value exceeding thirty two chars")).toBe(false);
  });
});
