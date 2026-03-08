import { findComparableSessions } from "@/engine/comparable-sessions";
import { average } from "@/lib/number";
import type { AthleteState, DeloadTriggerResult } from "@/engine/types";

export function evaluateDeloadTriggers(
  state: AthleteState,
): DeloadTriggerResult {
  const latestHeavy = state.last_heavy_push;
  const comparable = latestHeavy
    ? findComparableSessions(
        {
          session_type: latestHeavy.session_type,
          day_type: latestHeavy.day_type,
          bench_standard: latestHeavy.bench_standard,
        },
        state.recent_sessions,
        3,
      )
    : { sessions: [], confidence: "low" as const };

  const newestComparable = comparable.sessions[0];
  const oldestComparable = comparable.sessions[comparable.sessions.length - 1];

  const e1rmDropValue =
    newestComparable?.e1rm_kg !== undefined &&
    oldestComparable?.e1rm_kg !== undefined &&
    oldestComparable.e1rm_kg > 0
      ? Number(
          (
            ((oldestComparable.e1rm_kg - newestComparable.e1rm_kg) /
              oldestComparable.e1rm_kg) *
            100
          ).toFixed(1),
        )
      : 0;

  const recentSingles = comparable.sessions.filter(
    (session) => session.top_single_kg !== undefined && session.top_single_rir !== undefined,
  );
  let rpeDriftValue = 0;
  let rpeDriftSessions: string[] = [];

  for (let index = 0; index < recentSingles.length - 1; index += 1) {
    const current = recentSingles[index];
    const previous = recentSingles[index + 1];

    if (
      current.top_single_kg !== undefined &&
      previous.top_single_kg !== undefined &&
      Math.abs(current.top_single_kg - previous.top_single_kg) <= 2.5 &&
      current.top_single_rir !== undefined &&
      previous.top_single_rir !== undefined
    ) {
      const drift = Number(
        (previous.top_single_rir - current.top_single_rir).toFixed(1),
      );

      if (drift > rpeDriftValue) {
        rpeDriftValue = drift;
        rpeDriftSessions = [previous.date, current.date];
      }
    }
  }

  const painTrendValue = Number(average(state.last_pain_scores.slice(0, 5)).toFixed(1));
  const details: DeloadTriggerResult["details"] = [
    {
      name: "e1rm_drop",
      active: e1rmDropValue >= 2,
      value: e1rmDropValue,
      threshold: 2,
      sessions_compared:
        comparable.sessions.length >= 2
          ? [oldestComparable.date, newestComparable.date]
          : [],
    },
    {
      name: "rpe_drift",
      active: rpeDriftValue >= 1,
      value: rpeDriftValue,
      threshold: 1,
      sessions_compared: rpeDriftSessions,
    },
    {
      name: "pain_trend",
      active: painTrendValue >= 3,
      value: painTrendValue,
      threshold: 3,
      sessions_compared: state.recent_sessions.slice(0, 5).map((session) => session.date),
    },
  ];
  const triggersMet = details.filter((detail) => detail.active).length;

  return {
    triggers_met: triggersMet,
    deload_recommended: triggersMet >= 2,
    details,
  };
}
