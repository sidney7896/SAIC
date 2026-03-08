import { describe, expect, it } from "vitest";
import { evaluateDeloadTriggers } from "@/engine/deload-triggers";
import { createAthleteState, createRecentSession } from "../helpers/fixtures";

function buildState(
  sessions = [
    createRecentSession({
      date: "2026-03-08",
      top_single_kg: 90,
      top_single_rir: 2,
      e1rm_kg: 100,
      pain: 0,
    }),
    createRecentSession({
      date: "2026-03-01",
      top_single_kg: 90,
      top_single_rir: 2.5,
      e1rm_kg: 100,
      pain: 1,
    }),
    createRecentSession({
      date: "2026-02-22",
      top_single_kg: 92.5,
      top_single_rir: 2,
      e1rm_kg: 100,
      pain: 2,
    }),
  ],
  painScores = sessions.slice(0, 5).map((session) => session.pain),
) {
  return createAthleteState({
    recent_sessions: sessions,
    last_heavy_push: sessions[0],
    last_pain_scores: painScores,
  });
}

describe("evaluateDeloadTriggers", () => {
  it("returns 0 of 3 triggers when no thresholds are met", () => {
    const result = evaluateDeloadTriggers(buildState());

    expect(result.triggers_met).toBe(0);
    expect(result.deload_recommended).toBe(false);
    expect(result.details).toEqual([
      {
        name: "e1rm_drop",
        active: false,
        value: 0,
        threshold: 2,
        sessions_compared: ["2026-02-22", "2026-03-08"],
      },
      {
        name: "rpe_drift",
        active: false,
        value: 0.5,
        threshold: 1,
        sessions_compared: ["2026-03-01", "2026-03-08"],
      },
      {
        name: "pain_trend",
        active: false,
        value: 1,
        threshold: 3,
        sessions_compared: ["2026-03-08", "2026-03-01", "2026-02-22"],
      },
    ]);
  });

  it("returns 1 of 3 triggers when only one threshold is met", () => {
    const result = evaluateDeloadTriggers(
      buildState(undefined, [3, 3, 3, 3, 3]),
    );

    expect(result.triggers_met).toBe(1);
    expect(result.deload_recommended).toBe(false);
    expect(result.details.find((detail) => detail.name === "pain_trend")).toMatchObject({
      active: true,
      value: 3,
      threshold: 3,
    });
  });

  it("returns 2 of 3 triggers and recommends a deload", () => {
    const result = evaluateDeloadTriggers(
      buildState(
        [
          createRecentSession({
            date: "2026-03-08",
            top_single_kg: 90,
            top_single_rir: 1.5,
            e1rm_kg: 97.8,
            pain: 3,
          }),
          createRecentSession({
            date: "2026-03-01",
            top_single_kg: 90,
            top_single_rir: 2,
            e1rm_kg: 98.5,
            pain: 3,
          }),
          createRecentSession({
            date: "2026-02-22",
            top_single_kg: 92.5,
            top_single_rir: 2,
            e1rm_kg: 100,
            pain: 3,
          }),
        ],
        [3, 3, 3, 3, 3],
      ),
    );

    expect(result.triggers_met).toBe(2);
    expect(result.deload_recommended).toBe(true);
    expect(result.details.find((detail) => detail.name === "e1rm_drop")).toMatchObject({
      active: true,
      value: 2.2,
    });
    expect(result.details.find((detail) => detail.name === "pain_trend")).toMatchObject({
      active: true,
      value: 3,
    });
  });

  it("returns 3 of 3 triggers when all thresholds are active", () => {
    const result = evaluateDeloadTriggers(
      buildState(
        [
          createRecentSession({
            date: "2026-03-08",
            top_single_kg: 90,
            top_single_rir: 1,
            e1rm_kg: 95,
            pain: 4,
          }),
          createRecentSession({
            date: "2026-03-01",
            top_single_kg: 90,
            top_single_rir: 2.5,
            e1rm_kg: 97,
            pain: 3,
          }),
          createRecentSession({
            date: "2026-02-22",
            top_single_kg: 92.5,
            top_single_rir: 2,
            e1rm_kg: 100,
            pain: 3,
          }),
        ],
        [4, 3, 3, 4, 3],
      ),
    );

    expect(result.triggers_met).toBe(3);
    expect(result.deload_recommended).toBe(true);
    expect(result.details).toEqual([
      {
        name: "e1rm_drop",
        active: true,
        value: 5,
        threshold: 2,
        sessions_compared: ["2026-02-22", "2026-03-08"],
      },
      {
        name: "rpe_drift",
        active: true,
        value: 1.5,
        threshold: 1,
        sessions_compared: ["2026-03-01", "2026-03-08"],
      },
      {
        name: "pain_trend",
        active: true,
        value: 3.4,
        threshold: 3,
        sessions_compared: ["2026-03-08", "2026-03-01", "2026-02-22"],
      },
    ]);
  });

  it("checks borderline e1RM drop values at 1.9 percent versus 2.0 percent", () => {
    const belowThreshold = evaluateDeloadTriggers(
      buildState([
        createRecentSession({
          date: "2026-03-08",
          e1rm_kg: 98.1,
        }),
        createRecentSession({
          date: "2026-03-01",
          e1rm_kg: 99,
        }),
        createRecentSession({
          date: "2026-02-22",
          e1rm_kg: 100,
        }),
      ]),
    );
    const atThreshold = evaluateDeloadTriggers(
      buildState([
        createRecentSession({
          date: "2026-03-08",
          e1rm_kg: 98,
        }),
        createRecentSession({
          date: "2026-03-01",
          e1rm_kg: 99,
        }),
        createRecentSession({
          date: "2026-02-22",
          e1rm_kg: 100,
        }),
      ]),
    );

    expect(belowThreshold.details[0]).toMatchObject({
      active: false,
      value: 1.9,
    });
    expect(atThreshold.details[0]).toMatchObject({
      active: true,
      value: 2,
    });
  });

  it("checks borderline RPE drift values at 0.9 versus 1.0", () => {
    const belowThreshold = evaluateDeloadTriggers(
      buildState([
        createRecentSession({
          date: "2026-03-08",
          top_single_kg: 90,
          top_single_rir: 1,
        }),
        createRecentSession({
          date: "2026-03-01",
          top_single_kg: 90,
          top_single_rir: 1.9,
        }),
        createRecentSession({
          date: "2026-02-22",
          top_single_kg: 92.5,
        }),
      ]),
    );
    const atThreshold = evaluateDeloadTriggers(
      buildState([
        createRecentSession({
          date: "2026-03-08",
          top_single_kg: 90,
          top_single_rir: 1,
        }),
        createRecentSession({
          date: "2026-03-01",
          top_single_kg: 90,
          top_single_rir: 2,
        }),
        createRecentSession({
          date: "2026-02-22",
          top_single_kg: 92.5,
        }),
      ]),
    );

    expect(belowThreshold.details[1]).toMatchObject({
      active: false,
      value: 0.9,
    });
    expect(atThreshold.details[1]).toMatchObject({
      active: true,
      value: 1,
    });
  });

  it("averages recent pain scores correctly at 2.9 versus 3.0", () => {
    const belowThreshold = evaluateDeloadTriggers(
      buildState(undefined, [3, 3, 3, 3, 2.5]),
    );
    const atThreshold = evaluateDeloadTriggers(
      buildState(undefined, [3, 3, 3, 3, 3]),
    );

    expect(belowThreshold.details[2]).toMatchObject({
      active: false,
      value: 2.9,
    });
    expect(atThreshold.details[2]).toMatchObject({
      active: true,
      value: 3,
    });
  });

  it("handles empty history without firing any triggers", () => {
    const result = evaluateDeloadTriggers(
      createAthleteState({
        recent_sessions: [],
        last_heavy_push: undefined,
        last_pain_scores: [],
      }),
    );

    expect(result).toEqual({
      triggers_met: 0,
      deload_recommended: false,
      details: [
        {
          name: "e1rm_drop",
          active: false,
          value: 0,
          threshold: 2,
          sessions_compared: [],
        },
        {
          name: "rpe_drift",
          active: false,
          value: 0,
          threshold: 1,
          sessions_compared: [],
        },
        {
          name: "pain_trend",
          active: false,
          value: 0,
          threshold: 3,
          sessions_compared: [],
        },
      ],
    });
  });
});
