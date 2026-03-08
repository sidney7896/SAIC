import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSession } from "@/engine/session-generator";
import { validateSessionInput } from "@/engine/validation";
import type { SessionInput } from "@/engine/types";
import { isoDateDaysFromToday } from "../helpers/fixtures";
import { loadFreshDb, seedCutProfile, seedSession } from "../helpers/temp-db";

async function runCutPipeline(
  label: string,
  sessionSeeds: Parameters<typeof seedSession>[1][],
  inputOverrides: Partial<SessionInput> = {},
) {
  const db = await loadFreshDb(label);
  const lastTrainingDate = isoDateDaysFromToday(-1);

  await seedCutProfile(db, {
    last_training_date: lastTrainingDate,
  });

  for (const sessionSeed of sessionSeeds) {
    await seedSession(db, sessionSeed);
  }

  const input: SessionInput = {
    date: isoDateDaysFromToday(0),
    session_type: "heavy",
    day_type: "push",
    pain: {
      score: 0,
      trend: "stable",
    },
    sleep_hours: 7.5,
    bodyweight_kg: 70,
    subjective_readiness: 3,
    ...inputOverrides,
  };
  const validation = validateSessionInput(input);
  if (!validation.success || !validation.data) {
    throw new Error(`Unexpected validation failure: ${validation.errors.join(", ")}`);
  }

  const state = await db.state.computeAthleteState();
  if (!state) {
    throw new Error("Expected athlete state to be available.");
  }

  return {
    state,
    recommendation: generateSession(validation.data, state),
  };
}

