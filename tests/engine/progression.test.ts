import { describe, expect, it } from "vitest";
import { evaluateProgression } from "@/engine/progression";
import { createRecentSession } from "../helpers/fixtures";

describe("progression logic", () => {
  it("increases the top single target when the last session was below target RPE", () => {
    const result = evaluateProgression(
      createRecentSession({
        top_single_rir: 3,
      }),
      2,
    );

    expect(result).toEqual({
      action: "increase",
      changeKg: 2.5,
      reason: "Last comparable single was easier than target.",
    });
  });

  it("holds the top single target when the last session hit target RPE", () => {
    const result = evaluateProgression(
      createRecentSession({
        top_single_rir: 2,
      }),
      2,
    );

    expect(result).toEqual({
      action: "hold",
      changeKg: 0,
      reason: "Last comparable single matched the target effort closely.",
    });
  });

  it("decreases the top single target when the last session exceeded target RPE", () => {
    const result = evaluateProgression(
      createRecentSession({
        top_single_rir: 1,
      }),
      2,
    );

    expect(result).toEqual({
      action: "decrease",
      changeKg: -2.5,
      reason: "Last comparable single was harder than target.",
    });
  });

  it("holds when the prior single is within the +/-0.5 RIR tolerance band", () => {
    const result = evaluateProgression(
      createRecentSession({
        top_single_rir: 1.5,
      }),
      2,
    );

    expect(result.action).toBe("hold");
    expect(result.changeKg).toBe(0);
  });

  it("holds when the last comparable session is missing RIR data", () => {
    const result = evaluateProgression(
      createRecentSession({
        top_single_rir: undefined,
      }),
      2,
    );

    expect(result).toEqual({
      action: "hold",
      changeKg: 0,
      reason: "No top single RIR available from the last comparable session.",
    });
  });
});
