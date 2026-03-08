# Recommendation Engine Design v1

This document formalises `docs/coach-logic.md` into implementable contracts. It defines the input schema, decision tree, output schema, and session generation algorithm for every training phase.

## Architecture Overview

The engine is a **hybrid rules-plus-LLM system**. The rules layer handles all safety-critical, deterministic logic. The LLM layer handles natural-language explanation, multi-signal synthesis, and programming generation for new phases.

```
┌─────────────────────────────────────────────────────┐
│                    ENGINE PIPELINE                   │
│                                                     │
│  1. INGEST        → Validate & normalise inputs     │
│  2. CONTEXT       → Resolve phase, standards, state │
│  3. SAFETY CHECK  → Pain, deload, overrides         │
│  4. GENERATE      → Build session prescription      │
│  5. EXPLAIN       → Trace recommendation to inputs  │
│  6. EMIT          → Structured output + alerts       │
└─────────────────────────────────────────────────────┘
```

### Rules Layer (deterministic, testable)

- e1RM calculation (RPE table, Epley fallback)
- Comparable session matching
- Deload trigger detection (2-of-3)
- Safety override logic
- Pain escalation protocol
- Cut-phase strength loss thresholds
- Progression logic (top single, rep work)
- Back-off weight calculations
- Phase identification and transition detection
- Test day attempt selection

### LLM Layer (generative, flexible)

- Natural-language explanation of recommendations
- Multi-signal synthesis ("you slept poorly + cut + RPE drifting → here's the tradeoff")
- Exercise variation selection within block constraints
- Session narrative and coaching tone
- Pattern recognition across mesocycles
- Phase transition programming (generating the first week of a new block)

---

## Input Schema

### SessionInput (per request)

```typescript
interface SessionInput {
  // Required
  date: string;                    // ISO date, e.g. "2026-03-07"
  session_type: "heavy" | "medium" | "light" | "test";
  day_type: "push" | "pull" | "legs";

  // Readiness (required)
  pain: {
    score: number;                 // 0–10
    location?: string;             // e.g. "anterior shoulder"
    trend?: "stable" | "improving" | "worsening";
  };

  // Readiness (optional but valuable)
  sleep_hours?: number;
  bodyweight_kg?: number;
  subjective_readiness?: 1 | 2 | 3 | 4 | 5;
  notes?: string;

  // Prior session result (if logging after training)
  actual_result?: ActualResult;
}

interface ActualResult {
  top_single?: {
    weight_kg: number;
    reps: number;                  // always 1 for singles
    rir: number;                   // 0–5, half-steps allowed (0.5, 1.5, etc.)
    bench_standard: "ipf" | "gym" | "gym_wraps";
    failed: boolean;
    technical_notes?: string;
  };
  working_sets?: WorkingSet[];
  pain_during?: number;           // 0–10, if changed during session
  pain_after?: number;            // 0–10, post-session
}

interface WorkingSet {
  exercise: string;                // e.g. "comp_bench_paused", "close_grip", "spoto"
  weight_kg: number;
  reps: number;
  sets: number;
  rir?: number;
  bench_standard?: "ipf" | "gym" | "gym_wraps";
}
```

### AthleteState (computed from history + profile)

The engine computes this before generating a recommendation. It is not user-supplied — it is derived from the training log and athlete profile.

