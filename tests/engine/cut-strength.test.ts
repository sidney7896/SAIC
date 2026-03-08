import { describe, expect, it } from "vitest";
import { evaluateCutStrength } from "@/engine/cut-strength";
import { createAthleteState } from "../helpers/fixtures";

describe("evaluateCutStrength", () => {
  it("classifies stable cut strength correctly", () => {
    const result = evaluateCutStrength(
      createAthleteState({
        cut_state: {
          e1rm_change_pct: 0,
          threshold: "stable",
          weeks_in_cut: 4,
          bw_start_kg: 72,
          bw_current_kg: 70,
          bw_target_kg: 65,
          e1rm_at_cut_start_kg: 97.8,
        },
      }),
    );

    expect(result).toEqual({
      threshold: "stable",
      action: "Continue as planned. Strength is stable during the cut.",
      drop_pct: 0,
    });
  });

  it("classifies strength loss up to 3 percent as monitor", () => {
    const result = evaluateCutStrength(
      createAthleteState({
        cut_state: {
          e1rm_change_pct: 3,
          threshold: "monitor",
          weeks_in_cut: 4,
          bw_start_kg: 72,
          bw_current_kg: 70,
          bw_target_kg: 65,
          e1rm_at_cut_start_kg: 97.8,
        },
      }),
    );

    expect(result).toEqual({
      threshold: "monitor",
      action: "Monitor the next comparable session before changing training stress.",
      drop_pct: 3,
    });
  });

  it("classifies 3 to 5 percent loss without RPE drift as monitor", () => {
    const result = evaluateCutStrength(
      createAthleteState({
        cut_state: {
          e1rm_change_pct: 4.4,
          threshold: "warning",
          weeks_in_cut: 4,
          bw_start_kg: 72,
          bw_current_kg: 70,
          bw_target_kg: 65,
          e1rm_at_cut_start_kg: 97.8,
        },
      }),
    );

    expect(result).toEqual({
      threshold: "monitor",
      action: "Close to the warning zone. Watch RPE drift and bodyweight loss rate.",
      drop_pct: 4.4,
    });
  });

  it("classifies 3 to 5 percent loss with RPE drift as warning", () => {
    const result = evaluateCutStrength(
      createAthleteState({
        deload_triggers: {
          e1rm_drop: {
            active: false,
            value: 0,
            threshold: 2,
            sessions_compared: [],
          },
          rpe_drift: {
            active: true,
            value: 1,
            threshold: 1,
            sessions_compared: ["2026-03-01", "2026-03-05"],
          },
          pain_trend: {
            active: false,
            value: 0,
            threshold: 3,
            sessions_compared: [],
          },
          triggers_met: 1,
          deload_recommended: false,
        },
        cut_state: {
          e1rm_change_pct: 4.4,
          threshold: "warning",
          weeks_in_cut: 4,
          bw_start_kg: 72,
          bw_current_kg: 70,
          bw_target_kg: 65,
          e1rm_at_cut_start_kg: 97.8,
        },
      }),
    );

    expect(result).toEqual({
      threshold: "warning",
      action: "Reduce volume by 20% and watch the next comparable heavy session.",
      drop_pct: 4.4,
    });
  });

  it("classifies losses above 5 percent as red flag", () => {
    const result = evaluateCutStrength(
      createAthleteState({
        cut_state: {
          e1rm_change_pct: 5.1,
          threshold: "red_flag",
          weeks_in_cut: 4,
          bw_start_kg: 72,
          bw_current_kg: 70,
          bw_target_kg: 65,
          e1rm_at_cut_start_kg: 97.8,
        },
      }),
    );

    expect(result).toEqual({
      threshold: "red_flag",
      action: "Deload and reassess the deficit if strength loss exceeds 5%.",
      drop_pct: 5.1,
    });
  });

  it("returns null outside the cut phase", () => {
    expect(
      evaluateCutStrength(
        createAthleteState({
          current_phase: "builder",
          cut_state: undefined,
        }),
      ),
    ).toBeNull();
  });
});
