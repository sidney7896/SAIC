import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";
import { calculateE1rm } from "@/engine/e1rm";
import type { BenchStandard, DayType, SessionType } from "@/engine/types";

export interface FreshDb {
  dir: string;
  client: typeof import("@/db/client");
  sessions: typeof import("@/db/queries/sessions");
  sets: typeof import("@/db/queries/sets");
  e1rm: typeof import("@/db/queries/e1rm");
  profile: typeof import("@/db/queries/profile");
  state: typeof import("@/db/queries/state");
  strengthlog: typeof import("@/import/strengthlog");
}

export interface SeedSessionInput {
  date: string;
  sessionType: SessionType;
  dayType: DayType;
  topSingleKg?: number;
  topSingleRir?: number | null;
  topSingleStandard?: BenchStandard;
  painBefore?: number;
  painDuring?: number;
  painAfter?: number;
  sleepHours?: number;
  bodyweightKg?: number;
  subjectiveReadiness?: number;
  notes?: string;
  backoffSets?: Array<{
    exercise?: string;
    weightKg: number;
    reps: number;
    sets: number;
    rir?: number | null;
    benchStandard?: BenchStandard;
  }>;
  e1rmKg?: number | null;
}

export async function loadFreshDb(label: string): Promise<FreshDb> {
  vi.resetModules();

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `bench-coach-${label}-`));
  process.env.DATABASE_URL = `file:${path.join(dir, "test.sqlite")}`;

  const client = await import("@/db/client");
  client.ensureDatabaseInitialized();

  return {
    dir,
    client,
    sessions: await import("@/db/queries/sessions"),
    sets: await import("@/db/queries/sets"),
    e1rm: await import("@/db/queries/e1rm"),
    profile: await import("@/db/queries/profile"),
    state: await import("@/db/queries/state"),
    strengthlog: await import("@/import/strengthlog"),
  };
}

export async function seedProfileEntries(
  db: FreshDb,
  entries: Record<string, string>,
) {
  const updatedAt = new Date().toISOString();

  for (const [key, value] of Object.entries(entries)) {
    await db.profile.upsertProfileEntry({
      key,
      value,
      updatedAt,
    });
  }
}

export async function seedCutProfile(
  db: FreshDb,
  overrides: Record<string, string> = {},
) {
  await seedProfileEntries(db, {
    athlete_name: "Sidney Drost",
    current_phase: "cut",
    current_bodyweight_kg: "70",
    bodyweight_target_kg: "65",
    bodyweight_trend: "losing",
    is_in_caloric_deficit: "true",
    test_day_date: "2026-08-29",
    last_training_date: overrides.last_training_date ?? "2026-03-07",
    ...overrides,
  });
}

export async function seedSession(db: FreshDb, input: SeedSessionInput) {
  const session = await db.sessions.createSession({
    date: input.date,
    sessionType: input.sessionType,
    dayType: input.dayType,
    painBefore: input.painBefore ?? 0,
    painDuring: input.painDuring ?? null,
    painAfter: input.painAfter ?? null,
    painLocation: "",
    sleepHours: input.sleepHours ?? null,
    bodyweightKg: input.bodyweightKg ?? 70,
    subjectiveReadiness: input.subjectiveReadiness ?? 3,
    notes: input.notes ?? "Seeded test session",
    createdAt: new Date(`${input.date}T12:00:00Z`).toISOString(),
  });

  if (!session) {
    throw new Error("Failed to seed session.");
  }

  const setRows = [];

  if (input.topSingleKg !== undefined) {
    setRows.push({
      sessionId: session.id,
      exercise: "flat_bench",
      weightKg: input.topSingleKg,
      reps: 1,
      sets: 1,
      rir: input.topSingleRir ?? null,
      benchStandard: input.topSingleStandard ?? "gym",
      isTopSingle: 1,
      isWarmup: 0,
      failed: 0,
      notes: input.notes,
    });
  }

  for (const backoffSet of input.backoffSets ?? []) {
    setRows.push({
      sessionId: session.id,
      exercise: backoffSet.exercise ?? "flat_bench",
      weightKg: backoffSet.weightKg,
      reps: backoffSet.reps,
      sets: backoffSet.sets,
      rir: backoffSet.rir ?? null,
      benchStandard: backoffSet.benchStandard ?? input.topSingleStandard ?? "gym",
      isTopSingle: 0,
      isWarmup: 0,
      failed: 0,
      notes: input.notes,
    });
  }

  if (setRows.length > 0) {
    await db.sets.createSets(setRows);
  }

  const computedE1rm =
    input.e1rmKg === undefined &&
    input.topSingleKg !== undefined &&
    input.topSingleRir !== undefined &&
    input.topSingleRir !== null
      ? calculateE1rm(input.topSingleKg, 1, input.topSingleRir).valueKg
      : input.e1rmKg;

  if (computedE1rm !== undefined && computedE1rm !== null) {
    await db.e1rm.insertE1rmHistory({
      sessionId: session.id,
      date: input.date,
      benchStandard: input.topSingleStandard ?? "gym",
      valueKg: computedE1rm,
      method: "rpe_table",
      confidence: "high",
      sourceWeightKg: input.topSingleKg ?? null,
      sourceReps: input.topSingleKg !== undefined ? 1 : null,
      sourceRir: input.topSingleRir ?? null,
    });
  }

  return session;
}
