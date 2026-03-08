import type { RecommendationRow } from "@/db/schema";
import { getSqlite } from "@/db/client";
import { mapRecommendationRow } from "@/db/mappers";

export interface CreateRecommendationInput {
  sessionId?: number | null;
  date: string;
  phase: string;
  prescriptionJson: string;
  stateSnapshotJson: string;
  explanationJson?: string | null;
}

export async function createRecommendation(
  input: CreateRecommendationInput,
): Promise<RecommendationRow | null> {
  const sqlite = getSqlite();
  const result = sqlite
    .prepare(
      `
        INSERT INTO recommendations (
          session_id,
          date,
          phase,
          prescription_json,
          state_snapshot_json,
          explanation_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.sessionId ?? null,
      input.date,
      input.phase,
      input.prescriptionJson,
      input.stateSnapshotJson,
      input.explanationJson ?? null,
      new Date().toISOString(),
    );

  const row = sqlite
    .prepare("SELECT * FROM recommendations WHERE id = ? LIMIT 1")
    .get(Number(result.lastInsertRowid)) as Record<string, unknown> | undefined;

  return row ? mapRecommendationRow(row) : null;
}

export async function getRecommendationById(
  id: number,
): Promise<RecommendationRow | null> {
  const sqlite = getSqlite();
  const row = sqlite
    .prepare("SELECT * FROM recommendations WHERE id = ? LIMIT 1")
    .get(id) as Record<string, unknown> | undefined;

  return row ? mapRecommendationRow(row) : null;
}

export async function listRecommendationsForSession(
  sessionId: number,
): Promise<RecommendationRow[]> {
  const sqlite = getSqlite();

  const rows = sqlite
    .prepare(
      "SELECT * FROM recommendations WHERE session_id = ? ORDER BY created_at DESC",
    )
    .all(sessionId) as Record<string, unknown>[];

  return rows.map(mapRecommendationRow);
}

export async function linkRecommendationToSession(
  recommendationId: number,
  sessionId: number,
): Promise<void> {
  const sqlite = getSqlite();
  sqlite
    .prepare("UPDATE recommendations SET session_id = ? WHERE id = ?")
    .run(sessionId, recommendationId);
}
