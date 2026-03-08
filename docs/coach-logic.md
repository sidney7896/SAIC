# Coach Logic

## Coaching Philosophy

The system exists to improve bench performance, not to behave like a generic motivational chatbot.

Core principles:

- Bias toward bench specificity
- Respect the realities of natural lifters
- Balance overload, skill practice, fatigue, and recovery
- Surface uncertainty rather than pretending to know more than it does
- Consistency over intensity — sustainable decade-scale training beats short-term optimization
- Progressive overload across all timescales (session, month, year)
- Specificity increases as training age advances

## Training Phases

The system must always know which phase is active and apply the relevant logic:

| Phase | When | Key Characteristics |
|-------|------|---------------------|
| Cut | Active NOW (→ ~Apr 2026) | Reduced volume (~75% of peak), maintain intensity, autoregulated, heavy singles + 1–5 reps, strength preservation |
| Transition | Post-Japan (~May 2026) | 1-week ramp-back, rebuild movement patterns |
| Year-Round Builder | Sep → Mid Jun each year | 12-week mesocycles (Accumulation → Intensification → Realization), 6x/week bench |
| Peaking | 10 weeks before Aug 29 | Volume down, intensity up, taper, competition prep |
| Test Day | Aug 29 each year | All three bench standards tested (IPF → Gym → Gym+Wraps) |
| Pivot | 2 weeks after Aug 29 | Mandatory recovery, introduce new variations |

## Annual Cycle Structure

| Period | Duration | Focus |
|--------|----------|-------|
| September | 4 weeks | Pivot + Rebuild |
| Oct – Dec | 12 weeks | Cycle 1: Year-Round Builder |
| Jan – Mar | 12 weeks | Cycle 2: Year-Round Builder |
| Apr – Mid Jun | 10–12 weeks | Cycle 3: Year-Round Builder |
| Mid Jun – Aug 29 | 10 weeks | Peaking Program |

## Inputs That Matter Most

Highest priority signals:

- recent bench performance (by standard: IPF / gym / gym+wraps)
- estimated 1RM and trend (per standard)
- RIR/RPE on top singles and working sets
- proximity to failure and volume load
- pain or irritation score (0–10)
- fatigue and readiness
- bodyweight and trend
- current training phase
- schedule constraints
- historical response to different loading patterns

Useful but lower priority:

- sleep duration and quality (wearable data if available)
- broader recovery notes
- non-bench accessory work
- general life stress

## e1RM Calculation

Primary method — single with known RIR/RPE:

| Single @ RPE | ≈ % of 1RM | e1RM Formula |
|--------------|------------|--------------|
| 6 | 86% | weight ÷ 0.86 |
| 6.5 | 87.5% | weight ÷ 0.875 |
| 7 | 89% | weight ÷ 0.89 |
| 7.5 | 90.5% | weight ÷ 0.905 |
| 8 | 92% | weight ÷ 0.92 |
| 8.5 | 94% | weight ÷ 0.94 |
| 9 | 96% | weight ÷ 0.96 |
| 9.5 | 98% | weight ÷ 0.98 |

Method selection order:
1. Single with known RIR/RPE → use RPE table (preferred)
2. Rep set with unknown RPE but valid reps → use Epley as fallback
3. No usable intensity data → mark as unavailable, do not fabricate

When both exist in one session: report single-based as primary, rep-based as context only.

Note: These are standard RTS/SBS estimates. As more test data accumulates, personalised calibration should replace defaults.

## Comparable Session Rule

To avoid false alarms, compare only comparable sessions for trend decisions:

1. Push-day heavy ↔ push-day heavy
2. Leg-day medium ↔ leg-day medium
3. Exclude pull-day optional/light bench unless no other data exists
4. If data is mixed, use the latest two comparable points and mark confidence as reduced

This applies to: e1RM drop triggers, RPE drift triggers, and safety override frequency trends.

## What the Coaching Engine Should Decide

The engine should be able to:

- Determine whether to push, hold, or reduce stress
- Generate the next bench session (not just follow a pre-written plan)
- Adapt a planned session based on readiness
- Detect and recommend deloads
- Select appropriate bench variations for the current block and phase
- Calculate back-off weights from e1RM
- Explain every recommendation traceably
- Track all three bench standards independently

## Progression Logic

### Top Single (weekly)

| Condition | Action |
|-----------|--------|
| RPE < target | +2.5 kg next week |
| RPE = target | Maintain weight |
| RPE > target | −2.5 kg OR extra rest before next heavy day |
| Technical breakdown | Stop session, log issue, assess recovery |

### Rep Work (medium days)

| Condition | Action |
|-----------|--------|
| All sets below target RPE | +1 rep per set next week (up to rep ceiling) |
| Rep ceiling reached | +2.5 kg, reset to lower rep range |

### Back-Off Set Calculations

| Block | Back-off % of e1RM |
|-------|--------------------|
| Accumulation | 74–79% |
| Intensification | 80–86% |
| Realization | 86–90% |

## Deload Logic

### Triggers (2 of 3 = deload)

1. e1RM drops ≥2% over 2 comparable sessions
2. RPE drift — same weight feels ≥1 RPE harder over 2 sessions
3. Pain trending up — average ≥3/10

