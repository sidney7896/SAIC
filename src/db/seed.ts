import fs from "node:fs";
import path from "node:path";
import { ensureDatabaseInitialized, getSqlite } from "@/db/client";
import { upsertProfileEntry } from "@/db/queries/profile";
import { importStrengthlogCsv } from "@/import/strengthlog";
import { getDefaultProfileEntries } from "@/lib/profile-defaults";

let seeded = false;

function readCurrentProfileMap(sqlite: ReturnType<typeof getSqlite>) {
  const currentEntries = sqlite
    .prepare("SELECT key, value FROM athlete_profile")
    .all() as Array<{ key: string; value: string }>;

  return new Map(currentEntries.map((entry) => [entry.key, entry.value]));
}

function hasProfileValue(value: string | undefined) {
  return value !== undefined && value.trim().length > 0;
}

async function seedCutAnchors(sqlite: ReturnType<typeof getSqlite>) {
  const profileMap = readCurrentProfileMap(sqlite);
  const updatedAt = new Date().toISOString();
  const earliestHeavyGymE1rm = sqlite
    .prepare(
      `
        SELECT e1rm_history.value_kg AS value_kg, e1rm_history.date AS date
        FROM e1rm_history
        INNER JOIN sessions ON sessions.id = e1rm_history.session_id
        WHERE e1rm_history.bench_standard = 'gym'
          AND sessions.session_type = 'heavy'
        ORDER BY e1rm_history.date ASC, e1rm_history.id ASC
        LIMIT 1
      `,
    )
    .get() as { value_kg: number; date: string } | undefined;

  if (!hasProfileValue(profileMap.get("cut_start_bodyweight_kg"))) {
    const currentBodyweight = profileMap.get("current_bodyweight_kg");
    if (hasProfileValue(currentBodyweight)) {
      await upsertProfileEntry({
        key: "cut_start_bodyweight_kg",
        value: currentBodyweight!,
        updatedAt,
      });
    }
  }

  if (earliestHeavyGymE1rm && !hasProfileValue(profileMap.get("cut_start_e1rm_kg"))) {
    await upsertProfileEntry({
      key: "cut_start_e1rm_kg",
      value: String(earliestHeavyGymE1rm.value_kg),
      updatedAt,
    });
  }

  if (earliestHeavyGymE1rm && !hasProfileValue(profileMap.get("cut_start_date"))) {
    await upsertProfileEntry({
      key: "cut_start_date",
      value: earliestHeavyGymE1rm.date,
      updatedAt,
    });
  }
}

export async function ensureSeedData() {
  if (seeded) {
    return;
  }

  ensureDatabaseInitialized();

  const sqlite = getSqlite();
  const sessionCount = sqlite
    .prepare("SELECT COUNT(*) as count FROM sessions")
    .get() as { count: number };
  const profileCount = sqlite
    .prepare("SELECT COUNT(*) as count FROM athlete_profile")
    .get() as { count: number };
  const defaultEntries = getDefaultProfileEntries();

  if (profileCount.count === 0) {
    for (const entry of defaultEntries) {
      await upsertProfileEntry({
        key: entry.key,
        value: entry.value,
        updatedAt: new Date().toISOString(),
      });
    }
  } else {
    const currentMap = readCurrentProfileMap(sqlite);

    for (const entry of defaultEntries) {
      const currentValue = currentMap.get(entry.key);
      const shouldRepairBodyweightTarget =
        entry.key === "bodyweight_target_kg" &&
        currentValue !== undefined &&
        Number(currentValue) < 40;
      const shouldRepairTestDay =
        entry.key === "test_day_date" &&
        currentValue !== undefined &&
        currentValue !== entry.value &&
        currentValue === "2026-08-28";

      if (
        currentValue === undefined ||
        shouldRepairBodyweightTarget ||
        shouldRepairTestDay
      ) {
        await upsertProfileEntry({
          key: entry.key,
          value: entry.value,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  if (sessionCount.count === 0) {
    const csvPath = path.join(process.cwd(), "data", "bench-log.csv");
    const csvText = fs.readFileSync(csvPath, "utf8");
    await importStrengthlogCsv(csvText);
  }

  await seedCutAnchors(sqlite);

  seeded = true;
}
