import fs from "node:fs";
import path from "node:path";
import { ensureDatabaseInitialized, getSqlite } from "@/db/client";
import { upsertProfileEntry } from "@/db/queries/profile";
import { importStrengthlogCsv } from "@/import/strengthlog";
import { getDefaultProfileEntries } from "@/lib/profile-defaults";

let seeded = false;

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
    const currentEntries = sqlite
      .prepare("SELECT key, value FROM athlete_profile")
      .all() as Array<{ key: string; value: string }>;
    const currentMap = new Map(currentEntries.map((entry) => [entry.key, entry.value]));

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

  seeded = true;
}