```typescript
interface AthleteState {
  // Phase
  current_phase: "cut" | "transition" | "builder" | "peaking" | "test_day" | "pivot";
  phase_week?: number;             // week within current phase/block
  block_type?: "accumulation" | "intensification" | "realization";
  cycle_number?: number;           // 1, 2, or 3 within annual plan

  // e1RM per standard (from comparable sessions only)
  e1rm: {
    ipf?: E1rmEstimate;
    gym?: E1rmEstimate;
    gym_wraps?: E1rmEstimate;
  };

  // Deload trigger state
  deload_triggers: {
    e1rm_drop: TriggerState;       // ≥2% over 2 comparable sessions
    rpe_drift: TriggerState;       // ≥1 RPE at same load over 2 sessions
    pain_trend: TriggerState;      // average ≥3/10
    triggers_met: number;          // 0, 1, 2, or 3
    deload_recommended: boolean;   // true if ≥2
  };

  // Cut-phase state (only when phase = "cut")
  cut_state?: {
    e1rm_change_pct: number;       // % change from cut start
    threshold: "stable" | "monitor" | "warning" | "red_flag";
    weeks_in_cut: number;
    bw_start_kg: number;
    bw_current_kg: number;
    bw_target_kg: number;
  };

  // Recent session context
  recent_sessions: RecentSession[];  // last 5–10 comparable sessions
  last_heavy_push?: RecentSession;
  last_medium_legs?: RecentSession;
  days_since_last_bench: number;

  // Bodyweight
  bodyweight_kg: number;
  bodyweight_trend: "stable" | "gaining" | "losing";

  // Safety
  consecutive_sessions_above_target_rpe: number;  // for mini-deload
  last_pain_scores: number[];      // last 5 sessions

  // Peaking (only when phase = "peaking")
  peaking_state?: {
    weeks_out: number;             // weeks until Aug 29
    target_ipf_1rm: number;
    current_e1rm_pct_of_target: number;
    hard_sets_this_week: number;
    taper_active: boolean;
  };
}

interface E1rmEstimate {
  value_kg: number;
  date: string;
  confidence: "high" | "medium" | "low";
  method: "rpe_table" | "epley" | "test_day";
  trend: "up" | "flat" | "down";
  trend_sessions: number;          // how many comparable sessions in trend
  trend_change_pct: number;        // % change over trend window
}

interface TriggerState {
  active: boolean;
  value: number;                   // actual measured value
  threshold: number;               // threshold that fires
  sessions_compared: string[];     // dates of compared sessions
}

interface RecentSession {
  date: string;
  session_type: "heavy" | "medium" | "light";
  day_type: "push" | "pull" | "legs";
  top_single_kg?: number;
  top_single_rir?: number;
  e1rm_kg?: number;
  bench_standard: "ipf" | "gym" | "gym_wraps";
  pain: number;
  hard_sets: number;
  notes?: string;
}
```

---

## Decision Tree

The engine runs these steps in order. Each step can short-circuit the pipeline (e.g., pain Level 3 stops everything).

### Step 1: Resolve Phase

```
INPUT: date, athlete profile
OUTPUT: current_phase, block_type, phase_week

Rules:
  if date is Aug 29          → phase = "test_day"
  if date in [Aug 30 – Sep 11] → phase = "pivot"
  if date in [Sep 12 – Sep 30] → phase = "pivot" (rebuild)
  if date in [mid Jun – Aug 28] → phase = "peaking", compute weeks_out
  if date in [Oct – mid Jun]    → phase = "builder", compute cycle/block/week
  if athlete is in caloric deficit → phase = "cut" (overrides builder)
  if post-layoff (>7 days no training) → phase = "transition"
```

Phase override priority: test_day > pivot > transition > cut > peaking > builder

### Step 2: Safety Gate

```
INPUT: pain, deload_triggers, consecutive_rpe_overages
OUTPUT: safety_action (one of: proceed, modify, deload, stop)

Pain check (highest priority):
  if pain.score >= 5 or acute symptoms → STOP (Level 3/4)
  if pain.score 3–4               → MODIFY (Level 2: volume −33%, RPE −0.5, variant swap)
  if pain.score 0–2               → PROCEED (Level 1)

Deload check:
  if deload_triggers.triggers_met >= 2 → DELOAD (full week)
  if consecutive_sessions_above_target_rpe >= 2 → MINI-DELOAD (3 days)

Safety override (applied after session result):
  if top_single.rir <= 0.5 (RPE ≥ 9.5) → reduce back-off volume 33%, skip optional work
  if top_single.rir <= 1.0 (RPE ≥ 9.0) → reduce back-off volume 20%, skip optional work
```

### Step 3: Session Template Selection

