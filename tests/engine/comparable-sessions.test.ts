import { describe, expect, it } from "vitest";
import { findComparableSessions } from "@/engine/comparable-sessions";
import { createRecentSession } from "../helpers/fixtures";

describe("findComparableSessions", () => {
  it("matches the same session type, day type, and bench standard in newest-first order", () => {
    const history = [
      createRecentSession({ date: "2026-03-08", e1rm_kg: 98.2 }),
      createRecentSession({
        date: "2026-03-07",
        session_type: "medium",
        day_type: "legs",
        e1rm_kg: 95,
      }),
      createRecentSession({ date: "2026-03-06", e1rm_kg: 97.4 }),
      createRecentSession({
        date: "2026-03-05",
        bench_standard: "ipf",
        e1rm_kg: 96.1,
      }),
      createRecentSession({ date: "2026-03-04", e1rm_kg: 96.8 }),
    ];

    const result = findComparableSessions(
      {
        session_type: "heavy",
        day_type: "push",
        bench_standard: "gym",
      },
      history,
    );

    expect(result.confidence).toBe("high");
    expect(result.sessions.map((session) => session.date)).toEqual([
      "2026-03-08",
      "2026-03-06",
      "2026-03-04",
    ]);
  });

  it("excludes cross-type and cross-day comparisons", () => {
    const history = [
      createRecentSession({ date: "2026-03-08", e1rm_kg: 98.2 }),
      createRecentSession({
        date: "2026-03-07",
        session_type: "light",
        day_type: "pull",
        e1rm_kg: 90.5,
      }),
      createRecentSession({
        date: "2026-03-06",
        session_type: "medium",
        day_type: "legs",
        e1rm_kg: 94.2,
      }),
    ];

    const result = findComparableSessions(
      {
        session_type: "heavy",
        day_type: "push",
        bench_standard: "gym",
      },
      history,
    );

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]?.date).toBe("2026-03-08");
    expect(result.confidence).toBe("low");
  });

  it("excludes mixed bench standards", () => {
    const history = [
      createRecentSession({ date: "2026-03-08", bench_standard: "ipf", e1rm_kg: 95.5 }),
      createRecentSession({ date: "2026-03-06", bench_standard: "gym_wraps", e1rm_kg: 102.5 }),
      createRecentSession({ date: "2026-03-04", bench_standard: "gym", e1rm_kg: 97.2 }),
    ];

    const result = findComparableSessions(
      {
        session_type: "heavy",
        day_type: "push",
        bench_standard: "gym",
      },
      history,
    );

    expect(result.sessions).toEqual([
      expect.objectContaining({
        date: "2026-03-04",
        bench_standard: "gym",
      }),
    ]);
    expect(result.confidence).toBe("low");
  });

  it("drops sessions without e1RM data and reports reduced confidence when data is sparse", () => {
    const history = [
      createRecentSession({ date: "2026-03-08", e1rm_kg: undefined }),
      createRecentSession({ date: "2026-03-06", e1rm_kg: 96.8 }),
      createRecentSession({ date: "2026-03-04", e1rm_kg: undefined }),
    ];

    const result = findComparableSessions(
      {
        session_type: "heavy",
        day_type: "push",
        bench_standard: "gym",
      },
      history,
    );

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]?.date).toBe("2026-03-06");
    expect(result.confidence).toBe("low");
  });
});