### Deload Execution

| Parameter | Adjustment |
|-----------|------------|
| Volume | −40% (reduce sets, not reps) |
| Intensity | RPE −1 across all sessions |
| Frequency | MAINTAIN (skill retention) |
| Duration | 1 week (extend to 2 if still fatigued) |
| Accessories | Cut in half or eliminate |

### Mini-Deload (Emergency)

- Duration: 3 days
- Volume: −20%
- Intensity: RPE −0.5
- Trigger: 2 consecutive sessions above target RPE

### Planned Deloads Per Year

4× (end Nov, end Feb, end May, mid Jul if needed) + post-test pivot.

## Cut-Phase Specific Logic (Active NOW)

| Parameter | Prescription |
|-----------|-------------|
| Frequency | Heavy on push days, medium on leg days, minimal/skip on pull days |
| Volume | ~75% of peak volume |
| Intensity | Maintain. Weekly heavy single target: ~1.5–2.5 RIR (RPE 7.5–8.5) |
| Safety override | If top single ≤1 RIR (RPE ≥9): keep if technique is clean, but reduce back-off volume 20–33% |
| Rep range | Primarily 1–5 reps. Paused variants, heavy singles, back-offs |
| Variations | Comp bench (paused + TnG), close-grip, Spoto press |

### Acceptable Strength Loss During Cut

| Threshold | Action |
|-----------|--------|
| e1RM stable or ↑ | Continue as planned |
| e1RM drop ≤3% | Monitor, no changes |
| e1RM drop 3–5% + RPE drift | Reduce volume 20%, consider deload |
| e1RM drop >5% | Deload week, reassess deficit or training stress |

## Pain Escalation Protocol

| Level | Pain | Response |
|-------|------|----------|
| 1 | 0–2/10 | Train as planned. Log before/after/next morning. |
| 2 | 3–4/10 | Volume −33%, top single RPE −0.5, switch to joint-friendly variant |
| 3 | ≥5/10 or function loss | STOP. 7–10 day pivot (RPE cap 7, comp bench light or out) |
| 4 | Acute (pop/swelling/instability) | STOP. Seek medical attention same day. |

### Red Flags (Stop Immediately)

- Pop or tearing sensation with hematoma
- Sharp pain ≥5/10 during any rep
- New tingling, numbness, or weakness in arms/hands
- Pain trending ≥4/10 week over week
- Joint instability or giving way

## Non-Negotiables

1. Competition bench ≥2x/week year-round; ≥3x/week in last 10 weeks before test
2. Volume is the primary adjustment knob (reduce sets, maintain intensity)
3. No structural grinders outside test day
4. Top single is always technically clean — form breaks = stop
5. Deload at 2-of-3 triggers
6. Pivot 2 weeks after Aug 29 is mandatory
7. Pain ≥5/10 or any "pop" = STOP + protocol
8. Variations change only at deload/pivot, not randomly mid-block
9. Log minimum: top single, e1RM, hard sets, pain, sleep
10. Sleep ≥7 hours non-negotiable
11. Protein ≥1.6 g/kg daily (2.0–2.4 g/kg during cut)
12. Warm up fully every session
13. Document PR attempts on video
14. Annual review on Aug 29 is sacred

## Rules-Based vs LLM-Assisted

Rules-based or strongly structured:

- e1RM calculation and trend tracking
- deload trigger detection
- pain escalation protocol
- progression logic (top single, rep work, back-offs)
- phase identification and transition
- comparable session matching
- data validation
- safety overrides

LLM-assisted:

- natural-language explanation of recommendations
- synthesis of multiple signals into a training decision
- framing tradeoffs for the athlete
- identifying patterns across mesocycles
- generating programming for new phases
- translating structured logic into clear coaching language

## Guardrails

- Never hide uncertainty
- Never give generic hype instead of a recommendation
- Avoid abrupt load jumps without clear rationale
- Flag missing data when confidence is low
- Preserve a clear audit trail from inputs to recommendation
- Do not conflate the three bench standards in trend analysis

## Explainability Standard

Every recommendation should be explainable in terms of:

- what data mattered most
- what trend or signal triggered the recommendation
- what tradeoff is being made
- what the user should monitor next

## Test Day Protocol (Aug 29)

Testing order: IPF → Gym No Wraps → Gym + Wraps. 25 min rest between standards.

Expected conversion factors (to be personalised over time):

| Variant | Typical Boost vs IPF |
|---------|---------------------|
| IPF (Comp Standard) | Baseline |
| Gym (No Wraps) | +3–7% |
| Gym + Wraps | +12–18% |

## Long-Term Architecture

The system must support but not prematurely implement:

- 20-year training age progression (Foundation → Strength Max → Peak Performance → Maintenance)
- Expected annual gains declining with training age
- Bodyweight progression plan (65 kg → eventual ~120 kg over 8+ years)
- Multi-year trend analysis
- Annual review and projection recalibration

## Expansion Path

Later expansion can include:

- broader upper-body or full-body programming
- nutrition tracking integration
- wearable data integration (Apple Watch, Garmin, Whoop)
- cardio and conditioning
- sleep and recovery systems

But these should remain extensions on top of a strong bench-specific foundation rather than infecting phase 1 scope.
