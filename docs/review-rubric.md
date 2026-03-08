# Review Rubric

Use this rubric to judge whether a change materially improves the bench coach rather than merely adding software.

## Top Failure Modes

### Generic coach syndrome

The product sounds like a broad fitness chatbot instead of a personalised bench coach. It gives advice that could apply to anyone rather than being specific to Sidney's data, phase, and history.

### Hidden logic

The system gives recommendations that cannot be traced back to inputs or rules. The user cannot answer "why did it tell me to do this?" by looking at the explanation.

### Standard conflation

The system mixes IPF paused data with gym TnG data when calculating e1RM trends, deload triggers, or progression. The three bench standards must remain independent tracking lines.

### Wrong phase logic

The system applies bulk-phase rules during a cut, or cut-phase rules during peaking. Phase awareness must be correct and explicit.

### Comparable session violation

Trend decisions or deload triggers compare non-comparable sessions (e.g., heavy push day vs. medium leg day). The comparable session rule must be enforced.

### Poor stress management

The product pushes progression without enough regard for fatigue, pain, or recovery. Specific checks:
- Does it respect the 2-of-3 deload trigger rule?
- Does it apply the safety override when RPE exceeds target?
- Does it follow the pain escalation protocol?
- Does it respect cut-phase strength loss thresholds?

### Weak personalisation

The system ignores Sidney's specific history, constraints, or response patterns. The recommendation would be equally valid for any random lifter.

### Scope drift

The implementation adds broad wellness, nutrition, full-body programming, or multi-user product ideas before the bench coach is strong.

### Data ambiguity

The app accepts too little structure, making recommendations noisy or inconsistent. Missing data is not flagged, or the system fabricates e1RM when intensity data is absent.

## Review Questions

### Coaching Quality

- Does this change improve the quality of bench-specific recommendations?
- Does the recommendation correctly use Sidney's actual e1RM, trend, and recent session data?
- Are back-off set weights calculated correctly from the current e1RM and block type?
- Does the system correctly identify the current training phase and apply the right rules?

### Personalisation

- Does it use Sidney's actual data rather than generic assumptions?
- Does it respect his three bench standards independently?
- Does it account for his current cut phase, bodyweight trend, and strength preservation goal?

### Explainability

- Can the recommendation be traced from inputs → rule → output?
- Does the explanation state which data mattered most?
- Does the explanation surface the tradeoff being made?

### Logic Integrity

- Is the comparable session rule enforced for all trend and trigger calculations?
- Are deload triggers checked correctly (2-of-3)?
- Is the e1RM calculation method correct (RPE table for singles, Epley as fallback)?
- Are safety overrides applied when RPE exceeds target?
- Is the pain escalation protocol followed?

### Scope Discipline

- Does the implementation preserve phase 1 scope (bench only)?
- Does it avoid adding features not in the spec?
- Does the UI expose the right information for bench decision-making without clutter?

### Data Honesty

- Are missing-data or uncertainty cases handled honestly?
- Does the system refuse to fabricate e1RM when intensity data is absent?
- Does it flag reduced confidence when using non-comparable sessions?

## Testing Expectations

- Key logic paths should have automated tests: e1RM calculation, deload trigger detection, comparable session matching, progression logic, phase identification
- Recommendation outputs should be checkable against `evals/bench-cases.md`
- Regressions should be compared against known good outputs
- Manual testing should confirm the user can complete the logging → recommendation → review loop
- Edge cases to test: missing RIR data, pain escalation transitions, phase boundaries, mixed bench standards in same session

## Severity Guide

- **Critical:** Wrong e1RM calculation, wrong deload trigger logic, standard conflation in trend data, phase logic error, pain protocol violation
- **High:** Wrong recommendation logic, serious personalisation loss, unsafe stress progression, major regression
- **Medium:** Weak UX, missing tests, incomplete explanation, moderate scope drift, comparable session rule not enforced
- **Low:** Polish gaps, naming issues, minor ergonomics problems

## Approval Standard

Approve only if the change makes the product feel more like a serious bench specialist who knows Sidney's data, and less like a generic fitness app. Every recommendation must be traceable.
