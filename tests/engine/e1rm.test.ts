import { describe, expect, it } from "vitest";
import { calculateE1rm } from "@/engine/e1rm";

describe("calculateE1rm", () => {
  it.each([
    { rir: 4, expected: 116.3 },
    { rir: 3.5, expected: 114.3 },
    { rir: 3, expected: 112.4 },
    { rir: 2.5, expected: 110.5 },
    { rir: 2, expected: 108.7 },
    { rir: 1.5, expected: 106.4 },
    { rir: 1, expected: 104.2 },
    { rir: 0.5, expected: 102 },
    { rir: 0, expected: 100 },
  ])("uses the RPE table for singles at RIR $rir", ({ rir, expected }) => {
    expect(calculateE1rm(100, 1, rir)).toEqual({
      valueKg: expected,
      method: "rpe_table",
      confidence: "high",
    });
  });

  it("falls back to the Epley formula for rep sets with known RIR", () => {
    expect(calculateE1rm(85, 5, 2)).toEqual({
      valueKg: 104.8,
      method: "epley",
      confidence: "medium",
    });
  });

  it("returns unavailable when rep-set intensity data is missing", () => {
    expect(calculateE1rm(85, 5, null)).toEqual({
      valueKg: null,
      method: "unavailable",
      confidence: null,
      reason: "Insufficient intensity data for an e1RM estimate.",
    });
  });

  it("returns unavailable when reps exceed the supported fallback range", () => {
    expect(calculateE1rm(85, 11, 1)).toEqual({
      valueKg: null,
      method: "unavailable",
      confidence: null,
      reason: "Insufficient intensity data for an e1RM estimate.",
    });
  });

  it("returns unavailable for singles with no RIR", () => {
    expect(calculateE1rm(90, 1, null)).toEqual({
      valueKg: null,
      method: "unavailable",
      confidence: null,
      reason: "Insufficient intensity data for an e1RM estimate.",
    });
  });

  it("keeps zero-weight singles numerically valid", () => {
    expect(calculateE1rm(0, 1, 2)).toEqual({
      valueKg: 0,
      method: "rpe_table",
      confidence: "high",
    });
  });
});
