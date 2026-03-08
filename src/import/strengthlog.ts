import type { NewE1rmHistoryRow, NewSessionRow, NewSetRow } from "@/db/schema";
import type { BenchStandard } from "@/engine/types";
import { getSqlite, runInTransaction } from "@/db/client";
import { calculateE1rm } from "@/engine/e1rm";
import { parseCsvLine } from "@/lib/csv";

export interface StrengthlogCsvRow {
  date: string;
  variation: string;
  load_kg: number;
  reps: number;
  rir: number | null;
  warmup: boolean;
  fail: boolean;
  notes: string;
}

export interface StrengthlogImportResult {
  importedRows: number;
  skippedRows: number;
  notes: string[];
}

function classifySessionType(rows: StrengthlogCsvRow[]) {
  const workingFlatRows = rows.filter(
    (row) => row.variation === "flat" && !row.warmup && row.reps > 0,
  );

  if (workingFlatRows.some((row) => row.reps === 1)) {
    return {
      sessionType: "heavy" as const,
      dayType: "push" as const,
    };
  }

  if (
    workingFlatRows.filter((row) => row.reps >= 3 && row.reps <= 5).length >= 2
  ) {
    return {
      sessionType: "medium" as const,
      dayType: "legs" as const,
    };
  }

  return {
    sessionType: "light" as const,
    dayType: "pull" as const,
  };
}

function inferBenchStandard(notes: string) {
  const note = notes.toLowerCase();

  if (note.includes("wrap")) {
    return "gym_wraps" as const;
  }

  if (note.includes("ipf") || note.includes("paused")) {
    return "ipf" as const;
  }

  return "gym" as const;
}

function getPreferredE1rmRow(rows: StrengthlogCsvRow[]) {
  const flatRows = rows
    .filter(
      (row) =>
        row.variation === "flat" &&
        !row.warmup &&
        row.reps > 0 &&
        row.rir !== null,
    )
    .sort((left, right) => {
      if (left.reps === 1 && right.reps !== 1) {
        return -1;
      }

      if (left.reps !== 1 && right.reps === 1) {
        return 1;
      }

      return right.load_kg - left.load_kg;
    });

  return flatRows[0] ?? null;
}

function getE1rmRowsPerStandard(rows: StrengthlogCsvRow[]) {
  const rowsByStandard = new Map<BenchStandard, StrengthlogCsvRow[]>();

  for (const row of rows) {
    if (row.variation !== "flat" || row.warmup || row.reps <= 0) {
      continue;
    }

    const standard = inferBenchStandard(row.notes);
    const standardRows = rowsByStandard.get(standard) ?? [];
    standardRows.push(row);
    rowsByStandard.set(standard, standardRows);
  }

  const e1rmRows: Array<{ row: StrengthlogCsvRow; standard: BenchStandard }> =
    [];

  for (const [standard, standardRows] of rowsByStandard) {
    const preferredRow = getPreferredE1rmRow(standardRows);
    if (preferredRow) {
      e1rmRows.push({
        row: preferredRow,
        standard,
      });
    }
  }

  return e1rmRows;
}

export function parseStrengthlogCsv(csvText: string): StrengthlogCsvRow[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const [, ...dataLines] = lines;

  return dataLines.map((line) => {
    const [date, variation, loadKg, reps, rir, warmup, fail, notes] =
      parseCsvLine(line);

    return {
      date,
      variation,
      load_kg: Number(loadKg),
      reps: Number(reps),
      rir: rir === "" ? null : Number(rir),
      warmup: warmup === "true",
      fail: fail === "true",
      notes: notes ?? "",
    };
  });
}

