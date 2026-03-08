import { describe, expect, it } from "vitest";
import { resolvePhase } from "@/engine/phase";
import type { AthleteProfile } from "@/engine/types";
import { isoDateDaysFromToday } from "../helpers/fixtures";

function buildProfile(overrides: AthleteProfile = {}): AthleteProfile {
  return {
    currentPhaseOverride: undefined,
    isInCaloricDeficit: false,
    testDayDate: "2026-08-29",
    lastTrainingDate: isoDateDaysFromToday(-1),
    ...overrides,
  };
}

describe("resolvePhase", () => {
  it("resolves date-based phases correctly", () => {
    expect(
      resolvePhase(
        "2026-08-29",
        buildProfile({
          lastTrainingDate: "2026-08-28",
        }),
      ),
    ).toMatchObject({
      current_phase: "test_day",
    });
    expect(
      resolvePhase(
        "2026-09-10",
        buildProfile({
          lastTrainingDate: "2026-09-09",
        }),
      ),
    ).toMatchObject({
      current_phase: "pivot",
    });
    expect(
      resolvePhase(
        "2026-08-01",
        buildProfile({
          lastTrainingDate: "2026-07-31",
        }),
      ),
    ).toMatchObject({
      current_phase: "peaking",
      phase_week: 7,
    });
    expect(
      resolvePhase(
        "2026-03-08",
        buildProfile({
          lastTrainingDate: "2026-03-07",
        }),
      ),
    ).toMatchObject({
      current_phase: "builder",
      block_type: "accumulation",
      phase_week: 1,
      cycle_number: 1,
    });
  });

  it("applies override priority correctly", () => {
    const profile = buildProfile({
      currentPhaseOverride: "builder",
      isInCaloricDeficit: true,
      lastTrainingDate: "2026-08-20",
    });

    expect(resolvePhase("2026-08-29", profile).current_phase).toBe("test_day");
    expect(resolvePhase("2026-09-05", profile).current_phase).toBe("pivot");
  });

  it("respects manual profile phase overrides when no higher-priority phase applies", () => {
    const result = resolvePhase(
      "2026-03-08",
      buildProfile({
        currentPhaseOverride: "peaking",
      }),
    );

    expect(result).toEqual({
      current_phase: "peaking",
      override_reason: "Manual profile phase override.",
    });
  });

  it("uses the caloric deficit override ahead of builder logic", () => {
    const result = resolvePhase(
      "2026-03-08",
      buildProfile({
        isInCaloricDeficit: true,
      }),
    );

    expect(result).toEqual({
      current_phase: "cut",
      block_type: "accumulation",
      phase_week: 1,
      override_reason: "Profile indicates an active caloric deficit.",
    });
  });

  it("switches to transition when more than 7 days have passed since the last session", () => {
    const result = resolvePhase(
      "2026-03-08",
      buildProfile({
        isInCaloricDeficit: true,
        lastTrainingDate: "2026-02-27",
      }),
    );

    expect(result).toEqual({
      current_phase: "transition",
      override_reason: "More than 7 days have passed since the last bench session.",
    });
  });
});
