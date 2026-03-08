import type {
  ComparableResult,
  RecentSession,
  SessionContext,
} from "@/engine/types";

export function findComparableSessions(
  target: SessionContext,
  history: RecentSession[],
  count = 3,
): ComparableResult {
  const sessions = history
    .filter(
      (session) =>
        session.session_type === target.session_type &&
        session.day_type === target.day_type &&
        session.bench_standard === target.bench_standard &&
        session.e1rm_kg !== undefined,
    )
    .slice(0, count);

  return {
    sessions,
    confidence:
      sessions.length >= 3 ? "high" : sessions.length >= 2 ? "medium" : "low",
  };
}
