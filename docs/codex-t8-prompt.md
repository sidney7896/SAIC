# Codex T8 Prompt — Bug Fixes + Tests

Copy and paste this entire prompt to Codex.

---

## Context

You are working on a private bench press coaching system. T7 (the first usable coaching loop) has been reviewed and approved by the planning role. A deep code audit (SENTINEL) found 3 bugs that must be fixed before tests are written. Your job is to apply those fixes and then convert all 64 `it.todo()` test placeholders into real assertions.

**Read these files first (in this order):**

1. `docs/task-plan.md` — the T8 section has the full execution plan
2. `docs/review-notes.md` — all findings from the T7 review and SENTINEL audit
3. `docs/engine-design.md` — the authoritative spec for expected behavior
4. `docs/coach-logic.md` — the coaching logic rules
5. `evals/bench-cases.md` — the 15 evaluation cases (integration test targets)
6. `docs/implementation-notes.md` — known implementation gaps and decisions

## Step 1 — Apply 3 Pre-Test Bug Fixes

Apply these fixes in order. Each is small and surgical.

### Fix S1: Timezone consistency (`src/lib/dates.ts`)

**Problem:** `isoToday()` uses local time methods but `daysBetween()` parses dates as UTC. This causes off-by-one errors in non-UTC timezones.

**Fix:** In the `formatDateParts` function, replace the three local date methods with their UTC equivalents:

```typescript
// BEFORE (local time — WRONG)
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

// AFTER (UTC — CORRECT)
const year = date.getUTCFullYear();
const month = String(date.getUTCMonth() + 1).padStart(2, "0");
const day = String(date.getUTCDate()).padStart(2, "0");
```

Also update `isoToday()` to construct the Date in UTC context. The simplest way:
```typescript
export function isoToday() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}
```

Or keep using `formatDateParts(new Date())` since `formatDateParts` now uses UTC methods.

### Fix S2: Profile form boolean default (`src/lib/profile.ts`, line 57)

**Problem:** When `is_in_caloric_deficit` key is missing from the profile map, the form defaults to `true` instead of `false`, which can silently force the engine into cut phase.

**Fix:** Change line 57 from:
```typescript
isInCaloricDeficit: map.get("is_in_caloric_deficit") !== "false",
```
to:
```typescript
isInCaloricDeficit: map.get("is_in_caloric_deficit") === "true",
```

### Fix H4: Top single variation (`src/engine/session-generator.ts`, line 152)

**Problem:** Cut heavy push top single uses `"touch_and_go"` instead of `"paused"`. Competition bench requires a pause command.

**Fix:** Change line 152 from:
```typescript
variation: "touch_and_go",
```
to:
```typescript
variation: "paused",
```

This is in the cut heavy push else branch (around line 149–161), the `exercises.push` for the order 1 heavy single.

## Step 2 — Apply S3 Fix During Test Writing

When you reach priority item 4 (safety gate / mini-deload tests):

### Fix S3: Mini-deload threshold (`src/db/queries/state.ts`, lines 200–207)

**Problem:** `consecutive_sessions_above_target_rpe` counts sessions where `rir <= 1` (RPE ≥ 9). The cut target is RPE 8 (RIR 2). Sessions at RPE 8.5 (RIR 1.5) overshoot target but aren't counted.

**Fix:** Change the threshold from `rir <= 1` to `rir <= 1.5` in the loop that counts consecutive sessions above target RPE. Then write tests that verify:
- Two consecutive sessions at RIR 1.5 → mini-deload fires
- Two consecutive sessions at RIR 2.0 → mini-deload does NOT fire
- A session at RIR 1.0 followed by RIR 2.0 → streak resets, no mini-deload

## Step 3 — Write Tests

Replace all 64 `it.todo()` placeholders with real assertions. Follow this priority order:

1. **e1RM calculation** (`tests/engine/e1rm.test.ts`): RPE table at every half-step (6.0–10.0), Epley with RIR, Epley without RIR → unavailable, edge cases (0 weight, reps > 10, null RIR on single)
2. **Comparable session matching** (`tests/engine/comparable-sessions.test.ts`): Same type/day/standard matches; cross-type excluded; cross-standard excluded; insufficient data → low confidence; history ordering newest-first
3. **Deload trigger evaluation** (`tests/engine/deload-triggers.test.ts`): 0/3, 1/3, 2/3, 3/3 triggers met; borderline values (1.9% vs 2.0% e1RM drop, 0.9 vs 1.0 RPE drift, 2.9 vs 3.0 pain avg); empty history
4. **Safety gate** (`tests/engine/safety.test.ts`): All 5 paths (proceed, modify, deload, mini-deload, stop); Level 2 pain modifications; Level 3/4 stop; deload when triggers fire; mini-deload on consecutive RPE — **apply S3 fix here**
5. **Cut strength monitoring** (`tests/engine/cut-strength.test.ts`): stable, ≤3%, 3–5%, >5%; with and without RPE drift; non-cut phase returns null
6. **Session generator — cut phase** (`tests/engine/session-generator.test.ts`): Heavy/push, medium/legs, light/pull prescriptions; opportunity-day +2.5kg adjustment; bad-day −2.5kg; safety-modify variant swap; deload modifiers applied; verify top single is now "paused" (H4 fix)
7. **Back-off weight** (`tests/engine/backoff.test.ts`): By block type; cut uses lower end of range; rounding to 2.5 kg
8. **Phase resolution** (`tests/engine/phase.test.ts`): Calendar-based, override priority, manual phase, caloric deficit override, transition on >7 days gap
9. **Progression logic** (`tests/engine/progression.test.ts`): RPE below/at/above target → increase/hold/decrease; missing RIR → hold
10. **Import heuristics** (`tests/import/strengthlog.test.ts`): classifySessionType for representative rows (single → heavy/push, 2+ sets 3-5 reps → medium/legs, else → light/pull); inferBenchStandard for keyword variations ("wrap" → gym_wraps, "paused"/"ipf" → ipf, else → gym)
11. **Validation** (`tests/engine/validation.test.ts`): Valid input passes; missing required fields caught; out-of-range values caught
12. **Integration** (`tests/integration/`): Map eval cases 1, 2, 3, 4, 5, 7, 10, 11, 15 from `evals/bench-cases.md` into integration tests against the full engine pipeline

## Step 4 — Verify

After all tests are written:

1. Run `npm test` — all tests must pass
2. Run `npm run build` — no type errors
3. Document any new edge cases or deviations discovered during test writing in `docs/implementation-notes.md`
4. Update `docs/task-plan.md` T8 status to `done` with a summary of what was done

## Important Constraints

- Do NOT change coaching logic beyond the 4 fixes specified above (S1, S2, S3, H4)
- Do NOT broaden scope beyond bench-only phase 1
- Do NOT add new features or modules
- If you discover a new bug while writing tests, document it in `docs/implementation-notes.md` but do not fix it unless it directly blocks the test from being meaningful
- Use `docs/engine-design.md` as the expected-behavior reference for test assertions
- Use `docs/coach-logic.md` for coaching rule verification
- Keep test files organized to match the source file structure
