# ADR-003: Coach Generates Programming, Not Just Executes It

## Status

Accepted

## Decision

The coaching system must be capable of generating bench programming — selecting exercises, sets, reps, intensities, and progressions — rather than only following a pre-written plan.

Sidney's existing reference documents (BENCH_STRATEGY v1.5, Bench Mastery System v1) are filed as reference material in `knowledge/research/`, not as rigid execution scripts.

## Rationale

- Sidney explicitly stated he wants to create a new program, not follow the existing ones
- The existing documents contain strong coaching logic (deload triggers, progression rules, phase structure) that should be absorbed into `docs/coach-logic.md` as the system's logic layer
- A pre-written plan cannot adapt to the real-time interplay of bodyweight trend, fatigue, pain, and phase transitions
- The system's value is in making better decisions than a static spreadsheet

## Consequences

- The recommendation engine needs structured logic for exercise selection, load prescription, and volume management — not just readiness gating on top of a fixed plan
- The reference documents serve as the coaching philosophy and constraint set, not as literal programs to follow
- The system should be able to generate a session given: current phase, recent training history, readiness inputs, and athlete profile
- Over time, the system should learn from Sidney's actual response data to personalise prescriptions

## Reference Files

- `knowledge/research/bench-strategy-v1.5-reference.md`
- `knowledge/research/bench-mastery-system-v1-reference.md`
