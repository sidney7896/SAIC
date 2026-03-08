import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFreshDb } from "../helpers/temp-db";

const CSV_HEADER = "date,variation,load_kg,reps,rir,warmup,fail,notes";

describe("Strengthlog import heuristics", () => {
  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  it("classifies representative sessions as heavy/push, medium/legs, and light/pull", async () => {
    const db = await loadFreshDb("strengthlog-classify");
    const csv = [
      CSV_HEADER,
      "2026-03-01,flat,90,1,2,false,false,heavy single",
      "2026-03-02,flat,75,5,3,false,false,medium bench",
      "2026-03-02,flat,72.5,4,3,false,false,medium bench",
      "2026-03-03,flat,60,8,3,false,false,light bench",
    ].join("\n");

    const result = await db.strengthlog.importStrengthlogCsv(csv);
    const sessions = db.client
      .getSqlite()
      .prepare("SELECT date, session_type, day_type FROM sessions ORDER BY date ASC")
      .all() as Array<Record<string, unknown>>;

    expect(result).toEqual({
      importedRows: 4,
      skippedRows: 0,
      notes: ["Imported 3 historical sessions from the Strengthlog CSV."],
    });
    expect(sessions).toEqual([
      {
        date: "2026-03-01",
        session_type: "heavy",
        day_type: "push",
      },
      {
        date: "2026-03-02",
        session_type: "medium",
        day_type: "legs",
      },
      {
        date: "2026-03-03",
        session_type: "light",
        day_type: "pull",
      },
    ]);
  });

  it("infers bench standards from wrap, paused/IPF, and default notes", async () => {
    const db = await loadFreshDb("strengthlog-standards");
    const csv = [
      CSV_HEADER,
      "2026-03-01,flat,95,1,1,false,false,wrapped bench",
      "2026-03-02,flat,90,1,2,false,false,paused ipf single",
      "2026-03-03,flat,87.5,1,2,false,false,touch and go",
    ].join("\n");

    await db.strengthlog.importStrengthlogCsv(csv);

    const standards = db.client
      .getSqlite()
      .prepare(`
        SELECT sessions.date AS date, sets.bench_standard AS bench_standard
        FROM sets
        INNER JOIN sessions ON sessions.id = sets.session_id
        ORDER BY sessions.date ASC
      `)
      .all() as Array<Record<string, unknown>>;

    expect(standards).toEqual([
      {
        date: "2026-03-01",
        bench_standard: "gym_wraps",
      },
      {
        date: "2026-03-02",
        bench_standard: "ipf",
      },
      {
        date: "2026-03-03",
        bench_standard: "gym",
      },
    ]);
  });
});