```
INPUT: current_phase, day_type, session_type, safety_action
OUTPUT: session_template

CUT PHASE:
  push + heavy → cut_heavy_push_template
  legs + medium → cut_medium_legs_template
  pull         → cut_pull_minimal_template (or skip bench)

BUILDER PHASE:
  push_a + heavy → builder_heavy_a_template (comp paused + back-offs)
  pull_a + light → builder_light_a_template (comp TnG)
  legs_a + medium → builder_medium_a_template (variation by block)
  push_b + heavy → builder_heavy_b_template (paused variant)
  pull_b + light → builder_light_b_template (speed work)
  legs_b + medium → builder_medium_b_template (variation by block)

PEAKING PHASE:
  Use peaking table row for current week → session_role (A/B/C/D)
  Map session_role to template

DELOAD:
  Any template → apply deload modifiers (volume −40%, RPE −1)

TRANSITION:
  All sessions → transition_template (RPE cap 7, no singles > 80% last e1RM)

TEST DAY:
  → test_day_protocol (IPF → gym → wraps)
```

### Step 4: Populate Session Prescription

This is where the engine fills in specific weights, reps, and RPE targets.

```
INPUT: session_template, athlete_state, safety_action
OUTPUT: session_prescription

For each exercise slot in the template:
  1. Resolve exercise name (from block rotation table)
  2. Calculate target weight:
     - Top single: use last comparable e1RM × target RPE%
     - Back-offs: e1RM × block back-off% (accumulation 74–79%, etc.)
     - Medium work: e1RM × 65–70% (during cut)
     - Light work: e1RM × 55–65%
  3. Apply safety modifiers:
     - Pain Level 2: RPE target −0.5
     - Deload: RPE −1
     - Cut: no change to intensity targets, volume already at 75%
  4. Round weights to nearest 2.5 kg (or 1.25 kg if micro-plates used)
  5. Assign rest periods:
     - Heavy: 3–5 min
     - Medium: 2–3 min
     - Light: 1.5–2.5 min
     - Deload: no change
```

#### Top Single Target Weight Algorithm

```
For heavy push days:

  base_e1rm = athlete_state.e1rm.gym.value_kg  // use relevant standard
  target_rpe = phase_target_rpe()               // e.g., 8.0 for accumulation W1
  target_pct = rpe_to_pct(target_rpe)           // e.g., 0.92 for RPE 8

  target_weight = round_to_2_5(base_e1rm * target_pct)

  // Opportunity day logic
  if sleep >= 8 and pain == 0 and subjective_readiness >= 4:
    target_weight += 2.5  // attempt slightly heavier
    // But cap: never exceed last e1RM

  // Bad day logic
  if sleep < 6 or subjective_readiness <= 2:
    target_weight -= 2.5  // back off slightly

  // Progression logic
  if last_comparable_session.top_single_rir > target_rir + 0.5:
    target_weight += 2.5  // was easier than target → progress
  if last_comparable_session.top_single_rir < target_rir - 0.5:
    target_weight -= 2.5  // was harder than target → deload pressure
```

#### Back-Off Weight Algorithm

```
  block = athlete_state.block_type
  backoff_range = BACKOFF_TABLE[block]  // e.g., {min: 0.74, max: 0.79}

  // Use middle of range as default, adjust by session context
  backoff_pct = (backoff_range.min + backoff_range.max) / 2

  // During cut: use lower end of range
  if phase == "cut":
    backoff_pct = backoff_range.min

  backoff_weight = round_to_2_5(base_e1rm * backoff_pct)
```

### Step 5: Generate Explanation

The explanation is structured as:

```typescript
interface Explanation {
  summary: string;          // 1–2 sentence summary
  key_inputs: string[];     // which data points drove the decision
  rule_applied: string;     // which rule or logic path was used
  tradeoff: string;         // what tradeoff is being made
  monitor_next: string[];   // what to watch for in next session
}
```

