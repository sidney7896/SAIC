import { describe, expect, it } from "vitest";
import { generateSession } from "@/engine/session-generator";
import { createAthleteState, createSessionInput, createRecentSession } from "../helpers/fixtures";

describe("generateSession (cut phase)", () => {
  it("builds the heavy push prescription with a paused top single", () => {
    const recommendation = generateSession(
      createSessionInput(),
      createAthleteState({
        last_heavy_push: createRecentSession({
          top_single_rir: 2,
          e1rm_kg: 97.8,
        }),
      }),
    );

    expect(recommendation.session_type).toBe("heavy");
    expect(recommendation.warmup).toHaveLength(5);
    expect(recommendation.exercises).toHaveLength(3);
    expect(recommendation.exercises[0]).toMatchObject({
      exercise: "flat_bench",
      variation: "paused",
      sets: 1,
      reps: 1,
      target_weight_kg: 90,
      target_rir: 2,
      target_rir_range: [1.5, 2.5],
    });
    expect(recommendation.exercises[1]).toMatchObject({
      exercise: "flat_bench",
      variation: "touch_and_go",
      sets: 4,
      reps: 4,
      target_weight_kg: 72.5,
      target_rir: 2,
    });
    expect(recommendation.exercises[2]).toMatchObject({
      exercise: "close_grip_bench",
      is_optional: true,
      target_weight_kg: 67.5,
    });
  });

  it("builds the leg-day medium bench prescription without a top single", () => {
    const recommendation = generateSession(
      createSessionInput({
        session_type: "medium",
        day_type: "legs",
      }),
      createAthleteState(),
    );

    expect(recommendation.exercises).toEqual([
      expect.objectContaining({
        exercise: "flat_bench",
        variation: "touch_and_go",
        sets: 4,
        reps: 4,
        target_weight_kg: 65,
        target_rir: 3.5,
        target_rir_range: [3, 4],
      }),
    ]);
  });

  it("builds the pull-day minimal bench prescription", () => {
    const recommendation = generateSession(
      createSessionInput({
        session_type: "light",
        day_type: "pull",
      }),
      createAthleteState(),
    );

    expect(recommendation.exercises).toEqual([
      expect.objectContaining({
        exercise: "flat_bench",
        variation: "touch_and_go",
        sets: 3,
        reps: 5,
        target_weight_kg: 57.5,
        target_rir: 4,
        target_rir_range: [4, 5],
      }),
    ]);
  });

  it("adds 2.5 kg on an opportunity day", () => {
    const recommendation = generateSession(
      createSessionInput({
        sleep_hours: 8,
        subjective_readiness: 4,
      }),
      createAthleteState(),
    );

    expect(recommendation.exercises[0]?.target_weight_kg).toBe(92.5);
  });

  it("removes 2.5 kg on a bad day", () => {
    const recommendation = generateSession(
      createSessionInput({
        sleep_hours: 5.5,
        subjective_readiness: 2,
      }),
      createAthleteState(),
    );

    expect(recommendation.exercises[0]?.target_weight_kg).toBe(87.5);
  });

  it("applies Level 2 pain modifications with a joint-friendly back-off variant", () => {
    const recommendation = generateSession(
      createSessionInput({
        pain: {
          score: 3,
        },
      }),
      createAthleteState(),
    );

    expect(recommendation.exercises).toHaveLength(2);
    expect(recommendation.exercises[0]).toMatchObject({
      target_weight_kg: 87.5,
      target_rir: 2.5,
      target_rir_range: [2, 3],
    });
    expect(recommendation.exercises[1]).toMatchObject({
      exercise: "spoto_press",
      variation: "joint_friendly",
      sets: 2,
      target_rir: 2.5,
    });
    expect(recommendation.alerts[0]).toMatchObject({
      type: "pain_escalation",
      severity: "warning",
    });
  });

  it("applies deload modifiers when the 2-of-3 rule fires", () => {
    const recommendation = generateSession(
      createSessionInput(),
      createAthleteState({
        deload_triggers: {
          e1rm_drop: {
            active: true,
            value: 3,
            threshold: 2,
            sessions_compared: [],
          },
          rpe_drift: {
            active: true,
            value: 1,
            threshold: 1,
            sessions_compared: [],
          },
          pain_trend: {
            active: false,
            value: 1,
            threshold: 3,
            sessions_compared: [],
          },
          triggers_met: 2,
          deload_recommended: true,
        },
      }),
    );

    expect(recommendation.session_type).toBe("deload");
    expect(recommendation.exercises).toEqual([
      expect.objectContaining({
        sets: 2,
        target_rir: 3,
        target_rir_range: [2.5, 3.5],
      }),
      expect.objectContaining({
        sets: 2,
        target_rir: 3,
        target_rir_range: [2.5, 3.5],
      }),
    ]);
    expect(recommendation.alerts[0]).toMatchObject({
      type: "deload_recommended",
      severity: "warning",
    });
  });
});
