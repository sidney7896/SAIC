# Task Plan

Use this as the shared execution plan between Claude and Codex. Keep statuses current and keep each task slice buildable.

## Status Key

- `todo`
- `in_progress`
- `blocked`
- `done`

## Required Tasks

### T1. Build the project source-of-truth docs

- Status: `done`
- Goal: tighten the product spec, coach logic, review rubric, and current context around the actual user materials.
- Completed: 2026-03-07
- What was done:
  - Ingested full Strengthlog CSV export (1333 bench sets, 157 sessions, Nov 2024 – Mar 2026)
  - Populated `knowledge/about-me.md` from athlete context dump
  - Created `data/profile/athlete-profile.md` with structured profile
  - Created `data/training/bench-log.csv` with clean bench data
  - Filed two reference program docs in `knowledge/research/`
  - Rewrote `docs/coach-logic.md` with real coaching logic (e1RM, deload, progression, pain, phases, non-negotiables)
  - Rewrote `docs/spec.md` with real inputs, outputs, scope, and resolved questions
  - Rewrote `docs/review-rubric.md` with specific failure modes and review criteria
  - Created ADR-002 (three bench standards) and ADR-003 (coach generates programming)
  - Updated `docs/current-context.md`

### T2. Define structured athlete profile inputs

- Status: `done`
- Goal: convert the user's context into a stable athlete profile schema.
- Completed: 2026-03-07
- What was done:
  - Created `data/profile/athlete-profile.md` with: identity, bench baseline (per standard), body stats, constraints, recovery profile, coaching preferences, historical notes, bench standard tracking, programming intent
  - Profile fields are defined in the spec's "Core Inputs" section

### T3. Define bench training log inputs

- Status: `done`
- Goal: create the minimum bench-relevant training data model needed for good recommendations.
- Completed: 2026-03-07
- What was done:
  - Created `data/training/bench-log.csv` with schema: date, variation, load_kg, reps, rir, warmup, fail, notes
  - 1333 rows imported from Strengthlog export
  - Spec defines per-session minimum logging fields
  - Note: bench_standard field not yet tagged on historical data (most is gym no wraps by default)

### T4. Build evaluation cases before the main product logic

- Status: `done`
- Goal: define realistic bench scenarios so versions of the coach can be compared.
- Completed: 2026-03-07
- What was done:
  - Rewrote `evals/bench-cases.md` with 15 Sidney-specific evaluation cases using real numbers
  - Cases cover: normal heavy day, safety override, deload trigger (not firing), deload trigger (firing), comparable session rule, standard conflation trap, pain escalation Level 2, cut-phase strength loss warning, good day push opportunity, leg day medium bench, missing RIR data uncertainty, phase transition cut→builder, annual peak W3 check, test day attempt selection, pull day minimal bench
  - Each case includes context, expected output with exact prescriptions, and what a weak answer would look like
  - Scoring lens defined: specificity, safety, personalisation, logic correctness, explainability, actionability

### T5. Design recommendation engine v1

- Status: `done`
- Goal: define the first rules and logic contracts for the coaching engine.
- Completed: 2026-03-07
- What was done:
  - Created `docs/engine-design.md` — full engine design with input/output schemas, decision tree, session generation algorithms for all phases
  - Input schema: SessionInput (per-request data), AthleteState (computed from history), with TypeScript-style interfaces
  - Decision tree: 5-step pipeline (resolve phase → safety gate → template selection → populate prescription → generate explanation)
  - Session generators for: cut, builder (12-week mesocycles with block rotation), peaking (10-week table), test day, transition, deload
  - Output schema: SessionRecommendation (prescription + alerts + explanation + state snapshot), StatusReport (dashboard data)
  - Modules: e1RM calculator, comparable session matcher, deload trigger evaluator, cut-phase strength monitor, data validator
  - Implementation boundaries: rules-based vs LLM-assisted split defined per module
  - Test coverage requirements mapped to eval cases
  - Created ADR-004 (hybrid rules + LLM engine architecture): accepted
  - Open design questions captured for T6: language, storage, LLM integration, UI framework, sync, state persistence

### T6. Scaffold the product shell