Example:
```json
{
  "summary": "Heavy push day during cut. Top single at 90 kg targeting RIR 1.5–2.5, back-offs at 70 kg.",
  "key_inputs": [
    "Last heavy push e1RM: 93.8 kg (gym standard, Mar 3)",
    "Pain: 0/10",
    "Phase: cut",
    "Sleep: 7.5 hours"
  ],
  "rule_applied": "Cut-phase heavy push template. Top single = e1RM × target RPE%. Back-offs = e1RM × 74–79% (accumulation range, lower end for cut).",
  "tradeoff": "Prioritising strength preservation over volume. Intensity maintained, volume at ~75% of peak.",
  "monitor_next": [
    "RIR on top single — if ≤0.5, safety override next session",
    "e1RM trend — stable at ~93–94 kg across last 3 comparable sessions"
  ]
}
```

---

## Output Schema

### SessionRecommendation (primary output)

```typescript
interface SessionRecommendation {
  // Metadata
  date: string;
  phase: string;
  session_type: "heavy" | "medium" | "light" | "test" | "deload" | "transition";
  day_type: "push" | "pull" | "legs";

  // Prescription
  warmup: WarmupStep[];
  exercises: ExercisePrescription[];
  rest_between_exercises: string;  // general guidance

  // Alerts (if any)
  alerts: Alert[];

  // Explanation
  explanation: Explanation;

  // State snapshot (for audit trail)
  state_snapshot: {
    e1rm_gym_kg: number;
    e1rm_ipf_kg?: number;
    e1rm_gym_wraps_kg?: number;
    deload_triggers_met: number;
    pain_score: number;
    bodyweight_kg: number;
    phase: string;
    block?: string;
    phase_week?: number;
  };
}

interface WarmupStep {
  exercise: string;
  weight_kg: number | "bar";
  reps: number;
  rest_sec: number;
  notes?: string;
}

interface ExercisePrescription {
  order: number;
  exercise: string;
  variation?: string;             // e.g., "paused", "TnG", "close-grip"
  sets: number;
  reps: number;
  target_weight_kg: number;
  target_rir: number;             // target RIR (e.g., 1.5–2.5 for heavy cut)
  target_rir_range: [number, number];
  rest_sec: number;
  purpose: string;                // e.g., "strength stimulus", "volume accumulation"
  is_optional: boolean;           // e.g., optional variation at end of session
  safety_note?: string;           // e.g., "Skip if top single was RPE ≥9"
}

interface Alert {
  severity: "info" | "warning" | "critical";
  type: "deload_recommended" | "safety_override" | "pain_escalation"
       | "strength_loss_warning" | "missing_data" | "phase_transition"
       | "test_day_prep" | "mini_deload";
  message: string;
  action_required: string;
  data?: Record<string, any>;     // supporting data for the alert
}
```

### StatusReport (secondary output, dashboard data)

```typescript
interface StatusReport {
  // e1RM per standard
  e1rm_summary: {
    standard: "ipf" | "gym" | "gym_wraps";
    current_kg: number;
    trend: "up" | "flat" | "down";
    trend_change_pct: number;
    confidence: "high" | "medium" | "low";
    last_updated: string;
  }[];

  // Deload trigger dashboard
  deload_status: {
    triggers_met: number;
    trigger_details: {
      name: string;
      active: boolean;
      current_value: string;
      threshold: string;
    }[];
    recommendation: string;
  };

  // Phase progress
  phase_progress: {
    phase: string;
    week: number;
    total_weeks: number;
    block?: string;
    next_milestone: string;
  };

  // Bodyweight
  bodyweight: {
    current_kg: number;
    target_kg: number;
    trend: string;
    strength_to_bw_ratio: number;  // e1RM ÷ BW
  };

  // Recent session log (last 5)
  recent_sessions: {
    date: string;
    type: string;
    top_single: string;           // e.g., "90 kg × 1 @ RIR 1.0"
    e1rm_kg: number;
    pain: number;
    hard_sets: number;
  }[];
}
```

---

## Session Generation Algorithm by Phase

### Cut Phase (Active NOW)

