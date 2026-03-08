import { RPE_TABLE } from "@/engine/constants";
import type { E1rmResult } from "@/engine/types";

export function calculateE1rm(
  weightKg: number,
  reps: number,
  rir: number | null,
): E1rmResult {
  if (reps === 1 && rir !== null) {
    const rpe = Number((10 - rir).toFixed(1));
    const pct = RPE_TABLE[rpe];

    if (!pct) {
      return {
        valueKg: null,
        method: "unavailable",
        confidence: null,
        reason: "RPE is outside the supported table range.",
      };
    }

    return {
      valueKg: Number((weightKg / pct).toFixed(1)),
      method: "rpe_table",
      confidence: "high",
    };
  }

  if (reps > 1 && reps <= 10 && rir !== null) {
    const rirAdjustedReps = reps + rir;
    const epley = weightKg * (1 + rirAdjustedReps / 30);

    return {
      valueKg: Number(epley.toFixed(1)),
      method: "epley",
      confidence: "medium",
    };
  }

  return {
    valueKg: null,
    method: "unavailable",
    confidence: null,
    reason: "Insufficient intensity data for an e1RM estimate.",
  };
}
