import type { NewSessionRow, SessionRow } from "@/db/schema";
import { getSqlite } from "@/db/client";
import { mapSessionRow } from "@/db/mappers";

export async function listSessions(): Promise<SessionRow[]> {
  const sqlite = getSqlite();

  const rows = sqlite
    .prepare("SELECT * FROM sessions ORDER BY date DESC, id DESC")
    .all() as Record<string, unknown>[];

  return rows.map(mapSessionRow);
}

export async function getSessionById(id: number): Promise<SessionRow | null> {
  const sqlite = getSqlite();
  const row = sqlite
    .prepare("SELECT * FROM sessions WHERE id = ? LIMIT 1")
    .get(id) as Record<string, unknown> | undefined;

  return row ? mapSessionRow(row) : null;
}

export async function createSession(
  session: NewSessionRow,
): Promise<SessionRow | null> {
  const sqlite = getSqlite();
  const result = sqlite
    .prepare(
      `
        INSERT INTO sessions (
          date,
          session_type,
          day_type,
          pain_before,
          pain_during,
          pain_after,
          pain_location,
          sleep_hours,
          bodyweight_kg,
          subjective_readiness,
          notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      session.date,
      session.sessionType,
      session.dayType,
      session.painBefore ?? null,
      session.painDuring ?? null,
      session.painAfter ?? null,
      session.painLocation ?? null,
      session.sleepHours ?? null,
      session.bodyweightKg ?? null,
      session.subjectiveReadiness ?? null,
      session.notes ?? null,
      session.createdAt,
    );
  const row = sqlite
    .prepare("SELECT * FROM sessions WHERE id = ? LIMIT 1")
    .get(Number(result.lastInsertRowid)) as Record<string, unknown> | undefined;

  return row ? mapSessionRow(row) : null;
}