- Status: `done`
- Goal: create the initial app shell with all module stubs, database schema, and page routes.
- Stack: Next.js 14+ / TypeScript / SQLite (better-sqlite3) / Drizzle ORM / Vitest / Claude API (Sonnet) — see ADR-005
- Implementation spec: `docs/t6-scaffold-spec.md` — contains exact directory structure, schema, module signatures, dependencies, and acceptance criteria
- Completed: 2026-03-08
- What was done:
  - Created the Next.js 14 / TypeScript project scaffold (`package.json`, tsconfig, Tailwind, Vitest, Drizzle config, env example, gitignore)
  - Added stubbed app routes under `src/app/` for dashboard, session/new, session/log, session/[id], history, profile, and import
  - Added `src/engine/types.ts` with the documented engine interfaces and helper types required by the scaffold signatures
  - Added `src/engine/constants.ts` with `RPE_TABLE`, `VOLUME_TABLE`, `ROTATION_TABLE`, `PEAKING_TABLE`, and `BACKOFF_TABLE`
  - Added all required engine module stubs with exported signatures and TODO bodies
  - Added Drizzle schema definitions and SQLite initialization in `src/db/`
  - Added DB query stubs, Strengthlog import stubs, and LLM boundary stubs
  - Copied the real seed data to `data/bench-log.csv`
  - Added test stubs for all rules modules plus the 15 eval-case integration placeholders
  - Validated the scaffold with `npm install`, `npm run build`, `npm test`, and `npm run dev`
- Acceptance criteria:
  - `npm run dev` starts the app on localhost
  - SQLite database initialises with all tables (sessions, sets, e1rm_history, athlete_profile, recommendations)
  - All TypeScript interfaces from engine-design.md exist in `src/engine/types.ts`
  - All constant tables (RPE, volume, rotation, peaking, backoff) exist in `src/engine/constants.ts`
  - All engine module stubs exist with exported function signatures and TODO bodies
  - All page routes render stub pages with titles
  - All test files exist with describe blocks and `it.todo()` stubs
  - CSV import function signature exists
  - LLM client stub exists with `.env.example`
  - No dummy data — real bench-log.csv is the seed

### T7. Implement profile, logging, and recommendation flow

- Status: `done`
- Goal: ship the first usable bench coach loop.
- Completed: 2026-03-08
- What was done:
  - Implemented real SQLite read/write query modules with typed row mapping
  - Added seed import for the real Strengthlog CSV and profile-default seeding/repair
  - Implemented the first usable AthleteState computation from SQLite history
  - Implemented real rules-layer modules for e1RM, comparable sessions, deload checks, safety, phase resolution, backoff math, cut strength, validation, and session generation
  - Added fallback explanation generation and Claude client fallback behavior
  - Wired `/`, `/profile`, `/session/new`, `/session/log`, `/session/[id]`, `/history`, and `/import` to real data and server actions
  - Stored recommendations and linked them to logged sessions for review
  - Manually validated the recommendation and session-log flow in the browser on localhost
- Acceptance criteria:
  - user can store profile inputs
  - user can log bench sessions
  - system can produce a recommendation with explanation
  - system can show the basis for that recommendation
- Validation notes:
  - Build passes
  - Browser flow passes on `http://localhost:3000`
  - Historical import still infers `day_type` heuristically for seed data

### T8. Add tests and regression checks

- Status: `done`
- Goal: keep the coach logic reproducible and reviewable.
- Completed: 2026-03-08
- Next handoff: Claude should review the finished T8 slice and pick the first post-T8 punch-list item before Codex resumes implementation.
- What was done:
  - Applied the four approved fixes: S1 (UTC date formatting), S2 (profile caloric-deficit boolean default), H4 (paused cut heavy top single), S3 (mini-deload threshold from `rir <= 1` to `rir <= 1.5`)
  - Replaced the placeholder test scaffold with real assertions across the rules modules
  - Added the missing `tests/engine/session-generator.test.ts` and `tests/import/strengthlog.test.ts` files
  - Added temp-SQLite test helpers so import/state/integration coverage can exercise isolated DB-backed flows without touching the seeded app database
  - Mapped integration coverage to eval cases 1, 2, 3, 4, 5, 7, 10, 11, and 15
  - Added a Vitest-only alias for `server-only` so DB-backed modules load in the Node test environment
- Validation notes:
  - `npm test` passed with 85 assertions across 12 test files
  - `npm run build` passed