```
generate_cut_session(input, state):

  if input.day_type == "pull":
    return minimal_bench_session(state)
    // 3 × 5 @ ~60 kg, RPE 5–6, no top single
    // Or skip bench entirely

  if input.day_type == "legs":
    return medium_bench_session(state)
    // No top single
    // Working sets: 3–5 × 3–5 @ 65–70% e1RM, RIR 3–4
    // Rest: 2–3 min

  if input.day_type == "push":
    return heavy_bench_session(state)
    // Warmup pyramid: bar×10, 40%×8, 60%×5, 75%×3, 85%×1
    // Top single: e1RM × target_rpe_pct, target RIR 1.5–2.5
    // Back-offs: 3–4 × 3–5 @ 74–79% e1RM, RIR 1.5–2.5
    // Optional: 2–3 × 3–5 paused/close-grip @ RIR 2–2.5
    // Rest: 3–5 min heavy, 3 min back-offs

  // Apply safety override if needed (from previous session result)
  if state.last_top_single_rir <= 1.0:
    reduce_backoff_volume(prescription, 0.20 to 0.33)
    skip_optional_work(prescription)

  // Apply pain Level 2 if needed
  if input.pain.score in [3, 4]:
    reduce_volume(prescription, 0.33)
    reduce_top_single_rpe(prescription, 0.5)
    swap_to_joint_friendly_variant(prescription)
```

### Builder Phase (Post-Japan)

```
generate_builder_session(input, state):

  week = state.phase_week  // 1–12
  block = state.block_type  // accumulation / intensification / realization
  day_slot = resolve_day_slot(input.day_type, state.cycle_day)
  // day_slot ∈ {heavy_a, light_a, medium_a, heavy_b, light_b, medium_b}

  // Get template from mesocycle table
  template = MESOCYCLE_TABLE[block][week][day_slot]

  // Deload weeks (W4, W8 in each cycle)
  if week in [4, 8]:
    template = apply_deload_modifiers(template)

  // Realization W10: e1RM test
  if block == "realization" and week == 10:
    template = e1rm_test_template()

  // Realization W11: pivot
  if block == "realization" and week == 11:
    template = pivot_template()

  // Populate weights
  for exercise in template.exercises:
    if exercise.is_top_single:
      exercise.weight = compute_top_single_target(state, block, week)
    elif exercise.is_backoff:
      exercise.weight = compute_backoff_weight(state, block)
    elif exercise.is_variation:
      exercise.weight = compute_variation_weight(state, block, exercise.type)
    elif exercise.is_light:
      exercise.weight = compute_light_weight(state)

  // Resolve exercise names from rotation table
  resolve_exercise_rotation(template, block)

  return template
```

#### Mesocycle Volume Table (Hard Sets per Week)

```
VOLUME_TABLE = {
  accumulation: {
    W1: 17, W2: 19, W3: 21, W4: 10  // deload
  },
  intensification: {
    W5: 17, W6: 17, W7: 17, W8: 10  // deload
  },
  realization: {
    W9: 14, W10: 8,  // e1RM test
    W11: 14,         // pivot
    W12: transition
  }
}
```

#### Exercise Rotation Table

```
ROTATION_TABLE = {
  accumulation: {
    heavy_a: "comp_paused",     medium_a: "close_grip",
    heavy_b: "paused_bench",    medium_b: "spoto",
    light_a: "comp_tng",        light_b: "speed_bench"
  },
  intensification: {
    heavy_a: "comp_paused",     medium_a: "feet_up",
    heavy_b: "larsen_press",    medium_b: "cg_paused",
    light_a: "comp_tng",        light_b: "speed_bench"
  },
  realization: {
    heavy_a: "comp_paused",     medium_a: "close_grip",
    heavy_b: "comp_paused",     medium_b: "spoto",
    light_a: "comp_tng",        light_b: "speed_bench"
  }
}
```

### Peaking Phase (10 Weeks Before Aug 29)

