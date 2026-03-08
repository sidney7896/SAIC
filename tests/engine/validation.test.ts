import { describe, expect, it } from "vitest";
import { validateSessionInput } from "@/engine/validation";
import { createSessionInput } from "../helpers/fixtures";

describe("validateSessionInput", () => {
  it("accepts valid session input", () => {
    const input = createSessionInput();
    const result = validateSessionInput(input);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toEqual(input);
  });

  it("rejects missing required fields", () => {
    const result = validateSessionInput({
      pain: { score: 0 },
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Date is required.",
        "Session type must be heavy, medium, light, or test.",
        "Day type must be push, pull, or legs.",
      ]),
    );
  });

  it("rejects invalid pain scores", () => {
    const result = validateSessionInput(
      createSessionInput({
        pain: {
          score: 11,
        },
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Pain score must be a number between 0 and 10.");
  });

  it("rejects invalid session types", () => {
    const result = validateSessionInput({
      ...createSessionInput(),
      session_type: "recovery",
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Session type must be heavy, medium, light, or test.");
  });

  it("rejects invalid day types", () => {
    const result = validateSessionInput({
      ...createSessionInput(),
      day_type: "upper",
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Day type must be push, pull, or legs.");
  });

  it("rejects invalid top single values", () => {
    const result = validateSessionInput(
      createSessionInput({
        actual_result: {
          top_single: {
            weight_kg: 0,
            reps: 1,
            rir: 1.2,
            bench_standard: "gym",
            failed: false,
          },
        },
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Top single weight must be greater than 0.",
        "Top single RIR must be between 0 and 5 in 0.5 steps.",
      ]),
    );
  });

  it("rejects out-of-range sleep hours", () => {
    const result = validateSessionInput(
      createSessionInput({
        sleep_hours: 25,
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Sleep hours must be between 0 and 24.");
  });

  it("rejects out-of-range bodyweight values", () => {
    const result = validateSessionInput(
      createSessionInput({
        bodyweight_kg: 39,
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Bodyweight must be between 40 and 200 kg.");
  });
});
