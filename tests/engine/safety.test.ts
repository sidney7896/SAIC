import { afterEach, describe, expect, it, vi } from "vitest";
import { applyPainProtocol, checkSafetyGate } from "@/engine/safety";
import { createAthleteState, createSessionInput, isoDateDaysFromToday } from "../helpers/fixtures";
import { loadFreshDb, seedCutProfile, seedSession } from "../helpers/temp-db";

describe("checkSafetyGate", () => {
  it("proceeds when pain is low and no deload conditions are active", () => {
    const result = checkSafetyGate(createSessionInput(), createAthleteState());

    expect(result).toEqual({
      decision: "proceed",
      painLevel: {
        level: 1,
        action: "proceed",
        summary: "Pain and deload checks allow normal training.",
      },
      preferJointFriendly: false,
      alerts: [],
      reason: "No safety gate modifications are required.",
    });
  });

  it("modifies training for Level 2 pain", () => {
    const result = checkSafetyGate(
      createSessionInput({
        pain: {
          score: 3,
        },
      }),
      createAthleteState(),
    );

    expect(result.decision).toBe("modify");
    expect(result.preferJointFriendly).toBe(true);
    expect(result.painLevel).toEqual({
      level: 2,
      action: "modify",
      summary: "Pain requires lower volume, easier effort, and friendlier variations.",
    });
    expect(result.alerts[0]).toMatchObject({
      type: "pain_escalation",
      severity: "warning",
    });
  });

  it("deloads when two or more deload triggers are active", () => {
    const result = checkSafetyGate(
      createSessionInput(),
      createAthleteState({
        deload_triggers: {
          e1rm_drop: {
            active: true,
            value: 2.5,
            threshold: 2,
            sessions_compared: ["2026-03-01", "2026-03-08"],
          },
          rpe_drift: {
            active: true,
            value: 1.5,
            threshold: 1,
            sessions_compared: ["2026-03-01", "2026-03-08"],
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

    expect(result.decision).toBe("deload");
    expect(result.preferJointFriendly).toBe(false);
    expect(result.alerts[0]).toMatchObject({
      type: "deload_recommended",
      severity: "warning",
    });
  });

  it("uses a mini-deload when consecutive heavy sessions overshoot target RPE", () => {
    const result = checkSafetyGate(
      createSessionInput(),
      createAthleteState({
        consecutive_sessions_above_target_rpe: 2,
      }),
    );

    expect(result.decision).toBe("mini_deload");
    expect(result.preferJointFriendly).toBe(false);
    expect(result.alerts[0]).toMatchObject({
      type: "mini_deload",
      severity: "warning",
    });
  });

  it("merges the Level 2 joint-friendly variant into a deload when pain is 3 to 4", () => {
    const result = checkSafetyGate(
      createSessionInput({
        pain: {
          score: 4,
        },
      }),
      createAthleteState({
        deload_triggers: {
          e1rm_drop: {
            active: true,
            value: 3,
            threshold: 2,
            sessions_compared: ["2026-03-01", "2026-03-08"],
          },
          rpe_drift: {
            active: true,
            value: 1.5,
            threshold: 1,
            sessions_compared: ["2026-03-01", "2026-03-08"],
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

    expect(result.decision).toBe("deload");
    expect(result.preferJointFriendly).toBe(true);
    expect(result.alerts[0]?.message).toContain("joint-friendly");
  });

  it("stops immediately when pain reaches the Level 3 threshold", () => {
    const result = checkSafetyGate(
      createSessionInput({
        pain: {
          score: 5,
        },
      }),
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
            active: true,
            value: 4,
            threshold: 3,
            sessions_compared: [],
          },
          triggers_met: 3,
          deload_recommended: true,
        },
      }),
    );

    expect(result.decision).toBe("stop");
    expect(result.preferJointFriendly).toBe(false);
    expect(result.alerts[0]).toMatchObject({
      type: "pain_escalation",
      severity: "critical",
    });
    expect(result.reason).toBe("Pain score requires an immediate stop.");
  });
});

describe("applyPainProtocol", () => {
  it("maps Level 1 pain correctly", () => {
    expect(applyPainProtocol(2)).toEqual({
      level: 1,
      action: "proceed",
      summary: "Pain is low enough to continue as planned.",
    });
  });

  it("maps Level 2 pain correctly", () => {
    expect(applyPainProtocol(4)).toEqual({
      level: 2,
      action: "modify",
      summary: "Pain requires lower volume, easier effort, and friendlier variations.",
    });
  });

  it("maps Level 3 pain correctly", () => {
    expect(applyPainProtocol(5)).toEqual({
      level: 3,
      action: "stop",
      summary: "Pain is at the stop threshold for benching.",
    });
  });

  it("maps Level 4 pain correctly", () => {
    expect(applyPainProtocol(8)).toEqual({
      level: 4,
      action: "seek_medical_attention",
      summary: "Pain is severe enough to treat as an acute red flag.",
    });
  });
});

describe("computeAthleteState mini-deload streaks", () => {
  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  it("fires a mini-deload after two consecutive sessions at RIR 1.5", async () => {
    const db = await loadFreshDb("safety-rir-15");
    const lastTrainingDate = isoDateDaysFromToday(-1);
    await seedCutProfile(db, {
      last_training_date: lastTrainingDate,
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-1),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 1.5,
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-4),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 1.5,
    });

    const state = await db.state.computeAthleteState();

    expect(state?.consecutive_sessions_above_target_rpe).toBe(2);
    expect(checkSafetyGate(createSessionInput(), state!).decision).toBe("mini_deload");
  });

  it("does not fire a mini-deload when the recent sessions are at RIR 2.0", async () => {
    const db = await loadFreshDb("safety-rir-20");
    const lastTrainingDate = isoDateDaysFromToday(-1);
    await seedCutProfile(db, {
      last_training_date: lastTrainingDate,
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-1),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 2,
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-4),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 2,
    });

    const state = await db.state.computeAthleteState();

    expect(state?.consecutive_sessions_above_target_rpe).toBe(0);
    expect(checkSafetyGate(createSessionInput(), state!).decision).toBe("proceed");
  });

  it("resets the streak when a hard session is followed by a session at RIR 2.0", async () => {
    const db = await loadFreshDb("safety-streak-reset");
    const lastTrainingDate = isoDateDaysFromToday(-1);
    await seedCutProfile(db, {
      last_training_date: lastTrainingDate,
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-1),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 2,
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-4),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 1,
    });

    const state = await db.state.computeAthleteState();

    expect(state?.consecutive_sessions_above_target_rpe).toBe(0);
    expect(checkSafetyGate(createSessionInput(), state!).decision).toBe("proceed");
  });
});