- **Step 1 — Pre-test bug fixes (do these FIRST, in order):**
  1. **S1** — Fix timezone consistency in `src/lib/dates.ts`: make `formatDateParts` use `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` instead of local methods. This makes `isoToday()`, `daysBetween()`, and `addDays()` all operate in UTC consistently.
  2. **S2** — Fix boolean default in `src/lib/profile.ts` line 57: change `map.get("is_in_caloric_deficit") !== "false"` to `map.get("is_in_caloric_deficit") === "true"`. This prevents the form from silently forcing cut phase on save.
  3. **H4** — Change cut heavy push top single variation from `"touch_and_go"` to `"paused"` in `src/engine/session-generator.ts` line 152. Competition bench requires a pause command.
- **Step 2 — During-test fix:**
  - **S3** — Lower `consecutive_sessions_above_target_rpe` threshold in `src/db/queries/state.ts` lines 200–207. Currently checks `rir <= 1` (RPE ≥ 9). Should check `rir <= 1.5` (RPE ≥ 8.5) to catch sessions that overshoot the target RPE 8 (RIR 2). Apply this fix when writing the mini-deload test cases in priority item 4.
- **Step 3 — Write tests** (priority order from review-notes.md):
  1. e1RM calculation (RPE table at every half-step, Epley with/without RIR, edge cases)
  2. Comparable session matching (same type matches, cross-type exclusion, cross-standard exclusion)
  3. Deload trigger evaluation (0/3 through 3/3, borderline values, empty history)
  4. Safety gate (all paths: proceed, modify, deload, mini-deload, stop) — **apply S3 fix here**
  5. Cut strength monitoring (all thresholds, with/without RPE drift)
  6. Session generator — cut phase (heavy/push, medium/legs, light/pull, opportunity day, bad day, safety modifications, deload modifiers)
  7. Back-off weight calculation (by block, cut adjustment, rounding)
  8. Phase resolution (calendar, overrides, manual phase, deficit override, transition)
  9. Progression logic (increase/hold/decrease, missing RIR)
  10. Import heuristics (classifySessionType, inferBenchStandard)
  11. Validation (valid inputs, missing fields, out-of-range values)
  12. Integration against eval cases 1, 2, 3, 4, 5, 7, 10, 11, 15 (cut-phase cases)
- **Step 4 — Verify:**
  - Run `npm test` — all tests pass
  - Run `npm run build` — no type errors
  - Document any new edge cases in `docs/implementation-notes.md`
- Acceptance criteria:
  - All 3 pre-test fixes applied and verified
  - Key recommendation logic is tested (e1RM, deload triggers, progression, comparable sessions)
  - Regression cases map to `evals/bench-cases.md`
  - Test results are recorded in `docs/implementation-notes.md`
  - `npm test` passes, `npm run build` passes

### T9. Apply the post-T8 punch list fixes

- Status: `done`
- Goal: close the remaining correctness gaps from the post-T8 review without widening the product scope.
- Completed: 2026-03-08
- What was done:
  - Implemented **S4** in `src/import/strengthlog.ts` so import stores one `e1rm_history` row per bench standard present in a session
  - Implemented **H2** in `src/db/seed.ts`, `src/db/queries/state.ts`, and the profile UI so cut-start e1RM/date anchors are stable and user-overridable
  - Implemented **M1** in `src/engine/safety.ts` and `src/engine/session-generator.ts` so deload plus Level 2 pain also applies the joint-friendly back-off variant swap
  - Implemented **M4** in `src/db/queries/state.ts`, `src/db/seed.ts`, and the profile UI so cut-start bodyweight is stable and user-overridable
  - Added new regression coverage for import multi-standard e1RM, stable cut anchors, and the deload-plus-pain merge
- Validation notes:
  - `npm test` passed with 95 tests across 13 files
  - `npm run build` passed
  - `npx tsc --noEmit` passed
- Next handoff:
  - Claude should review the completed slice, then decide whether the next follow-up is deployment or deeper multi-standard state aggregation for mixed same-date sessions

## Optional Later Tasks

- Broaden bench support with accessory logic
- Add technique review support (video analysis)
- Add richer recovery and readiness tracking (wearable integration)
- Strengthlog import/sync automation
- Coach chat mode (conversational interface on top of structured recommendations)
- Expand beyond bench only after phase 1 quality is clearly strong
