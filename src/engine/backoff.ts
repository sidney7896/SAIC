import { BACKOFF_TABLE } from "@/engine/constants";
import { roundToNearestPlate } from "@/lib/number";
import type { BlockType, Phase } from "@/engine/types";

export function computeBackoffWeight(
  e1rmKg: number,
  block: BlockType,
  phase: Phase,
): number {
  const range = BACKOFF_TABLE[block];
  const pct = phase === "cut" ? range.min : (range.min + range.max) / 2;

  return roundToNearestPlate(e1rmKg * pct);
}
