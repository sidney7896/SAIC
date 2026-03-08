import type { AthleteState, StatusReport } from "@/engine/types";

export function buildStatusReport(state: AthleteState): StatusReport {
  return {
    e1rm_summary: (["ipf", "gym", "gym_wraps"] as const)
      .map((standard) => {
        const estimate = state.e1rm[standard];

        if (!estimate) {
          return null;
        }

        return {
          standard,
          current_kg: estimate.value_kg,
          trend: estimate.trend,
          trend_change_pct: estimate.trend_change_pct,
          confidence: estimate.confidence,
          last_updated: estimate.date,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    deload_status: {
      triggers_met: state.deload_triggers.triggers_met,
      trigger_details: [
        {
          name: "e1RM drop",
          active: state.deload_triggers.e1rm_drop.active,
          current_value: `${state.deload_triggers.e1rm_drop.value.toFixed(1)}%`,
          threshold: `${state.deload_triggers.e1rm_drop.threshold}%`,
        },
        {
          name: "RPE drift",
          active: state.deload_triggers.rpe_drift.active,
          current_value: `${state.deload_triggers.rpe_drift.value.toFixed(1)} RIR`,
          threshold: `${state.deload_triggers.rpe_drift.threshold} RIR`,
        },
        {
          name: "Pain trend",
          active: state.deload_triggers.pain_trend.active,
          current_value: `${state.deload_triggers.pain_trend.value.toFixed(1)}/10`,
          threshold: `${state.deload_triggers.pain_trend.threshold}/10`,
        },
      ],
      recommendation: state.deload_triggers.deload_recommended
        ? "Deload recommended"
        : "No deload recommended",
    },
    phase_progress: {
      phase: state.current_phase,
      week: state.phase_week ?? 1,
      total_weeks:
        state.current_phase === "peaking"
          ? 10
          : state.current_phase === "builder"
            ? 12
            : 1,
      block: state.block_type,
      next_milestone:
        state.current_phase === "cut"
          ? "Protect strength while bodyweight moves toward target."
          : state.current_phase === "builder"
            ? "Next builder block checkpoint."
            : state.current_phase === "peaking"
              ? "Next peak exposure session."
              : "Next recommendation cycle.",
    },
    bodyweight: {
      current_kg: state.bodyweight_kg,
      target_kg: state.cut_state?.bw_target_kg ?? state.bodyweight_kg,
      trend: state.bodyweight_trend,
      strength_to_bw_ratio:
        state.bodyweight_kg > 0
          ? Number(((state.e1rm.gym?.value_kg ?? 0) / state.bodyweight_kg).toFixed(2))
          : 0,
    },
    recent_sessions: state.recent_sessions.map((session) => ({
      date: session.date,
      type: `${session.day_type} ${session.session_type}`,
      top_single:
        session.top_single_kg && session.top_single_rir !== undefined
          ? `${session.top_single_kg} kg x 1 @ RIR ${session.top_single_rir}`
          : "No top single",
      e1rm_kg: session.e1rm_kg ?? 0,
      pain: session.pain,
      hard_sets: session.hard_sets,
    })),
  };
}
