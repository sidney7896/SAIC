import type {
  AthleteState,
  BenchStandard,
  E1rmEstimate,
  RecentSession,
  SessionInput,
} from "@/engine/types";

function createE1rmEstimate(
  valueKg = 97.8,
  overrides: Partial<E1rmEstimate> = {},
): E1rmEstimate {
  return {
    value_kg: valueKg,
    date: "2026-03-05",
    confidence: "high",
    method: "rpe_table",
    trend: "flat",
    trend_sessions: 3,
    trend_change_pct: 0,
    ...overrides,
  };
}

export function createRecentSession(
  overrides: Partial<RecentSession> = {},
): RecentSession {
  return {
    date: "2026-03-05",
    session_type: "heavy",
    day_type: "push",
    top_single_kg: 90,
    top_single_rir: 2,
    e1rm_kg: 97.8,
    bench_standard: "gym",
    pain: 0,
    hard_sets: 4,
    notes: "Test fixture",
    ...overrides,
  };
}

export function createAthleteState(
  overrides: Partial<AthleteState> = {},
): AthleteState {
  const lastHeavyPush = createRecentSession();
  const lastMediumLegs = createRecentSession({
    date: "2026-03-03",
    session_type: "medium",
    day_type: "legs",
    top_single_kg: undefined,
    top_single_rir: undefined,
    e1rm_kg: 95,
  });

  return {
    current_phase: "cut",
    phase_week: 1,
    block_type: "accumulation",
    cycle_number: 1,
    e1rm: {
      gym: createE1rmEstimate(),
      ipf: createE1rmEstimate(92.5),
      gym_wraps: createE1rmEstimate(102.5),
    },
    deload_triggers: {
      e1rm_drop: {
        active: false,
        value: 0,
        threshold: 2,
        sessions_compared: [],
      },
      rpe_drift: {
        active: false,
        value: 0,
        threshold: 1,
        sessions_compared: [],
      },
      pain_trend: {
        active: false,
        value: 0,
        threshold: 3,
        sessions_compared: [],
      },
      triggers_met: 0,
      deload_recommended: false,
    },
    cut_state: {
      e1rm_change_pct: 0,
      threshold: "stable",
      weeks_in_cut: 4,
      bw_start_kg: 72,
      bw_current_kg: 70,
      bw_target_kg: 65,
      e1rm_at_cut_start_kg: 97.8,
    },
    recent_sessions: [lastHeavyPush, lastMediumLegs],
    last_heavy_push: lastHeavyPush,
    last_medium_legs: lastMediumLegs,
    days_since_last_bench: 3,
    bodyweight_kg: 70,
    bodyweight_trend: "losing",
    consecutive_sessions_above_target_rpe: 0,
    last_pain_scores: [0, 0, 0, 0, 0],
    ...overrides,
  };
}

export function createSessionInput(
  overrides: Partial<SessionInput> = {},
): SessionInput {
  return {
    date: "2026-03-08",
    session_type: "heavy",
    day_type: "push",
    pain: {
      score: 0,
      trend: "stable",
    },
    sleep_hours: 7.5,
    bodyweight_kg: 70,
    subjective_readiness: 3,
    notes: "Test fixture",
    ...overrides,
  };
}

export function isoDateDaysFromToday(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

export function buildE1rm(
  valueKg: number,
  standard: BenchStandard = "gym",
) {
  return {
    [standard]: createE1rmEstimate(valueKg),
  };
}