describe("bench eval cases", () => {
  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  it("case 1: normal heavy day", async () => {
    const { state, recommendation } = await runCutPipeline("bench-case-1", [
      {
        date: isoDateDaysFromToday(-3),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 90,
        topSingleRir: 2,
      },
    ]);

    expect(state.current_phase).toBe("cut");
    expect(recommendation.exercises[0]).toMatchObject({
      variation: "paused",
      target_weight_kg: 90,
      target_rir_range: [1.5, 2.5],
    });
    expect(recommendation.exercises[1]).toMatchObject({
      target_weight_kg: 72.5,
      sets: 4,
    });
    expect(recommendation.exercises[2]).toMatchObject({
      exercise: "close_grip_bench",
      is_optional: true,
    });
  });

  it("case 2: safety override path escalates to a mini-deload after repeated overshoots", async () => {
    const { state, recommendation } = await runCutPipeline(
      "bench-case-2",
      [
        {
          date: isoDateDaysFromToday(-3),
          sessionType: "heavy",
          dayType: "push",
          topSingleKg: 90,
          topSingleRir: 1.5,
        },
        {
          date: isoDateDaysFromToday(-6),
          sessionType: "heavy",
          dayType: "push",
          topSingleKg: 90,
          topSingleRir: 1.5,
        },
      ],
      {
        sleep_hours: 7,
      },
    );

    expect(state.consecutive_sessions_above_target_rpe).toBe(2);
    expect(recommendation.alerts[0]).toMatchObject({
      type: "mini_deload",
      severity: "warning",
    });
    expect(recommendation.exercises).toHaveLength(2);
    expect(recommendation.exercises[1]).toMatchObject({
      sets: 3,
    });
  });

  it("case 3: deload trigger does not fire when thresholds are not met", async () => {
    const { state, recommendation } = await runCutPipeline("bench-case-3", [
      {
        date: isoDateDaysFromToday(-3),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 90,
        topSingleRir: 1.5,
        painBefore: 2,
      },
      {
        date: isoDateDaysFromToday(-7),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 90,
        topSingleRir: 2,
        painBefore: 2,
      },
      {
        date: isoDateDaysFromToday(-10),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 87.5,
        topSingleRir: 2,
        painBefore: 2,
      },
    ]);

    expect(state.deload_triggers.triggers_met).toBe(0);
    expect(recommendation.session_type).toBe("heavy");
    expect(recommendation.alerts).toEqual([]);
  });

  it("case 4: deload trigger fires when 2 of 3 thresholds are active", async () => {
    const { state, recommendation } = await runCutPipeline("bench-case-4", [
      {
        date: isoDateDaysFromToday(-3),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 90,
        topSingleRir: 1,
        painBefore: 3,
        e1rmKg: 95,
      },
      {
        date: isoDateDaysFromToday(-7),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 90,
        topSingleRir: 2.5,
        painBefore: 3,
        e1rmKg: 97,
      },
      {
        date: isoDateDaysFromToday(-10),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 92.5,
        topSingleRir: 2,
        painBefore: 3,
        e1rmKg: 100,
      },
    ]);

    expect(state.deload_triggers.triggers_met).toBe(3);
    expect(recommendation.session_type).toBe("deload");
    expect(recommendation.alerts[0]).toMatchObject({
      type: "deload_recommended",
    });
    expect(recommendation.exercises[0]).toMatchObject({
      sets: 2,
      target_rir: 3,
    });
  });

  it("case 5: comparable session matching excludes medium leg-day data from heavy-push trend checks", async () => {
    const { state } = await runCutPipeline("bench-case-5", [
      {
        date: isoDateDaysFromToday(-2),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 90,
        topSingleRir: 1.5,
        e1rmKg: 97.1,
      },
      {
        date: isoDateDaysFromToday(-5),
        sessionType: "medium",
        dayType: "legs",
        backoffSets: [
          {
            weightKg: 80,
            reps: 5,
            sets: 3,
            rir: 0,
          },
        ],
        e1rmKg: 105,
      },
      {
        date: isoDateDaysFromToday(-8),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 90,
        topSingleRir: 2,
        e1rmKg: 100,
      },
    ]);

    expect(state.deload_triggers.e1rm_drop).toMatchObject({
      active: true,
      value: 2.9,
      sessions_compared: [isoDateDaysFromToday(-8), isoDateDaysFromToday(-2)],
    });
    expect(state.last_medium_legs?.e1rm_kg).toBe(105);
  });

  it("case 7: Level 2 pain modifies the heavy day prescription", async () => {
    const { recommendation } = await runCutPipeline(
      "bench-case-7",
      [
        {
          date: isoDateDaysFromToday(-3),
          sessionType: "heavy",
          dayType: "push",
          topSingleKg: 90,
          topSingleRir: 2,
        },
      ],
      {
        pain: {
          score: 3,
          trend: "worsening",
        },
      },
    );

    expect(recommendation.exercises[0]).toMatchObject({
      target_rir: 2.5,
      target_rir_range: [2, 3],
    });
    expect(recommendation.exercises[1]).toMatchObject({
      exercise: "spoto_press",
      variation: "joint_friendly",
      sets: 2,
    });
  });

  it("case 10: leg day gets medium bench volume without a top single", async () => {
    const { recommendation } = await runCutPipeline(
      "bench-case-10",
      [
        {
          date: isoDateDaysFromToday(-3),
          sessionType: "heavy",
          dayType: "push",
          topSingleKg: 90,
          topSingleRir: 2,
        },
      ],
      {
        session_type: "medium",
        day_type: "legs",
      },
    );

    expect(recommendation.exercises).toEqual([
      expect.objectContaining({
        sets: 4,
        reps: 4,
        target_weight_kg: 65,
        target_rir_range: [3, 4],
      }),
    ]);
  });

  it("case 11: missing RIR data falls back to the most recent valid e1RM", async () => {
    const { state, recommendation } = await runCutPipeline("bench-case-11", [
      {
        date: isoDateDaysFromToday(-2),
        sessionType: "medium",
        dayType: "legs",
        backoffSets: [
          {
            weightKg: 85,
            reps: 3,
            sets: 1,
            rir: null,
          },
        ],
        e1rmKg: null,
      },
      {
        date: isoDateDaysFromToday(-5),
        sessionType: "heavy",
        dayType: "push",
        topSingleKg: 90,
        topSingleRir: 2,
      },
    ]);

    expect(state.recent_sessions[0]?.e1rm_kg).toBeUndefined();
    expect(state.e1rm.gym?.date).toBe(isoDateDaysFromToday(-5));
    expect(recommendation.state_snapshot.e1rm_gym_kg).toBe(97.8);
  });

  it("case 15: pull day keeps bench minimal", async () => {
    const { recommendation } = await runCutPipeline(
      "bench-case-15",
      [
        {
          date: isoDateDaysFromToday(-3),
          sessionType: "heavy",
          dayType: "push",
          topSingleKg: 90,
          topSingleRir: 2,
        },
      ],
      {
        session_type: "light",
        day_type: "pull",
      },
    );

    expect(recommendation.exercises).toEqual([
      expect.objectContaining({
        sets: 3,
        reps: 5,
        target_weight_kg: 57.5,
        target_rir_range: [4, 5],
      }),
    ]);
  });
});
