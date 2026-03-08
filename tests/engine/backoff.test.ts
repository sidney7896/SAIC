import { describe, expect, it } from "vitest";
import { computeBackoffWeight } from "@/engine/backoff";

describe("computeBackoffWeight", () => {
  it("calculates accumulation back-off weights from the midpoint range outside a cut", () => {
    expect(computeBackoffWeight(100, "accumulation", "builder")).toBe(77.5);
  });

  it("calculates intensification back-off weights from the midpoint range outside a cut", () => {
    expect(computeBackoffWeight(100, "intensification", "builder")).toBe(82.5);
  });

  it("calculates realization back-off weights from the midpoint range outside a cut", () => {
    expect(computeBackoffWeight(100, "realization", "builder")).toBe(87.5);
  });

  it("rounds back-off weights to the nearest 2.5 kilograms", () => {
    expect(computeBackoffWeight(97.8, "accumulation", "builder")).toBe(75);
  });

  it("uses the lower end of the range during a cut", () => {
    expect(computeBackoffWeight(100, "intensification", "cut")).toBe(80);
  });
});