```
generate_peaking_session(input, state):

  weeks_out = state.peaking_state.weeks_out  // 10 down to 1
  peaking_row = PEAKING_TABLE[weeks_out]

  // Session role assignment
  session_role = assign_session_role(input, weeks_out)
  // A: heavy specific, B: volume builder, C: secondary intensity, D: optional

  // Drop Session D from W5 onward
  if session_role == "D" and weeks_out <= 5:
    return rest_day()

  // Taper (W2–W1)
  if weeks_out <= 2:
    return taper_session(weeks_out, state)

  // W3 check: is e1RM on track?
  if weeks_out == 3:
    pct_of_target = state.e1rm.ipf.value_kg / state.peaking_state.target_ipf_1rm
    if pct_of_target < 0.98:
      add_alert("warning", "e1RM at {pct}% of target. Consider adjusting target or approach.")

  // Build session from peaking row
  template = peaking_session_template(session_role, peaking_row)
  populate_weights(template, state)

  // Autoregulation during peak
  if input.actual_result and actual_rpe > planned_rpe:
    apply_peaking_fatigue_protocol(template)

  return template
```

#### Peaking Table

```
PEAKING_TABLE = {
  10: { hard_sets: 16, top_single_rpe: 7.5, focus: "volume base" },
   9: { hard_sets: 16, top_single_rpe: 8.0, focus: "building intensity" },
   8: { hard_sets: 14, top_single_rpe: 8.0, focus: "introduce Spoto" },
   7: { hard_sets: 15, top_single_rpe: 8.5, focus: "heavy doubles" },
   6: { hard_sets: 14, top_single_rpe: 8.5, focus: "intensity up" },
   5: { hard_sets: 13, top_single_rpe: 9.0, focus: "clean single, drop D" },
   4: { hard_sets: 12, top_single_rpe: 9.0, focus: "last heavy week" },
   3: { hard_sets: 10, top_single_rpe: 8.5, focus: "peak exposure" },
   2: { hard_sets:  3, top_single_rpe: 8.0, focus: "opener check, taper" },
   1: { hard_sets:  0, top_single_rpe: 5.5, focus: "light technique, rest" }
}
```

### Test Day

```
generate_test_day(state):

  target_ipf = state.peaking_state.target_ipf_1rm

  warmup = generate_test_warmup(target_ipf)

  // IPF attempts
  opener_ipf = round_to_2_5(target_ipf * 0.92)
  // 2nd and 3rd are conditional on opener RPE — decision tree in output

  // Gym no wraps: target = IPF × 1.03–1.07
  target_gym = target_ipf * 1.05  // middle of range
  opener_gym = round_to_2_5(target_gym * 0.95)

  // Gym + wraps: target = IPF × 1.12–1.18
  target_wraps = target_ipf * 1.15  // middle of range
  opener_wraps = round_to_2_5(target_wraps * 0.95)

  return test_day_prescription(warmup, opener_ipf, target_gym, target_wraps)
  // Includes conditional attempt trees for each standard
```

### Transition Phase

```
generate_transition_session(state):

  last_e1rm = state.e1rm.gym.value_kg  // pre-layoff value
  rpe_cap = 7.0
  max_weight = round_to_2_5(last_e1rm * 0.80)

  return {
    exercises: [
      { exercise: "comp_bench_paused", sets: 3, reps: 5,
        weight: max_weight * 0.85, target_rir: 3, rest: 180 },
      { exercise: "comp_bench_tng", sets: 3, reps: 5,
        weight: max_weight * 0.75, target_rir: 4, rest: 150 }
    ],
    notes: "Ramp-back week. No top singles. Rebuild movement patterns.",
    duration: "1 week (3–4 sessions), then reassess"
  }
```

---

## Deload Session Generator

```
generate_deload_session(base_template, state):

  deload = deep_copy(base_template)

  // Volume −40%: reduce sets, keep reps
  for exercise in deload.exercises:
    exercise.sets = max(2, round(exercise.sets * 0.60))

  // Intensity: RPE −1
  for exercise in deload.exercises:
    exercise.target_rir += 1.0
    recalculate_weight(exercise, state)

  // Frequency: maintain (don't skip days)
  // Accessories: cut in half or eliminate
  deload.exercises = [e for e in deload.exercises if not e.is_accessory
                      or keep_half(e)]

  deload.duration = "1 week, extend to 2 if still fatigued"

  return deload
```

