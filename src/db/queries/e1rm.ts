import type { E1rmHistoryRow, NewE1rmHistoryRow } from "@/db/schema";
import { getSqlite } from "@/db/client";
import { mapE1rmHistoryRow } from "@/db/mappers";
import type { BenchStandard } from "@/engine/types";

export async function listE1rmHistory(
  benchStandard?: BenchStandard,
): Promise<E1rmHistoryRow[]> {
  const sqlite = getSqlite();

  if (!benchStandard) {
    const rows = sqlite
      .prepare("SELECT * FROM e1rm_history ORDER BY date DESC, id DESC")
      .all() as Record<string, unknown>[];

    return rows.map(mapE1rmHistoryRow);
  }

  const rows = sqlite
    .prepare(
      "SELECT * FROM e1rm_history WHERE bench_standard = ? ORDER BY date DESC, id DESC",
    )
    .all(benchStandard) as Record<string, unknown>[];

  return rows.map(mapE1rmHistoryRow);
}

export async function insertE1rmHistory(
  row: NewE1rmHistoryRow,
): Promise<E1rmHistoryRow | null> {
  const sqlite = getSqlite();
  const result = sqlite
    .prepare(
      `
        INSERT INTO e1rm_history (
          session_id,
          date,
          bench_standard,
          value_kg,
          method,
          confidence,
          source_weight_kg,
          source_reps,
          source_rir
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      row.sessionId,
      row.date,
      row.benchStandard,
      row.valueKg,
      row.method,
      row.confidence,
      row.sourceWeightKg ?? null,
      row.sourceReps ?? null,
      row.sourceRir ?? null,
    );
  const saved = sqlite
    .prepare("SELECT * FROM e1rm_history WHERE id = ? LIMIT 1")
    .get(Number(result.lastInsertRowid)) as Record<string, unknown> | undefined;

  return saved ? mapE1rmHistoryRow(saved) : null;
}

export async function listE1rmHistoryForSession(
  sessionId: number,
): Promise<E1rmHistoryRow[]> {
  const sqlite = getSqlite();

  const rows = sqlite
    .prepare("SELECT * FROM e1rm_history WHERE session_id = ? ORDER BY id DESC")
    .all(sessionId) as Record<string, unknown>[];

  return rows.map(mapE1rmHistoryRow);
}
