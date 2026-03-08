import type {
  AthleteState,
  BenchStandard,
  Confidence,
  E1rmEstimate,
  RecentSession,
} from "@/engine/types";
import type { E1rmHistoryRow, SessionRow, SetRow } from "@/db/schema";
import { getSqlite } from "@/db/client";
import { mapE1rmHistoryRow, mapSessionRow, mapSetRow } from "@/db/mappers";
import { ensureSeedData } from "@/db/seed";
import { findComparableSessions } from "@/engine/comparable-sessions";
import { evaluateDeloadTriggers } from "@/engine/deload-triggers";
import { resolvePhase } from "@/engine/phase";
import { profileRowsToMap, mapToAthleteProfile } from "@/lib/profile";
import { daysBetween, isoToday } from "@/lib/dates";
import { percentChange } from "@/lib/number";
import { listProfileEntries } from "@/db/queries/profile";

function buildRecentSession(
  session: SessionRow,
  setRows: SetRow[],
  e1rmRows: E1rmHistoryRow[],
): RecentSession {
  const topSingle =
    setRows.find((row) => row.isTopSingle === 1) ??
    [...setRows]
      .filter((row) => row.isWarmup === 0 && row.reps === 1)
      .sort((left, right) => right.weightKg - left.weightKg)[0];
  const primaryBenchStandard =
    (topSingle?.benchStandard as BenchStandard | undefined) ??
    (setRows.find((row) => row.isWarmup === 0)?.benchStandard as
      | BenchStandard
      | undefined) ??
    "gym";
  const e1rmRow =
    e1rmRows.find((row) => row.benchStandard === primaryBenchStandard) ??
    e1rmRows[0];
  const pain = Math.max(
    session.painBefore ?? 0,
    session.painDuring ?? 0,
    session.painAfter ?? 0,
  );

  return {
    date: session.date,
    session_type: session.sessionType as RecentSession["session_type"],
    day_type: session.dayType as RecentSession["day_type"],
    top_single_kg: topSingle?.weightKg,
    top_single_rir: topSingle?.rir ?? undefined,
    e1rm_kg: e1rmRow?.valueKg,
    bench_standard: primaryBenchStandard,
    pain,
    hard_sets: setRows
      .filter((row) => row.isWarmup === 0 && row.reps > 0)
      .reduce((total, row) => total + row.sets, 0),
    notes: session.notes ?? undefined,
  };
}

function determineTrend(changePct: number) {
  if (changePct >= 0.5) {
    return "up" as const;
  }

  if (changePct <= -0.5) {
    return "down" as const;
  }

  return "flat" as const;
}

function buildEstimateForStandard(
  standard: BenchStandard,
  recentSessions: RecentSession[],
  e1rmRows: E1rmHistoryRow[],
): E1rmEstimate | undefined {
  const standardSessions = recentSessions.filter(
    (session) => session.bench_standard === standard && session.e1rm_kg !== undefined,
  );

  if (standardSessions.length === 0) {
    return undefined;
  }

  const latest = standardSessions[0];
  const comparable = findComparableSessions(
    {
      session_type: latest.session_type,
      day_type: latest.day_type,
      bench_standard: latest.bench_standard,
    },
    standardSessions,
    3,
  );
  const oldest = comparable.sessions[comparable.sessions.length - 1];
  const latestHistory = e1rmRows.find((row) => row.benchStandard === standard);
  const trendChangePct =
    oldest?.e1rm_kg !== undefined && latest.e1rm_kg !== undefined
      ? Number(percentChange(oldest.e1rm_kg, latest.e1rm_kg).toFixed(1))
      : 0;
  const confidence: Confidence =
    comparable.sessions.length >= 3
      ? "high"
      : comparable.sessions.length === 2
        ? "medium"
        : latestHistory?.confidence === "high" ||
            latestHistory?.confidence === "medium" ||
            latestHistory?.confidence === "low"
          ? latestHistory.confidence
          : "low";

  return {
    value_kg: latest.e1rm_kg ?? 0,
    date: latest.date,
    confidence,
    method:
      latestHistory?.method === "rpe_table" ||
      latestHistory?.method === "epley" ||
      latestHistory?.method === "test_day"
        ? latestHistory.method
        : "rpe_table",
    trend: determineTrend(trendChangePct),
    trend_sessions: comparable.sessions.length,
    trend_change_pct: trendChangePct,
  };
}

