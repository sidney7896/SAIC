# Review Notes

Use this file for planning and review handoff between Claude chats and from Claude back to Codex.

## Latest Review Status

- Status: T7 reviewed and approved with findings. SENTINEL deep audit completed.
- Date: 2026-03-08
- Reviewer: Claude (planning role) + SENTINEL audit
- Verdict: **T7 is approved. Proceed to T8 after applying pre-test fixes (H4 + S1 + S2).**

## SENTINEL Deep Audit (2026-03-08)

Full code-level audit of every engine module, import pipeline, database layer, utility libraries, and type definitions. These findings are **in addition to** the T7 review findings (H1–H4, M1–M4, L1–L2) below.

### Pre-T8 Fixes Required

**S1. BUG — Timezone mismatch between `isoToday()` and `daysBetween()` (src/lib/dates.ts)**
- Severity: HIGH
- `isoToday()` uses local time methods (`getFullYear/getMonth/getDate`), but `daysBetween()` parses ISO strings as UTC (`T00:00:00Z`). `addDays()` manipulates UTC dates but formats with local methods.
- In any non-UTC timezone, this produces off-by-one day calculations at timezone boundaries. A one-day error in `days_since_last_bench` or `daysUntilTest` can flip transition triggers or shift peaking week resolution.
- **Fix:** Make `formatDateParts` use `getUTCFullYear/getUTCMonth/getUTCDate`, OR remove the `Z` suffix from `daysBetween`. Both must be consistent. All date functions should use the same reference (recommend UTC throughout).

**S2. BUG — Profile form defaults `isInCaloricDeficit` to true when key is missing (src/lib/profile.ts, line 57)**
- Severity: HIGH
- `mapToProfileFormValues` line 57: `map.get("is_in_caloric_deficit") !== "false"` → when the key is missing, `undefined !== "false"` is `true`. The form pre-fills "in caloric deficit" as ON.
- Compare with `mapToAthleteProfile` line 40: `=== "true"` (correctly defaults to false).
- If a user saves the form without toggling this off, it writes `"true"` to the DB and forces the engine into cut phase permanently.
- **Fix:** Change line 57 to `map.get("is_in_caloric_deficit") === "true"`.

### During-T8 Fixes

**S3. BUG — `consecutive_sessions_above_target_rpe` threshold too strict (src/db/queries/state.ts, lines 200–207)**
- Severity: MEDIUM
- Counts sessions where `top_single_rir <= 1` (RPE ≥ 9). The cut heavy push target RIR is 2 (RPE 8). Sessions at RPE 8.5 (RIR 1.5) overshoot the target but are not counted.
- Mini-deload won't fire for two consecutive sessions at RPE 8.5, even though they consistently overshoot.
- **Fix:** Lower threshold to `rir <= 1.5` or parameterize it against the target RIR. Address when writing mini-deload test cases.

### Post-T8 Punch List

**S4. Import produces only one e1RM per session (src/import/strengthlog.ts, lines 229–262)**
- Severity: MEDIUM
- `getPreferredE1rmRow` returns a single row. If a session has both paused (IPF) and TnG (gym) singles, only the heavier one gets an e1RM entry. IPF e1RM tracking will have gaps.
- **Fix:** Compute and store an e1RM for each bench standard present in the session's working sets.

**S5. Zero e1RM produces zero-kg prescriptions (src/engine/progression.ts line 15, src/engine/session-generator.ts line 45)**
- Severity: MEDIUM
- `state.e1rm.gym?.value_kg ?? 0` produces 0 when no gym e1RM history exists. All percentage-based calculations yield 0 kg. The warmup has a floor but exercises don't.
- **Fix:** Guard in `generateSession`: return "data insufficient" recommendation when `baseE1rm <= 0`.

**S6. `evaluateProgression` doesn't use comparable session matcher (src/engine/session-generator.ts lines 116–118)**
- Severity: LOW-MEDIUM
- Uses `state.last_heavy_push` directly without comparable session matching. Currently safe because the filter is tight, but fragile if selection criteria change.

**S7. Import skips entire sessions on date collision (src/import/strengthlog.ts lines 160–164)**
- Severity: LOW
- Re-importing a CSV with corrections to existing dates silently drops the updated data.

**S8. Module-level `seeded` flag race condition (src/db/seed.ts line 8)**
- Severity: LOW
- Concurrent calls to `ensureSeedData` could both try to seed.

**S9. `parseApproximateDate` uses `Date.parse` fallback (src/lib/dates.ts line 63)**
- Severity: LOW
- Runtime-dependent behavior for non-ISO date strings.

## T7 Review (2026-03-08)

### Scope and Approach

