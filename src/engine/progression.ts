import { computeBackoffWeight as computeBackoffWeightByPhase } from "@/engine/backoff";
import { roundToNearestPlate } from "@/lib/number";
import type {
  AthleteState,
  BlockType,
  ProgressionAction,
  RecentSession,
} from "@/engine/types";

export function computeTopSingleTarget(
  state: AthleteState,
  block: BlockType,
  week: number,
): number {
  const baseE1rm = state.e1rm.gym?.value_kg ?? 0;
  const targetPct =
    block === "accumulation"
      ? 0.92
      : block === "intensification"
        ? 0.94
        : 0.96;
  const weekAdjustment = week > 0 && week % 4 === 0 ? -2.5 : 0;

  return roundToNearestPlate(baseE1rm * targetPct + weekAdjustment);
}

export function computeBackoffWeight(
  state: AthleteState,
  block: BlockType,
): number {
  const baseE1rm = state.e1rm.gym?.value_kg ?? 0;

  return computeBackoffWeightByPhase(baseE1rm, block, state.current_phase);
}

export function evaluateProgression(
  lastSession: RecentSession,
  targetRir: number,
): ProgressionAction {
  if (lastSession.top_single_rir === undefined) {
    return {
      action: "hold",
      changeKg: 0,
      reason: "No top single RIR available from the last comparable session.",
    };
  }

  if (lastSession.top_single_rir > targetRir + 0.5) {
    return {
      action: "increase",
      changeKg: 2.5,
      reason: "Last comparable single was easier than target.",
    };
  }

  if (lastSession.top_single_rir < targetRir - 0.5) {
    return {
      action: "decrease",
      changeKg: -2.5,
      reason: "Last comparable single was harder than target.",
    };
  }

  return {
    action: "hold",
    changeKg: 0,
    reason: "Last comparable single matched the target effort closely.",
  };
}