---

## e1RM Calculation Module

```
calculate_e1rm(weight_kg, reps, rir, method_preference):

  if reps == 1 and rir is not None:
    // Primary method: RPE table
    rpe = 10 - rir
    pct = RPE_TABLE[rpe]  // e.g., RPE 8 → 0.92
    if pct is None:
      return { value: None, method: "unavailable", reason: "RPE out of table range" }
    return {
      value: round(weight_kg / pct, 1),
      method: "rpe_table",
      confidence: "high"
    }

  if reps > 1 and reps <= 10:
    // Fallback: Epley formula
    epley = weight_kg * (1 + reps / 30)
    return {
      value: round(epley, 1),
      method: "epley",
      confidence: "medium"
    }

  // No usable data
  return { value: None, method: "unavailable", reason: "insufficient data" }

RPE_TABLE = {
  6.0: 0.86,  6.5: 0.875,
  7.0: 0.89,  7.5: 0.905,
  8.0: 0.92,  8.5: 0.94,
  9.0: 0.96,  9.5: 0.98,
  10.0: 1.00
}
```

---

## Comparable Session Matcher

```
find_comparable_sessions(target_session, history, count=3):

  comparable = []
  for session in history (most recent first):
    if session.session_type == target_session.session_type
       and session.day_type == target_session.day_type
       and session.bench_standard == target_session.bench_standard
       and session.e1rm is not None:
      comparable.append(session)
    if len(comparable) == count:
      break

  if len(comparable) < 2:
    // Not enough comparable data
    return { sessions: comparable, confidence: "low" }

  return { sessions: comparable, confidence: "high" if len >= 3 else "medium" }
```

---

## Deload Trigger Evaluator

```
evaluate_deload_triggers(state):

  triggers_met = 0

  // Trigger 1: e1RM drop ≥2% over 2 comparable sessions
  comparable = find_comparable_sessions(current, history, 3)
  if len(comparable.sessions) >= 2:
    oldest = comparable.sessions[-1].e1rm
    newest = comparable.sessions[0].e1rm
    drop_pct = (oldest - newest) / oldest * 100
    if drop_pct >= 2.0:
      triggers_met += 1
      trigger_1 = { active: true, value: drop_pct, threshold: 2.0 }
    else:
      trigger_1 = { active: false, value: drop_pct, threshold: 2.0 }

  // Trigger 2: RPE drift ≥1 at same load over 2 sessions
  // Find sessions with similar load (±2.5 kg)
  pairs = find_same_load_pairs(comparable.sessions)
  if pairs:
    max_drift = max(pair.rir_old - pair.rir_new for pair in pairs)
    if max_drift >= 1.0:
      triggers_met += 1
      trigger_2 = { active: true, value: max_drift, threshold: 1.0 }
    else:
      trigger_2 = { active: false, value: max_drift, threshold: 1.0 }

  // Trigger 3: Pain trending ≥3/10
  recent_pain = state.last_pain_scores[-5:]
  avg_pain = mean(recent_pain)
  if avg_pain >= 3.0:
    triggers_met += 1
    trigger_3 = { active: true, value: avg_pain, threshold: 3.0 }
  else:
    trigger_3 = { active: false, value: avg_pain, threshold: 3.0 }

  return {
    triggers_met: triggers_met,
    deload_recommended: triggers_met >= 2,
    details: [trigger_1, trigger_2, trigger_3]
  }
```

---

## Cut-Phase Strength Monitor

```
evaluate_cut_strength(state):

  if state.current_phase != "cut":
    return None

  // Compare e1RM at cut start vs current
  e1rm_start = state.cut_state.e1rm_at_cut_start
  e1rm_now = state.e1rm.gym.value_kg
  drop_pct = (e1rm_start - e1rm_now) / e1rm_start * 100

  if drop_pct <= 0:
    return { threshold: "stable", action: "continue", drop_pct: 0 }
  if drop_pct <= 3:
    return { threshold: "monitor", action: "no changes", drop_pct }
  if drop_pct <= 5:
    // Check for RPE drift as additional signal
    has_rpe_drift = state.deload_triggers.rpe_drift.active
    if has_rpe_drift:
      return { threshold: "warning", action: "reduce volume 20%, consider deload", drop_pct }
    return { threshold: "monitor", action: "close to warning, watch RPE drift", drop_pct }
  if drop_pct > 5:
    return { threshold: "red_flag", action: "deload week, reassess deficit", drop_pct }
```