Reviewed the full T7 slice — all engine modules, state computation, import pipeline, safety gate, explanation generation, and session generator — against `docs/spec.md`, `docs/coach-logic.md`, `docs/engine-design.md`, `docs/review-rubric.md`, `evals/bench-cases.md`, and the review rubric failure modes.

### Overall Assessment

T7 delivers a working end-to-end bench coach loop that is structurally sound. The 5-step pipeline from engine-design.md is faithfully implemented for the cut phase. The safety gate, deload trigger evaluation, comparable session matching, and e1RM calculation are all correct in their core logic. The types match the engine-design schemas closely. Scope discipline is strong — nothing was added that doesn't serve the bench coach mission.

The slice is good enough to lock in with tests. The findings below are improvements, not blockers.

### Findings (ordered by severity)

#### HIGH — should be addressed before or during T8

**H1. Explanation quality is too generic (review rubric: "hidden logic" risk)**
- File: `src/engine/explanation.ts`
- The `buildRuleExplanation` function produces the same tradeoff string for every cut session ("Biasing toward strength preservation and fatigue control…") and a generic `rule_applied` ("Used the cut template for a push heavy session."). It does not surface which specific data points drove the prescription: the e1RM value used, whether progression logic fired (+2.5 / hold / −2.5), the comparable session basis, the opportunity-day or bad-day adjustment, or the back-off percentage applied.
- The explanation is structurally correct (all five fields populated) but fails the review rubric's explainability standard: "Can the recommendation be traced from inputs → rule → output?" The answer right now is "partially, via the state_snapshot, but not via the explanation text."
- **Fix scope:** Enrich `buildRuleExplanation` to interpolate the actual values — e1RM, progression action, back-off %, sleep/readiness adjustments, and pain modifications. This can happen in T8 or as a focused follow-up.

**H2. Cut-start e1RM anchor is the oldest session in the 60-row window, not a real cut-start value**
- File: `src/db/queries/state.ts`, line 213
- `cutStartE1rm` is set to `gymHistory[gymHistory.length - 1]?.e1rm_kg` — the oldest gym-standard e1RM in the last 60 sessions. If the cut has been running for more than 60 sessions (unlikely now but possible later), this compresses the apparent strength drop. More importantly, it drifts as old sessions rotate out of the window.
- The profile doesn't store a `cut_start_e1rm` value.
- **Fix scope:** Add a `cut_start_e1rm_kg` key to the profile defaults (seeded from the earliest heavy gym e1RM in the data set, or set manually when the user activates a cut). Use this as the anchor instead of the trailing window. Can be addressed in T8 or as a follow-up.

**H3. Imported day_type is rigidly coupled to session_type**
- File: `src/import/strengthlog.ts`, `classifySessionType` (lines 23–48)
- The heuristic maps: has a single → heavy/push; 2+ sets of 3–5 reps → medium/legs; else → light/pull. This means every medium session in history is tagged as a leg day and every light session as a pull day. If Sidney did medium bench on a push day (which would be unusual but not impossible), comparable session matching will exclude it from medium/push comparisons.
- This was flagged as a known risk in `docs/implementation-notes.md`. The notes field on imported sessions honestly says "day_type inferred heuristically."
- **Fix scope:** T8 tests should include a case that verifies the heuristic produces the right day_type for representative CSV rows (at least one heavy, one medium, one light). If the heuristic is wrong for specific historical sessions, consider adding a manual override path in a later slice. Not a T8 blocker, but T8 should test the heuristic explicitly.

**H4. Cut heavy push top single defaults to "touch_and_go" instead of "comp_bench_paused"**
- File: `src/engine/session-generator.ts`, line 150
- The top single variation is hardcoded to `touch_and_go`. Coach-logic.md says cut-phase bench includes "Comp bench (paused + TnG), close-grip, Spoto press" and "Paused variants, heavy singles, back-offs." The engine-design's cut heavy push template specifies a warmup pyramid ending with a paused single.
- For competition prep (IPF standard requires a pause), the default heavy single should be paused, not TnG.
- **Fix scope:** Change the top single's variation to `"paused"` (or `"comp_bench_paused"`) in the cut heavy push branch. Small fix, can be done in T8.

#### MEDIUM — should be addressed after T8

**M1. Safety gate ordering drops Level 2 variant swap when deload fires**
- File: `src/engine/safety.ts`
- If deload triggers (2-of-3) fire while pain is 3–4/10, the safety gate returns "deload" and never reaches the Level 2 branch. The deload modifiers (volume −40%, RPE −1) are more conservative than Level 2's (volume −33%, RPE −0.5), so this is not unsafe. But the Level 2 protocol also specifies a joint-friendly variant swap, which the deload path doesn't apply.
- **Recommendation:** When deload and Level 2 pain coincide, merge the variant swap from Level 2 into the deload prescription. Low urgency.

