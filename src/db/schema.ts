import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  sessionType: text("session_type").notNull(),
  dayType: text("day_type").notNull(),
  painBefore: real("pain_before"),
  painDuring: real("pain_during"),
  painAfter: real("pain_after"),
  painLocation: text("pain_location"),
  sleepHours: real("sleep_hours"),
  bodyweightKg: real("bodyweight_kg"),
  subjectiveReadiness: integer("subjective_readiness"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const sets = sqliteTable("sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id),
  exercise: text("exercise").notNull(),
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps").notNull(),
  sets: integer("num_sets").notNull().default(1),
  rir: real("rir"),
  benchStandard: text("bench_standard"),
  isTopSingle: integer("is_top_single").notNull().default(0),
  isWarmup: integer("is_warmup").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  notes: text("notes"),
});

export const e1rmHistory = sqliteTable("e1rm_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id),
  date: text("date").notNull(),
  benchStandard: text("bench_standard").notNull(),
  valueKg: real("value_kg").notNull(),
  method: text("method").notNull(),
  confidence: text("confidence").notNull(),
  sourceWeightKg: real("source_weight_kg"),
  sourceReps: integer("source_reps"),
  sourceRir: real("source_rir"),
});

export const athleteProfile = sqliteTable("athlete_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const recommendations = sqliteTable("recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").references(() => sessions.id),
  date: text("date").notNull(),
  phase: text("phase").notNull(),
  prescriptionJson: text("prescription_json").notNull(),
  stateSnapshotJson: text("state_snapshot_json").notNull(),
  explanationJson: text("explanation_json"),
  createdAt: text("created_at").notNull(),
});

export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
export type SetRow = typeof sets.$inferSelect;
export type NewSetRow = typeof sets.$inferInsert;
export type E1rmHistoryRow = typeof e1rmHistory.$inferSelect;
export type NewE1rmHistoryRow = typeof e1rmHistory.$inferInsert;
export type AthleteProfileRow = typeof athleteProfile.$inferSelect;
export type NewAthleteProfileRow = typeof athleteProfile.$inferInsert;
export type RecommendationRow = typeof recommendations.$inferSelect;
export type NewRecommendationRow = typeof recommendations.$inferInsert;
