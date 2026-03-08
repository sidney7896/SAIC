import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

const DEFAULT_DATABASE_PATH = path.join(
  process.cwd(),
  "data",
  "bench-coach.sqlite",
);

const databaseUrl = process.env.DATABASE_URL;
const databaseFilePath = databaseUrl?.startsWith("file:")
  ? path.resolve(process.cwd(), databaseUrl.replace(/^file:/, ""))
  : DEFAULT_DATABASE_PATH;

let initialized = false;
let sqlite: Database.Database | null = null;

export function getSqlite() {
  if (sqlite) {
    return sqlite;
  }

  fs.mkdirSync(path.dirname(databaseFilePath), { recursive: true });

  sqlite = new Database(databaseFilePath);
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");

  return sqlite;
}

function createTables() {
  getSqlite().exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      session_type TEXT NOT NULL,
      day_type TEXT NOT NULL,
      pain_before REAL,
      pain_during REAL,
      pain_after REAL,
      pain_location TEXT,
      sleep_hours REAL,
      bodyweight_kg REAL,
      subjective_readiness INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      num_sets INTEGER NOT NULL DEFAULT 1,
      rir REAL,
      bench_standard TEXT,
      is_top_single INTEGER NOT NULL DEFAULT 0,
      is_warmup INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS e1rm_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      bench_standard TEXT NOT NULL,
      value_kg REAL NOT NULL,
      method TEXT NOT NULL,
      confidence TEXT NOT NULL,
      source_weight_kg REAL,
      source_reps INTEGER,
      source_rir REAL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS athlete_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      date TEXT NOT NULL,
      phase TEXT NOT NULL,
      prescription_json TEXT NOT NULL,
      state_snapshot_json TEXT NOT NULL,
      explanation_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);
}

export function ensureDatabaseInitialized() {
  if (initialized) {
    return;
  }

  createTables();
  initialized = true;
}

export function getDb() {
  ensureDatabaseInitialized();

  return drizzle(getSqlite(), { schema });
}

export function runInTransaction<T>(callback: () => T): T {
  ensureDatabaseInitialized();

  const transaction = getSqlite().transaction(callback);

  return transaction();
}

export function getDatabaseFilePath() {
  return databaseFilePath;
}