**M2. bench_standard inference is keyword-only**
- File: `src/import/strengthlog.ts`, `inferBenchStandard` (lines 50–62)
- Looks for "wrap", "ipf", or "paused" in the notes field. Everything else defaults to "gym". This is acceptable given that the spec acknowledges the gap and most of Sidney's history is gym-standard. But paused sets logged without those keywords will be misclassified as gym.
- **Recommendation:** T8 should include a test that verifies the inference against a few representative note strings. No code change needed now.

**M3. Epley branch requires RIR (diverges from engine-design.md, but is safer)**
- File: `src/engine/e1rm.ts`, line 29
- The engine-design says `epley = weight_kg * (1 + reps / 30)` — no RIR needed. The implementation does `epley = weightKg * (1 + (reps + rir) / 30)` and requires `rir !== null`. This means a multi-rep set with no RIR returns "unavailable" instead of an Epley estimate.
- This is actually safer than the spec: plain Epley assumes reps to failure, which would underestimate e1RM for sets not taken to failure. Requiring RIR avoids that false assumption. The behavior matches eval case 11's expected output.
- **Recommendation:** Update `docs/engine-design.md` to document this deviation. The code is correct; the spec should catch up.

**M4. cut_state.bw_start_kg is set to current bodyweight, not cut-start bodyweight**
- File: `src/db/queries/state.ts`, line 263
- `bw_start_kg` is populated from the profile's `current_bodyweight_kg`, which updates as Sidney logs new sessions. This means the "cut progress" bodyweight delta will always show zero or near-zero.
- **Recommendation:** Add a `cut_start_bodyweight_kg` profile key (similar to the H2 fix for e1RM) and seed it when the cut is activated.

#### LOW — cleanup, no coaching impact

**L1. Duplicate `computeBackoffWeight` imports in session-generator.ts**
- The session generator imports `computeBackoffWeight` from both `backoff.ts` (aliased as `computeBackoffWeightByPhase`) and `progression.ts`. They compute the same thing with different argument shapes. Works correctly but is confusing. Clean up by using one path.

**L2. Per-standard base e1RM not used for non-gym sessions**
- `baseE1rm` in the session generator always reads `state.e1rm.gym?.value_kg`. For IPF-standard sessions, this should use the IPF e1RM. Acceptable now because all cut training uses the gym standard, but will matter when peaking/test-day logic is deepened.

### Scope Discipline

**Pass.** The T7 implementation stays strictly within the phase 1 bench-only scope. No accessory logic, no nutrition features, no multi-user architecture, no generic fitness features. The fallback path for non-cut phases is intentionally thin ("generic non-cut bench work until the phase-specific modules deepen") which is the right call.

### What Blocks T8

**Nothing.** All HIGH findings are improvements to coaching quality and robustness, not correctness blockers. The engine produces correct prescriptions for the cut phase across all day types, applies the safety gate correctly, computes deload triggers from comparable sessions, and stores recommendations linked to sessions. The explanation quality is the weakest link, but it doesn't affect safety or prescription accuracy.

### T8 Test Priorities (recommended order)

1. **e1RM calculation:** RPE table at every half-step (6.0–10.0), Epley with RIR, Epley without RIR → unavailable, edge cases (0 weight, reps > 10, null RIR on single)
2. **Comparable session matching:** Same type/day/standard matches; cross-type excluded; cross-standard excluded; insufficient data returns low confidence; history ordering is newest-first
3. **Deload trigger evaluation:** 0/3, 1/3, 2/3, 3/3; borderline values (1.9% vs 2.0% e1RM drop, 0.9 vs 1.0 RPE drift, 2.9 vs 3.0 pain avg); empty history
4. **Safety gate:** All paths (proceed, modify, deload, mini-deload, stop); Level 2 pain modifications; Level 3/4 stop; deload-when-triggers-fire; mini-deload-on-consecutive-RPE
5. **Cut strength monitoring:** stable, ≤3%, 3–5%, >5%; with and without RPE drift; non-cut phase returns null
6. **Session generator (cut phase):** Heavy/push, medium/legs, light/pull prescriptions; opportunity-day adjustment; bad-day adjustment; safety-modify variant swap; deload modifiers applied
7. **Back-off weight calculation:** By block type; cut uses lower end of range; rounding to 2.5 kg
8. **Phase resolution:** Calendar-based, override priority, manual phase, caloric deficit override, transition on >7 days gap
9. **Progression logic:** RPE below/at/above target → increase/hold/decrease; missing RIR → hold
10. **Import heuristics:** classifySessionType for representative rows; inferBenchStandard for keyword variations
11. **Validation:** Valid input passes; missing fields caught; out-of-range values caught
12. **Integration (eval cases 1, 2, 3, 4, 5, 7, 10, 11, 15):** These map directly to the cut phase. Cases 6, 8, 9 can be partially tested. Cases 12–14 are for phases not yet deepened.