export async function importStrengthlogCsv(
  csvText: string,
): Promise<StrengthlogImportResult> {
  const rows = parseStrengthlogCsv(csvText);
  const grouped = new Map<string, StrengthlogCsvRow[]>();

  for (const row of rows) {
    const key = row.date;
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  let importedRows = 0;
  let skippedRows = 0;
  const notes: string[] = [];

  runInTransaction(() => {
    const sqlite = getSqlite();
    const insertSession = sqlite.prepare(`
      INSERT INTO sessions (
        date,
        session_type,
        day_type,
        pain_before,
        pain_location,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSet = sqlite.prepare(`
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
    const insertE1rm = sqlite.prepare(`
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
    `);
    const findExistingSession = sqlite.prepare(
      "SELECT id FROM sessions WHERE date = ? LIMIT 1",
    );

    for (const [date, sessionRows] of grouped) {
      if (findExistingSession.get(date)) {
        skippedRows += sessionRows.length;
        continue;
      }

      const sessionMeta = classifySessionType(sessionRows);
      const sessionRecord: NewSessionRow = {
        date,
        sessionType: sessionMeta.sessionType,
        dayType: sessionMeta.dayType,
        painBefore: 0,
        painLocation: "",
        notes: "Seeded from Strengthlog CSV. day_type inferred heuristically.",
        createdAt: new Date().toISOString(),
      };
      const result = insertSession.run(
        sessionRecord.date,
        sessionRecord.sessionType,
        sessionRecord.dayType,
        sessionRecord.painBefore ?? null,
        sessionRecord.painLocation ?? null,
        sessionRecord.notes ?? null,
        sessionRecord.createdAt,
      );
      const sessionId = Number(result.lastInsertRowid);

      let topSingleAssigned = false;
      for (const row of sessionRows) {
        const setRecord: NewSetRow = {
          sessionId,
          exercise: row.variation === "flat" ? "flat_bench" : row.variation,
          weightKg: row.load_kg,
          reps: row.reps,
          sets: 1,
          rir: row.rir,
          benchStandard: inferBenchStandard(row.notes),
          isTopSingle:
            !topSingleAssigned &&
            row.variation === "flat" &&
            !row.warmup &&
            row.reps === 1
              ? 1
              : 0,
          isWarmup: row.warmup ? 1 : 0,
          failed: row.fail ? 1 : 0,
          notes: row.notes,
        };

        if (setRecord.isTopSingle) {
          topSingleAssigned = true;
        }

        insertSet.run(
          setRecord.sessionId,
          setRecord.exercise,
          setRecord.weightKg,
          setRecord.reps,
          setRecord.sets,
          setRecord.rir ?? null,
          setRecord.benchStandard ?? null,
          setRecord.isTopSingle ?? 0,
          setRecord.isWarmup ?? 0,
          setRecord.failed ?? 0,
          setRecord.notes ?? null,
        );
        importedRows += 1;
      }

      for (const e1rmSource of getE1rmRowsPerStandard(sessionRows)) {
        const result = calculateE1rm(
          e1rmSource.row.load_kg,
          e1rmSource.row.reps,
          e1rmSource.row.rir,
        );

        if (result.valueKg !== null && result.confidence !== null) {
          const e1rmRecord: NewE1rmHistoryRow = {
            sessionId,
            date,
            benchStandard: e1rmSource.standard,
            valueKg: result.valueKg,
            method: result.method,
            confidence: result.confidence,
            sourceWeightKg: e1rmSource.row.load_kg,
            sourceReps: e1rmSource.row.reps,
            sourceRir: e1rmSource.row.rir,
          };

          insertE1rm.run(
            e1rmRecord.sessionId,
            e1rmRecord.date,
            e1rmRecord.benchStandard,
            e1rmRecord.valueKg,
            e1rmRecord.method,
            e1rmRecord.confidence,
            e1rmRecord.sourceWeightKg ?? null,
            e1rmRecord.sourceReps ?? null,
            e1rmRecord.sourceRir ?? null,
          );
        }
      }
    }
  });

  notes.push(
    `Imported ${grouped.size} historical sessions from the Strengthlog CSV.`,
  );

  return {
    importedRows,
    skippedRows,
    notes,
  };
}
