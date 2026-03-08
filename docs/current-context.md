# Current Context

## Mission

Build a private AI coaching system focused first on making Sidney the strongest possible natural flat barbell bencher.

## Current Phase

Knowledge ingestion complete. Product definition complete. Engine design complete. T7 usable loop complete. T7 reviewed and approved. T8 test/regression slice complete. The post-T8 punch list slice is now complete for S4, H2, M1, and M4, with local validation green.

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

### T9: Post-T8 punch list slice — DONE

- Implemented S4 in `src/import/strengthlog.ts` so import stores one `e1rm_history` row per bench standard present in a session's working flat-bench sets
- Implemented H2 in `src/db/seed.ts`, `src/db/queries/state.ts`, and the profile UI so cut-start e1RM/date anchors are stable and manually overrideable
- Implemented M1 in `src/engine/safety.ts` and `src/engine/session-generator.ts` so a deload combined with Level 2 pain also applies the joint-friendly variant swap
- Implemented M4 in `src/db/seed.ts`, `src/db/queries/state.ts`, and the profile UI so cut-start bodyweight is stable and manually overrideable
- Added new automated coverage in `tests/import/strengthlog.test.ts`, `tests/engine/state.test.ts`, `tests/engine/safety.test.ts`, and `tests/engine/session-generator.test.ts`
- Validation passed: `npm test` (95 tests), `npm run build`, and `npx tsc --noEmit`

### Infrastructure: Production deployment — DONE

- Domain: sidneydrost.com via Cloudflare (Full strict SSL, proxied)
- Server: Hetzner 4GB RAM, IP 95.217.0.96, Ubuntu 24.04 LTS
- Stack: Cloudflare → nginx (port 443, origin cert) → Next.js (port 3000 via PM2)
- GitHub repo: github.com/sidney7896/SAIC (initial commit pushed with full T1-T8 codebase)
- PM2 process manager with systemd auto-start on reboot
- DNS A record: @ → 95.217.0.96 (proxied), plus coach subdomain
- Site live and returning HTTP 200 at https://sidneydrost.com

### Research pipeline — USER-DRIVEN

- `FBAC-Bench-Research-Prompts.md` contains 18 research prompts across 13 domains
- 3-stage pipeline: ChatGPT Deep Research → GPT Pro synthesis → Claude Opus final doc
- User will run prompts through their own subscriptions (no API costs)

## What's Next

### Remaining follow-ups

- Decide whether to implement true same-session safety-override adjustments from `actual_result` or keep the current next-session mini-deload path as the only overshoot response
- Decide whether mixed same-date multi-standard sessions should become multiple `RecentSession` state entries instead of collapsing to one session-level primary standard
- Review and possibly implement S6 (`evaluateProgression` still reads `last_heavy_push` directly instead of using the comparable-session matcher)

### LLM layer decision

- User declined API usage costs. LLM explanation layer (`src/llm/`) is dead code with graceful fallback. Enriched rules-based explanation (H1) is the production path. No `.env` needed on server.

### Infrastructure next steps

- Deploy the accumulated local fixes to production (S5 + H1 + S4 + H2 + M1 + M4)
- Set up deployment workflow (currently manual)
- Consider adding a `www` CNAME redirect in Cloudflare

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
- Mixed same-date sessions are still collapsed to one `RecentSession` when AthleteState is computed, even though `e1rm_history` now preserves per-standard rows
- ~~Zero e1RM not guarded in session generator (S5)~~ FIXED
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

2026-03-08. Post-T8 punch list slice completed for S4, H2, M1, and M4 with tests/build/typecheck green. Next: Claude review, then deployment of the accumulated local fixes.
