import type { AthleteState, CutStrengthResult } from "@/engine/types";

export function evaluateCutStrength(
  state: AthleteState,
): CutStrengthResult | null {
  if (state.current_phase !== "cut" || !state.cut_state) {
    return null;
  }

  const dropPct = state.cut_state.e1rm_change_pct;

  if (dropPct <= 0) {
    return {
      threshold: "stable",
      action: "Continue as planned. Strength is stable during the cut.",
      drop_pct: 0,
    };
  }

  if (dropPct <= 3) {
    return {
      threshold: "monitor",
      action: "Monitor the next comparable session before changing training stress.",
      drop_pct: dropPct,
    };
  }

  if (dropPct <= 5) {
    return {
      threshold: state.deload_triggers.rpe_drift.active ? "warning" : "monitor",
      action: state.deload_triggers.rpe_drift.active
        ? "Reduce volume by 20% and watch the next comparable heavy session."
        : "Close to the warning zone. Watch RPE drift and bodyweight loss rate.",
      drop_pct: dropPct,
    };
  }

  return {
    threshold: "red_flag",
    action: "Deload and reassess the deficit if strength loss exceeds 5%.",
    drop_pct: dropPct,
  };
}