---

## Data Validation Rules

Before the engine runs, inputs must pass validation:

```
validate_session_input(input):
  assert input.pain.score in [0..10]
  assert input.session_type in ["heavy", "medium", "light", "test"]
  assert input.day_type in ["push", "pull", "legs"]
  if input.actual_result?.top_single:
    assert top_single.weight_kg > 0
    assert top_single.rir in [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    assert top_single.bench_standard in ["ipf", "gym", "gym_wraps"]
  if input.sleep_hours:
    assert input.sleep_hours in [0..24]
  if input.bodyweight_kg:
    assert input.bodyweight_kg in [40..200]
```

---

## Implementation Boundaries

### What MUST be rules-based (deterministic, testable)

| Module | Reason |
|--------|--------|
| e1RM calculation | Math — must be exact and auditable |
| Comparable session matching | Logic — prevents conflation errors |
| Deload trigger detection | Safety — must not miss triggers |
| Safety override | Safety — protects against RPE overreach |
| Pain escalation protocol | Safety — pain response must be reliable |
| Cut-phase strength thresholds | Quantitative — threshold math |
| Back-off weight calculation | Math — percentage of e1RM |
| Phase identification | Calendar + state — deterministic |
| Data validation | Integrity — garbage in = garbage out |
| Test day attempt selection | Protocol — conditional logic tree |

### What CAN be LLM-assisted

| Module | Reason |
|--------|--------|
| Explanation generation | Narrative — synthesise signals into coaching language |
| Exercise selection nuance | Within block constraints, pick the best variation for today |
| Multi-signal readiness assessment | Combine sleep, pain, readiness, bodyweight, notes into a judgment |
| Phase transition programming | Generate the specific first week of a new block/phase |
| Pattern recognition | Spot trends across mesocycles that rules can't express |
| Coaching tone and framing | Make the recommendation feel like a coach, not a spreadsheet |

---

## Test Coverage Requirements

Each rules-based module must have tests that cover:

1. **e1RM calculation:** RPE table method, Epley fallback, missing data → unavailable
2. **Comparable sessions:** Same type matches, cross-type excluded, mixed standards excluded, insufficient data handling
3. **Deload triggers:** 0/3, 1/3, 2/3, 3/3; borderline values (1.9% vs 2.0%); pain averaging
4. **Safety override:** RPE 9 vs 9.5 vs 10; volume reduction percentages; optional work skipping
5. **Pain protocol:** Level transitions (0→2→3→4); mid-session escalation; persistent trend detection
6. **Cut strength:** Stable, ≤3%, 3–5%, >5%; with and without RPE drift
7. **Phase identification:** Date-based, override priority, manual phase setting
8. **Back-off weights:** By block, rounded to 2.5 kg, cut adjustment
9. **Test day attempts:** Conditional trees for opener RPE outcomes; standard transitions; failed lift protocol
10. **Progression logic:** RPE below/at/above target; rep ceiling reached; technical breakdown

The eval cases in `evals/bench-cases.md` (15 cases) should map directly to integration tests of the full pipeline.

---

## Open Design Questions (to resolve before T6)

1. **Implementation language:** TypeScript (for web app) vs Python (for data pipeline) vs both?
2. **Storage:** Local file-based (JSON/CSV) vs SQLite vs cloud DB?
3. **LLM integration:** API call to Claude for explanations, or local template-based?
4. **UI framework:** Web app (Next.js/React), mobile-first (React Native/Expo), or CLI-first?
5. **Strengthlog sync:** Manual CSV import or API integration?
6. **State persistence:** How to store and version AthleteState between sessions?