export async function computeAthleteState(): Promise<AthleteState | null> {
  await ensureSeedData();

  const sqlite = getSqlite();
  const profileRows = await listProfileEntries();
  const profileMap = profileRowsToMap(profileRows);
  const profile = mapToAthleteProfile(profileMap);
  const today = isoToday();
  const phaseContext = resolvePhase(today, profile);
  const sessions = sqlite
    .prepare("SELECT * FROM sessions ORDER BY date DESC, id DESC LIMIT 60")
    .all()
    .map((row) => mapSessionRow(row as Record<string, unknown>));

  if (sessions.length === 0) {
    return null;
  }

  const recentSessions = sessions.map((session) => {
    const setRows = sqlite
      .prepare("SELECT * FROM sets WHERE session_id = ? ORDER BY id ASC")
      .all(session.id)
      .map((row) => mapSetRow(row as Record<string, unknown>));
    const e1rmRows = sqlite
      .prepare("SELECT * FROM e1rm_history WHERE session_id = ? ORDER BY id DESC")
      .all(session.id)
      .map((row) => mapE1rmHistoryRow(row as Record<string, unknown>));

    return buildRecentSession(session, setRows, e1rmRows);
  });
  const allE1rmRows = sqlite
    .prepare("SELECT * FROM e1rm_history ORDER BY date DESC, id DESC")
    .all()
    .map((row) => mapE1rmHistoryRow(row as Record<string, unknown>));
  const latestSession = recentSessions[0];
  const latestBodyweight =
    sessions.find((session) => session.bodyweightKg !== null)?.bodyweightKg ??
    Number(profileMap.get("current_bodyweight_kg") ?? 70);
  const bodyweightRows = sessions
    .filter((session) => session.bodyweightKg !== null)
    .slice(0, 2)
    .map((session) => session.bodyweightKg as number);
  const bodyweightTrend =
    bodyweightRows.length >= 2
      ? bodyweightRows[0] < bodyweightRows[1]
        ? "losing"
        : bodyweightRows[0] > bodyweightRows[1]
          ? "gaining"
          : "stable"
      : profileMap.get("bodyweight_trend") === "gaining"
        ? "gaining"
        : profileMap.get("bodyweight_trend") === "stable"
          ? "stable"
          : "losing";
  const e1rm = {
    ipf: buildEstimateForStandard("ipf", recentSessions, allE1rmRows),
    gym: buildEstimateForStandard("gym", recentSessions, allE1rmRows),
    gym_wraps: buildEstimateForStandard("gym_wraps", recentSessions, allE1rmRows),
  };
  const heavyPushSessions = recentSessions.filter(
    (session) =>
      session.session_type === "heavy" &&
      session.day_type === "push" &&
      session.bench_standard === "gym",
  );
  const mediumLegSessions = recentSessions.filter(
    (session) =>
      session.session_type === "medium" &&
      session.day_type === "legs" &&
      session.bench_standard === "gym",
  );
  let consecutiveSessionsAboveTargetRpe = 0;
  for (const session of heavyPushSessions) {
    if (session.top_single_rir !== undefined && session.top_single_rir <= 1.5) {
      consecutiveSessionsAboveTargetRpe += 1;
    } else {
      break;
    }
  }

  const gymHistory = recentSessions.filter(
    (session) => session.bench_standard === "gym" && session.e1rm_kg !== undefined,
  );
  const currentGymE1rm = e1rm.gym?.value_kg ?? 0;
  const cutStartE1rm = gymHistory[gymHistory.length - 1]?.e1rm_kg ?? currentGymE1rm;
  const cutDropPct =
    cutStartE1rm > 0
      ? Number((((cutStartE1rm - currentGymE1rm) / cutStartE1rm) * 100).toFixed(1))
      : 0;

  const baseState: AthleteState = {
    current_phase: phaseContext.current_phase,
    phase_week: phaseContext.phase_week,
    block_type: phaseContext.block_type,
    cycle_number: phaseContext.cycle_number,
    e1rm,
    deload_triggers: {
      e1rm_drop: {
        active: false,
        value: 0,
        threshold: 2,
        sessions_compared: [],
      },
      rpe_drift: {
        active: false,
        value: 0,
        threshold: 1,
        sessions_compared: [],
      },
      pain_trend: {
        active: false,
        value: 0,
        threshold: 3,
        sessions_compared: [],
      },
      triggers_met: 0,
      deload_recommended: false,
    },
    cut_state:
      phaseContext.current_phase === "cut"
        ? {
            e1rm_change_pct: cutDropPct,
            threshold:
              cutDropPct > 5
                ? "red_flag"
                : cutDropPct > 3
                  ? "warning"
                  : cutDropPct > 0
                    ? "monitor"
                    : "stable",
            weeks_in_cut: Math.max(
              1,
              Math.round(daysBetween(gymHistory[gymHistory.length - 1]?.date ?? today, today) / 7),
            ),
            bw_start_kg: Number(profileMap.get("current_bodyweight_kg") ?? latestBodyweight),
            bw_current_kg: latestBodyweight,
            bw_target_kg: Number(profileMap.get("bodyweight_target_kg") ?? 65),
            e1rm_at_cut_start_kg: cutStartE1rm,
          }
        : undefined,
    recent_sessions: recentSessions.slice(0, 10),
    last_heavy_push: heavyPushSessions[0],
    last_medium_legs: mediumLegSessions[0],
    days_since_last_bench: daysBetween(latestSession.date, today),
    bodyweight_kg: latestBodyweight,
    bodyweight_trend: bodyweightTrend,
    consecutive_sessions_above_target_rpe: consecutiveSessionsAboveTargetRpe,
    last_pain_scores: recentSessions.slice(0, 5).map((session) => session.pain),
    peaking_state:
      phaseContext.current_phase === "peaking"
        ? {
            weeks_out: Math.max(
              1,
              Math.ceil(daysBetween(today, profile.testDayDate ?? "2026-08-29") / 7),
            ),
            target_ipf_1rm: e1rm.ipf?.value_kg ?? currentGymE1rm,
            current_e1rm_pct_of_target: 1,
            hard_sets_this_week: recentSessions
              .filter((session) => daysBetween(session.date, today) <= 7)
              .reduce((total, session) => total + session.hard_sets, 0),
            taper_active: false,
          }
        : undefined,
  };
  const deloadResult = evaluateDeloadTriggers(baseState);

  return {
    ...baseState,
    deload_triggers: {
      e1rm_drop: deloadResult.details.find((detail) => detail.name === "e1rm_drop") ?? {
        active: false,
        value: 0,
        threshold: 2,
        sessions_compared: [],
      },
      rpe_drift: deloadResult.details.find((detail) => detail.name === "rpe_drift") ?? {
        active: false,
        value: 0,
        threshold: 1,
        sessions_compared: [],
      },
      pain_trend: deloadResult.details.find((detail) => detail.name === "pain_trend") ?? {
        active: false,
        value: 0,
        threshold: 3,
        sessions_compared: [],
      },
      triggers_met: deloadResult.triggers_met,
      deload_recommended: deloadResult.deload_recommended,
    },
  };
}