### Exact Next Step

Hand off to Codex for T8. Codex should:
1. **Apply three pre-test fixes first** (in this order):
   - S1: Fix timezone consistency in `src/lib/dates.ts` (make all functions use UTC)
   - S2: Fix `isInCaloricDeficit` default in `src/lib/profile.ts` line 57 (change `!== "false"` to `=== "true"`)
   - H4: Change cut heavy push top single variation from `"touch_and_go"` to `"paused"` in `src/engine/session-generator.ts` line 152
2. **Apply S3 fix** (lower `consecutive_sessions_above_target_rpe` threshold in `src/db/queries/state.ts` lines 200–207) when writing the mini-deload test cases.
3. Replace all 64 `it.todo()` placeholders with real assertions following the priority order above.
4. Document any new edge cases discovered during test writing in `docs/implementation-notes.md`.

---

## Session Summary (2026-03-07, engine design session)

### What was done

1. Marked T4 (eval cases) as done — 15 Sidney-specific cases already written in prior session.
2. Completed T5 (engine design):
   - Created `docs/engine-design.md` with full input/output schemas, decision tree, and session generation algorithms for all 6 training phases.
   - Created ADR-004 (hybrid rules + LLM architecture) — accepted.
   - Updated `docs/task-plan.md` with T4 done, T5 done.
   - Updated `docs/current-context.md` with new state.

### Key design decisions

- **Hybrid architecture:** Rules layer handles all safety-critical logic (e1RM, deload, pain, overrides). LLM layer handles explanation, synthesis, and coaching tone. Rules always run first; LLM cannot override safety.
- **5-step pipeline:** Resolve phase → safety gate → template selection → populate prescription → generate explanation.
- **Session generators per phase:** Cut (active now), builder (12-week mesocycles with 3 blocks), peaking (10-week table), test day (IPF→gym→wraps), transition (ramp-back), pivot (active recovery).
- **Comparable session matching** is enforced at the data layer before any trigger evaluation.
- **Three bench standards** tracked as independent e1RM lines throughout.

### Design quality assessment

The engine design is comprehensive and directly implements the logic from `docs/coach-logic.md` and the two reference docs. Every module maps to at least one eval case. The input/output schemas are specific enough for implementation but not so rigid that they can't evolve.

Potential concerns:
- The AthleteState computation (deriving state from training log) will be the most complex piece to implement. It needs to correctly parse the CSV, match comparable sessions, and maintain running state across sessions.
- The exercise rotation table is hardcoded from the reference docs. If Sidney wants to change variations mid-block (which the non-negotiables say he shouldn't), the engine will flag it correctly — but the UI needs to make this clear.
- The LLM layer's role in "exercise selection nuance" needs guardrails to prevent it from overriding block rotation.

## Session Update (2026-03-08, stack selection)

### What was done

1. Created ADR-005 (implementation stack): TypeScript full stack, Next.js 14+ App Router, SQLite via better-sqlite3, Drizzle ORM, Vitest, Claude API (Sonnet) for LLM layer.
2. Created `docs/t6-scaffold-spec.md` — implementation-ready task spec for Codex, containing:
   - Exact directory structure (src/engine/, src/db/, src/llm/, src/app/ routes, tests/)
   - Drizzle schema with 5 tables (sessions, sets, e1rm_history, athlete_profile, recommendations)
   - All module function signatures as stubs
   - 10-point acceptance criteria
   - Package dependencies with versions
3. Updated task-plan.md: T6 status changed from `todo` to `ready`, added detailed acceptance criteria and pointer to t6-scaffold-spec.md
4. Updated current-context.md with resolved design questions
5. Updated review-notes.md

### Stack decision rationale

- TypeScript: matches engine-design interfaces, eliminates serialisation boundary, one language for everything
- SQLite: right size for single-user local app, handles comparable session queries natively
- Next.js: dashboard SSR, API routes for engine, React frontend, deploys trivially if needed
- Claude API (Sonnet): fast and cheap for explanations, template fallback if API unavailable
- Manual CSV import: Strengthlog API undocumented, manual is fine for usage pattern
- State from SQLite: no separate state file, computed on request, simple and correct
