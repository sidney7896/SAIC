# Implementation Notes

Use this file for build and test handoff between Codex chats.

## Latest Slice

- Status: Post-T8 punch list slice complete (S4 + H2 + M1 + M4)
- Summary: Implemented per-standard import e1RM storage, stable cut-start profile anchors for e1RM/date/bodyweight, and the deload-plus-Level-2 joint-friendly merge. Added import/state/safety/session coverage and revalidated the repo with tests, build, and typecheck green.

## Files Touched

- `src/app/profile/actions.ts`
- `src/app/profile/page.tsx`
- `src/db/queries/state.ts`
- `src/db/seed.ts`
- `src/engine/safety.ts`
- `src/engine/session-generator.ts`
- `src/engine/types.ts`
- `src/import/strengthlog.ts`
- `src/lib/profile-defaults.ts`
- `src/lib/profile.ts`
- `tests/engine/safety.test.ts`
- `tests/engine/session-generator.test.ts`
- `tests/engine/state.test.ts`
- `tests/import/strengthlog.test.ts`
- `docs/current-context.md`
- `docs/task-plan.md`
- `docs/implementation-notes.md`

## Tests Added

- `tests/engine/state.test.ts`
- Added S4 coverage to `tests/import/strengthlog.test.ts`
- Added M1 safety coverage to `tests/engine/safety.test.ts`
- Added M1 session-generation coverage to `tests/engine/session-generator.test.ts`

## Commands Run

- `npm test -- tests/import/strengthlog.test.ts tests/engine/state.test.ts tests/engine/safety.test.ts tests/engine/session-generator.test.ts`
- `npm test`
- `npm run build`
- `npx tsc --noEmit`

## Validation

- `npm test` passed with 95 tests across 13 test files
- `npm run build` passed
- `npx tsc --noEmit` passed
- The DB-backed suites still use isolated temp SQLite files and do not touch `data/bench-coach.sqlite`

## Assumptions

- Blank profile anchor values (`cut_start_e1rm_kg`, `cut_start_date`, `cut_start_bodyweight_kg`) are treated as missing so older DBs can still fall back safely
- `cut_start_bodyweight_kg` seeds from the current profile bodyweight because `athlete-profile.md` does not carry a separate explicit cut-start bodyweight
- The joint-friendly deload swap applies to the cut heavy push back-off slot, matching the existing Level 2 modify path

## Completed Fixes (2026-03-08)

### S4 — Import multi-standard e1RM

- Replaced the single-row import heuristic with `getE1rmRowsPerStandard()` in `src/import/strengthlog.ts`
- Import now stores one `e1rm_history` row per bench standard present in the session's working flat bench sets
- Selection order remains: single with RIR first, otherwise multi-rep with RIR, then highest load within that standard

### H2 — Stable cut-start e1RM anchor

- Added `cut_start_e1rm_kg` and `cut_start_date` profile entries
- `ensureSeedData()` now backfills those keys from the earliest heavy gym-standard `e1rm_history` row when no manual value exists
- `computeAthleteState()` now uses the profile anchors first and only falls back to the trailing-window history when the profile anchor is blank or missing

### M1 — Deload plus Level 2 joint-friendly merge

- Added `preferJointFriendly` to `SafetyAction`
- When 2-of-3 deload triggers fire and pain is 3–4/10, the safety gate now preserves the deload and also flags the joint-friendly variant swap
- The deload back-off slot now swaps to `spoto_press` / `joint_friendly` in that combined case

### M4 — Stable cut-start bodyweight

- Added `cut_start_bodyweight_kg` profile entry
- `computeAthleteState()` now uses that value for `cut_state.bw_start_kg`, with a fallback to the current profile bodyweight when blank or missing
- The profile page now exposes all three cut-start anchors for manual override

## Known Issues

- Imported historical `day_type` remains heuristic and may need refinement if the CSV ever contains ambiguous medium/light sessions
- Eval case 2's exact same-session safety-override behavior is still not implemented in `generateSession`; the T8 integration test covers the available next-session mini-deload path instead
- `computeAthleteState()` still collapses each calendar session into one `RecentSession`, so if two standards are logged on the same date only one standard currently feeds comparable-session trend logic even though `e1rm_history` now preserves both rows
- Git push / SSH deployment were not run from this environment, so production still needs the accumulated local fixes deployed

## Exact Next Step (for Codex)

1. Hand back to Claude for review of the completed S4/H2/M1/M4 slice
2. After review, deploy the accumulated local fixes (S5/H1/S4/H2/M1/M4) to production
3. Next likely engineering follow-up: decide whether to promote mixed same-date multi-standard sessions into per-standard recent-session state instead of collapsing them to one `RecentSession`
