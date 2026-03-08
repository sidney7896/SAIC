import type { NewSetRow, SetRow } from "@/db/schema";
import { getSqlite } from "@/db/client";
import { mapSetRow } from "@/db/mappers";

export async function listSetsForSession(sessionId: number): Promise<SetRow[]> {
  const sqlite = getSqlite();

  const rows = sqlite
    .prepare("SELECT * FROM sets WHERE session_id = ? ORDER BY id ASC")
    .all(sessionId) as Record<string, unknown>[];

  return rows.map(mapSetRow);
}

export async function createSets(rows: NewSetRow[]): Promise<SetRow[]> {
  const sqlite = getSqlite();
  const insert = sqlite.prepare(`
    INSERT INTO sets (
      session_id,
      exercise,
      weight_kg,
      reps,
      num_sets,
      rir,
      bench_standard,
      is_top_single,
      is_warmup,
      failed,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const savedRows: SetRow[] = [];

  for (const row of rows) {
    const result = insert.run(
      row.sessionId,
      row.exercise,
      row.weightKg,
      row.reps,
      row.sets,
      row.rir ?? null,
      row.benchStandard ?? null,
      row.isTopSingle ?? 0,
      row.isWarmup ?? 0,
      row.failed ?? 0,
      row.notes ?? null,
    );
    const saved = sqlite
      .prepare("SELECT * FROM sets WHERE id = ? LIMIT 1")
      .get(Number(result.lastInsertRowid)) as Record<string, unknown> | undefined;
    if (saved) {
      savedRows.push(mapSetRow(saved));
    }
  }

  return savedRows;
}
