# Current Context

## Mission

Build a private AI coaching system focused first on making Sidney the strongest possible natural flat barbell bencher.

## Current Phase

Knowledge ingestion complete. Product definition complete. Engine design complete. T7 usable loop complete. T7 reviewed and approved. T8 test/regression slice complete, including the four approved fixes (S1, S2, S3, H4) and automated coverage for the rules engine plus cut-phase integration cases.

## What's Done

### T1: Source-of-truth docs — DONE

- `knowledge/about-me.md` — full athlete context
- `data/profile/athlete-profile.md` — structured profile with three-standard tracking
- `data/training/bench-log.csv` — 1333 bench sets from Strengthlog (Nov 2024 – Mar 2026)
- `knowledge/research/bench-strategy-v1.5-reference.md` — APTIS reference doc
- `knowledge/research/bench-mastery-system-v1-reference.md` — Bench Mastery System v1 reference doc
- `docs/coach-logic.md` — rewritten with real coaching logic
- `docs/spec.md` — rewritten with real inputs, outputs, scope
- `docs/review-rubric.md` — rewritten with specific failure modes
- `docs/adr/ADR-002-three-bench-standards.md` — accepted
- `docs/adr/ADR-003-coach-generates-programming.md` — accepted

### T2: Athlete profile inputs — DONE

### T3: Bench training log inputs — DONE

### T4: Evaluation cases — DONE

- `evals/bench-cases.md` — 15 Sidney-specific evaluation cases covering all coaching logic paths
- Scoring lens: specificity, safety, personalisation, logic correctness, explainability, actionability

### T5: Recommendation engine design — DONE

- `docs/engine-design.md` — full engine design document with:
  - Hybrid rules + LLM architecture (ADR-004 accepted)
  - Input schemas (SessionInput, AthleteState)
  - 5-step decision pipeline (resolve phase → safety gate → template selection → populate prescription → generate explanation)
  - Session generation algorithms for all 6 phases (cut, builder, peaking, test day, transition, pivot)
  - Output schemas (SessionRecommendation, StatusReport)
  - Rules-based modules: e1RM calculator, comparable session matcher, deload trigger evaluator, cut-phase strength monitor, data validator
  - Implementation boundary: rules-based vs LLM-assisted split per module
- Test coverage requirements mapped to 15 eval cases

### T6: Product shell scaffold — DONE

- Next.js 14 + TypeScript app scaffold created under `src/`
- App routes stubbed: dashboard, session/new, session/log, session/[id], history, profile, import
- SQLite schema implemented in `src/db/schema.ts`
- SQLite first-run initialization implemented in `src/db/client.ts`
- Database verified with tables: sessions, sets, e1rm_history, athlete_profile, recommendations
- All documented engine interfaces added to `src/engine/types.ts`
- All required constant tables added to `src/engine/constants.ts`
- Engine, DB query, import, and LLM module stubs added with TODO bodies
- Real seed CSV copied to `data/bench-log.csv`
- Test scaffold added under `tests/` with 64 `it.todo()` placeholders
- Validation passed: `npm install`, `npm run build`, `npm test`, `npm run dev`

### T7: Profile, logging, and recommendation flow — DONE

- Profile page now persists durable athlete settings into `athlete_profile`
- SQLite seed path now imports the real Strengthlog history and repairs key default profile values
- Query modules now perform real reads/writes with row mapping from SQLite into typed app models
- `computeAthleteState()` now builds phase, e1RM, recent sessions, deload state, and cut-state context from SQLite
- Rules engine modules now implement the first real cut-focused recommendation logic, safety gate, deload checks, and fallback explanation generation
- `/session/new` generates a stored recommendation with explanation and visible basis
- `/session/log` stores a completed session, sets, and e1RM history, and can link the log back to a recommendation
- `/session/[id]` reviews the logged session and linked recommendation together
- `/history`, `/profile`, `/import`, and `/` now render real data instead of stubs
- Manual runtime validation completed in the browser against `http://localhost:3000`

### T8: Tests and regression checks — DONE

- Applied S1 in `src/lib/dates.ts` so `isoToday()`, `daysBetween()`, and `addDays()` all use UTC consistently
- Applied S2 in `src/lib/profile.ts` so missing `is_in_caloric_deficit` data defaults to `false` instead of silently forcing cut phase
- Applied H4 in `src/engine/session-generator.ts` so cut heavy push singles default to `paused`
- Applied S3 in `src/db/queries/state.ts` so two consecutive sessions at RIR 1.5 count toward the mini-deload streak
- Replaced the 64 placeholder tests with real assertions and added the missing session-generator/import suites
- Added isolated temp-SQLite test helpers for DB-backed import/state/integration coverage
- Automated coverage now spans e1RM math, comparable-session matching, deload triggers, safety gate paths, cut strength thresholds, phase resolution, progression, session generation, import heuristics, validation, and eval cases 1/2/3/4/5/7/10/11/15
- Validation passed: `npm test` (85 tests) and `npm run build`

## What's Next

### Post-T8 punch list

- Immediate handoff: Claude should do a post-T8 review/planning pass, verify scope discipline against the completed test slice, and choose the next focused follow-up task.
- Improve explanation specificity (H1) so recommendations surface the actual e1RM, progression adjustment, back-off %, and safety modifiers instead of generic cut-template language
- Add a real cut-start e1RM anchor (H2) instead of using the oldest point in the recent history window
- Store per-standard e1RM entries during import when multiple standards appear in the same session (S4)
- Guard against zero-kg prescriptions when no usable gym e1RM exists (S5)
- Decide whether to implement true same-session safety-override adjustments from `actual_result` or keep the current next-session mini-deload path as the only overshoot response

## Resolved Design Questions

All 6 open questions from engine-design.md resolved in ADR-005:

1. Language: TypeScript (full stack)
2. Storage: SQLite via better-sqlite3
3. LLM: Claude API (Sonnet) with template fallback
4. UI: Next.js 14+ (App Router)
5. Strengthlog sync: manual CSV import (phase 1)
6. State: computed from SQLite, cached in memory (no separate persistence layer)

## Remaining Gaps

- Technique details not captured yet (Sidney's technique is still developing)
- Historical bench data not tagged with bench_standard field (assumed gym no wraps)
- Historical `day_type` for imported CSV sessions is still heuristic rather than explicit
- Same-session safety-override adjustments from `actual_result.top_single` are still not implemented in the recommendation generator; T8 integration coverage for eval case 2 uses the existing next-session mini-deload path instead
- Import only stores one e1RM per session even when multiple standards present (S4 — post-T8)
- Zero e1RM not guarded in session generator (S5 — post-T8)
- Wearable data integration scope not decided

## Key Files To Trust First

1. `CHAT_CONTINUITY.md`
2. `CLAUDE.md` or `AGENTS.md`
3. `docs/spec.md`
4. `docs/coach-logic.md`
5. `docs/engine-design.md`
6. `docs/task-plan.md`
7. `docs/review-rubric.md`
8. `docs/implementation-notes.md`
9. `docs/review-notes.md`

## Last Updated

2026-03-08, updated at `[end]` after T8 completion. Tests/build green, four approved fixes applied, next step is Claude post-T8 review and prioritization.
