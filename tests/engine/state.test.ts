import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isoDateDaysFromToday,
} from "../helpers/fixtures";
import {
  loadFreshDb,
  seedCutProfile,
  seedSession,
} from "../helpers/temp-db";

describe("computeAthleteState cut anchors", () => {
  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  it("uses cut_start_e1rm_kg from the profile when present", async () => {
    const db = await loadFreshDb("state-cut-start-e1rm-profile");
    await seedCutProfile(db, {
      last_training_date: isoDateDaysFromToday(-1),
      cut_start_e1rm_kg: "110",
      cut_start_date: isoDateDaysFromToday(-28),
      cut_start_bodyweight_kg: "72",
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-1),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 2,
      e1rmKg: 100,
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-14),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 95,
      topSingleRir: 2,
      e1rmKg: 105,
    });

    const state = await db.state.computeAthleteState();

    expect(state?.cut_state).toMatchObject({
      e1rm_at_cut_start_kg: 110,
      e1rm_change_pct: 9.1,
    });
  });

  it("falls back to the trailing window when cut_start_e1rm_kg is blank", async () => {
    const db = await loadFreshDb("state-cut-start-e1rm-fallback");
    await seedCutProfile(db, {
      last_training_date: isoDateDaysFromToday(-1),
      cut_start_e1rm_kg: "",
      cut_start_date: "",
      cut_start_bodyweight_kg: "72",
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-1),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 2,
      e1rmKg: 100,
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-21),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 95,
      topSingleRir: 2,
      e1rmKg: 110,
    });

    const state = await db.state.computeAthleteState();

    expect(state?.cut_state).toMatchObject({
      e1rm_at_cut_start_kg: 110,
      e1rm_change_pct: 9.1,
      weeks_in_cut: 3,
    });
  });

  it("calculates weeks_in_cut from cut_start_date when present", async () => {
    const db = await loadFreshDb("state-cut-start-date");
    await seedCutProfile(db, {
      last_training_date: isoDateDaysFromToday(-1),
      cut_start_e1rm_kg: "108",
      cut_start_date: isoDateDaysFromToday(-35),
      cut_start_bodyweight_kg: "72",
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-1),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 2,
      e1rmKg: 100,
    });

    const state = await db.state.computeAthleteState();

    expect(state?.cut_state?.weeks_in_cut).toBe(5);
  });

  it("uses cut_start_bodyweight_kg from the profile when present", async () => {
    const db = await loadFreshDb("state-cut-start-bodyweight-profile");
    await seedCutProfile(db, {
      last_training_date: isoDateDaysFromToday(-1),
      current_bodyweight_kg: "69.5",
      cut_start_bodyweight_kg: "72.5",
      cut_start_e1rm_kg: "108",
      cut_start_date: isoDateDaysFromToday(-21),
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-1),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 2,
      e1rmKg: 100,
      bodyweightKg: 68.8,
    });

    const state = await db.state.computeAthleteState();

    expect(state?.cut_state?.bw_start_kg).toBe(72.5);
  });

  it("falls back to current_bodyweight_kg when cut_start_bodyweight_kg is blank", async () => {
    const db = await loadFreshDb("state-cut-start-bodyweight-fallback");
    await seedCutProfile(db, {
      last_training_date: isoDateDaysFromToday(-1),
      current_bodyweight_kg: "69.5",
      cut_start_bodyweight_kg: "",
      cut_start_e1rm_kg: "108",
      cut_start_date: isoDateDaysFromToday(-21),
    });
    await seedSession(db, {
      date: isoDateDaysFromToday(-1),
      sessionType: "heavy",
      dayType: "push",
      topSingleKg: 90,
      topSingleRir: 2,
      e1rmKg: 100,
      bodyweightKg: 68.8,
    });

    const state = await db.state.computeAthleteState();

    expect(state?.cut_state?.bw_start_kg).toBe(69.5);
  });
});
