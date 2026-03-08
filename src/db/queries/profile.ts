import type {
  AthleteProfileRow,
  NewAthleteProfileRow,
} from "@/db/schema";
import { getSqlite } from "@/db/client";
import { mapAthleteProfileRow } from "@/db/mappers";

export async function listProfileEntries(): Promise<AthleteProfileRow[]> {
  const sqlite = getSqlite();
  const rows = sqlite
    .prepare("SELECT * FROM athlete_profile ORDER BY key ASC")
    .all() as Record<string, unknown>[];

  return rows.map(mapAthleteProfileRow);
}

export async function upsertProfileEntry(
  row: NewAthleteProfileRow,
): Promise<AthleteProfileRow | null> {
  const sqlite = getSqlite();
  sqlite
    .prepare(
      `
        INSERT INTO athlete_profile (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `,
    )
    .run(row.key, row.value, row.updatedAt);

  const saved = sqlite
    .prepare("SELECT * FROM athlete_profile WHERE key = ? LIMIT 1")
    .get(row.key) as Record<string, unknown> | undefined;

  return saved ? mapAthleteProfileRow(saved) : null;
}
