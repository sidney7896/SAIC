import type { BlockType, RotationSlot } from "@/engine/types";

export const RPE_TABLE: Record<number, number> = {
  6: 0.86,
  6.5: 0.875,
  7: 0.89,
  7.5: 0.905,
  8: 0.92,
  8.5: 0.94,
  9: 0.96,
  9.5: 0.98,
  10: 1,
};

export const VOLUME_TABLE: Record<
  BlockType,
  Record<string, number | "transition">
> = {
  accumulation: {
    W1: 17,
    W2: 19,
    W3: 21,
    W4: 10,
  },
  intensification: {
    W5: 17,
    W6: 17,
    W7: 17,
    W8: 10,
  },
  realization: {
    W9: 14,
    W10: 8,
    W11: 14,
    W12: "transition",
  },
};

export const ROTATION_TABLE: Record<BlockType, Record<RotationSlot, string>> = {
  accumulation: {
    heavy_a: "comp_paused",
    medium_a: "close_grip",
    heavy_b: "paused_bench",
    medium_b: "spoto",
    light_a: "comp_tng",
    light_b: "speed_bench",
  },
  intensification: {
    heavy_a: "comp_paused",
    medium_a: "feet_up",
    heavy_b: "larsen_press",
    medium_b: "cg_paused",
    light_a: "comp_tng",
    light_b: "speed_bench",
  },
  realization: {
    heavy_a: "comp_paused",
    medium_a: "close_grip",
    heavy_b: "comp_paused",
    medium_b: "spoto",
    light_a: "comp_tng",
    light_b: "speed_bench",
  },
};

export const PEAKING_TABLE: Record<
  number,
  { hard_sets: number; top_single_rpe: number; focus: string }
> = {
  10: { hard_sets: 16, top_single_rpe: 7.5, focus: "volume base" },
  9: { hard_sets: 16, top_single_rpe: 8, focus: "building intensity" },
  8: { hard_sets: 14, top_single_rpe: 8, focus: "introduce Spoto" },
  7: { hard_sets: 15, top_single_rpe: 8.5, focus: "heavy doubles" },
  6: { hard_sets: 14, top_single_rpe: 8.5, focus: "intensity up" },
  5: { hard_sets: 13, top_single_rpe: 9, focus: "clean single, drop D" },
  4: { hard_sets: 12, top_single_rpe: 9, focus: "last heavy week" },
  3: { hard_sets: 10, top_single_rpe: 8.5, focus: "peak exposure" },
  2: { hard_sets: 3, top_single_rpe: 8, focus: "opener check, taper" },
  1: { hard_sets: 0, top_single_rpe: 5.5, focus: "light technique, rest" },
};

export const BACKOFF_TABLE: Record<BlockType, { min: number; max: number }> = {
  accumulation: { min: 0.74, max: 0.79 },
  intensification: { min: 0.8, max: 0.86 },
  realization: { min: 0.86, max: 0.9 },
};
