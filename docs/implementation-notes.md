# Implementation Notes

Use this file for build and test handoff between Codex chats.

## Latest Slice

- Status: T8 test and regression slice complete
- Summary: applied the approved pre-test fixes (S1, S2, H4) plus the during-test S3 threshold fix, replaced the placeholder suite with real assertions, added the missing session-generator/import coverage, and verified the repo with green tests plus a clean production build.

## Files Touched

- `src/lib/dates.ts`
- `src/lib/profile.ts`
- `src/engine/session-generator.ts`
- `src/db/queries/state.ts`
- `vitest.config.ts`
- `tests/helpers/fixtures.ts`
- `tests/helpers/temp-db.ts`
- `tests/helpers/server-only-stub.ts`
- `tests/engine/backoff.test.ts`
- `tests/engine/comparable-sessions.test.ts`
- `tests/engine/cut-strength.test.ts`
- `tests/engine/deload-triggers.test.ts`
- `tests/engine/e1rm.test.ts`
- `tests/engine/phase.test.ts`
- `tests/engine/progression.test.ts`
- `tests/engine/safety.test.ts`
- `tests/engine/session-generator.test.ts`
- `tests/engine/validation.test.ts`
- `tests/import/strengthlog.test.ts`
- `tests/integration/bench-cases.test.ts`
- `docs/current-context.md`
- `docs/task-plan.md`
- `docs/implementation-notes.md`

## Commands Run

- `npm test`
- `npm run build`

## Validation

- `npm test` passed with 85 assertions across 12 test files
- `npm run build` passed
- The DB-backed test suites use isolated temp SQLite files and do not touch `data/bench-coach.sqlite`

## Assumptions

- Imported historical `day_type` remains heuristic (`heavy -> push`, `medium -> legs`, `light -> pull`) because the seed CSV does not encode it explicitly
- The current rules layer still handles overshoot management on the next recommendation via `consecutive_sessions_above_target_rpe`; it does not yet mutate the in-session prescription from `actual_result`
- The Vitest alias for `server-only` is test-only infrastructure so DB-backed modules can load under plain Node without affecting the app build

## Known Issues

- Imported historical `day_type` remains heuristic and may need refinement if the CSV ever contains ambiguous medium/light sessions
- Eval case 2's exact same-session safety-override behavior is still not implemented in `generateSession`; the T8 integration test covers the available next-session mini-deload path instead
- Import still stores only one e1RM row per session even when multiple bench standards appear in one imported session (S4)
- Zero gym e1RM can still produce unusable percentage-based prescriptions (S5)

## Exact Next Step

- Hand off to Claude for a post-T8 review/planning pass. Claude should verify the completed T8 slice against `docs/review-notes.md`, confirm the next highest-value follow-up, and then send Codex back to implement either H1 (explanation specificity) or the first correctness gap from the post-T8 punch list (`S4` or `S5`).
