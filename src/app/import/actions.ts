"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { importStrengthlogCsv } from "@/import/strengthlog";

export async function importSeedCsvAction() {
  const csvPath = path.join(process.cwd(), "data", "bench-log.csv");
  const csvText = fs.readFileSync(csvPath, "utf8");
  const result = await importStrengthlogCsv(csvText);

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/import");
  redirect(
    `/import?imported=${result.importedRows}&skipped=${result.skippedRows}`,
  );
}
