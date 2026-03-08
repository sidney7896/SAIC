# ADR-005: Implementation Stack

## Status

Accepted

## Date

2026-03-07

## Context

T6 requires selecting the implementation stack before scaffolding. Six open questions from `docs/engine-design.md` need resolution. The system is private (single user), bench-specific, and needs both deterministic rules (e1RM, deload triggers) and LLM-generated explanations.

## Decisions

### 1. Language: TypeScript (full stack)

TypeScript for both the rules engine and the web app. The engine-design interfaces are already written in TypeScript notation. Using one language eliminates serialisation boundaries between the rules layer and the UI. TypeScript's type system directly enforces the input/output contracts.

Rejected: Python. Good for data science but adds a language boundary. The data pipeline here is simple (CSV import, e1RM math, trend tracking) — no need for pandas/numpy.

### 2. Framework: Next.js 14+ (App Router)

Next.js gives us server-side rendering for the dashboard, API routes for the engine, and a React frontend — all in one project. The app is local-first but can be deployed if needed later.

Key routes:
- `/` — Dashboard (StatusReport view)
- `/session/new` — Get today's recommendation (SessionRecommendation view)
- `/session/log` — Log a completed session (SessionInput form)
- `/session/[id]` — Review a past session
- `/history` — Training history with e1RM charts
- `/profile` — Athlete profile editor

Rejected: CLI-first (too limited for charts and dashboard). React Native (premature — web first, mobile later if needed).

### 3. Storage: SQLite via better-sqlite3

SQLite is the right fit for a single-user local app. It handles the data model (sessions, sets, e1RM history, athlete state) without any server setup. `better-sqlite3` is synchronous and fast for Node.js.

Schema maps directly to the engine-design interfaces:
- `sessions` table ← RecentSession
- `sets` table ← WorkingSet
- `e1rm_history` table ← E1rmEstimate per standard
- `athlete_profile` table ← profile fields
- `alerts` table ← Alert history

Rejected: File-based JSON/CSV (too fragile for relational queries like comparable session matching). Cloud DB (unnecessary complexity for single user).

### 4. LLM Integration: Claude API (Sonnet) for explanations

The LLM layer calls Claude API (Sonnet model — fast and cheap) to generate natural-language explanations from the structured rules-layer output. The rules layer produces a complete `SessionRecommendation` with all weights and exercises. The LLM receives this plus recent session context and generates the `explanation` field.

Fallback: If the API is unavailable, the system uses template-based explanations (structured string interpolation from the rules output). The recommendation is never blocked by LLM availability — the prescription stands alone.

Rejected: Template-only (too rigid for multi-signal synthesis). Local model (unnecessary complexity, Sonnet is fast enough via API).

### 5. Strengthlog Sync: Manual CSV import (phase 1)

Sidney exports CSV from Strengthlog and uploads it via the web UI. The import pipeline parses the CSV using the same logic that created `data/training/bench-log.csv`, validates, deduplicates, and upserts into SQLite.

Rejected: API integration (Strengthlog's API is undocumented and unreliable). Automated sync (premature — manual import is fine for the usage pattern).

### 6. State Persistence: Computed from SQLite, cached in memory

`AthleteState` is computed from SQLite queries on each engine request. The queries are simple (last N sessions by type, e1RM history, pain scores) and SQLite is fast enough for this volume (~200 sessions/year). No separate state file or versioning needed.

The computed state is cached in the Next.js server for the duration of a page load (no cross-request caching needed for single user).

Rejected: Separate JSON state file (redundant with SQLite, creates sync issues). Recompute from CSV (loses structured session data logged through the app).

## Consequences

- Single-language stack reduces context switching and serialisation overhead.
- SQLite is the only external dependency beyond Node.js and the Claude API.
- The system runs locally with `npm run dev` — no Docker, no cloud services required.
- Claude API is the only network dependency, and the system degrades gracefully without it.
- The stack is deliberately boring and proven. No experimental frameworks.
- Migration path: if the app needs to be deployed, Next.js deploys trivially to Vercel. SQLite can be replaced with Postgres via Drizzle ORM if multi-device sync is ever needed.
