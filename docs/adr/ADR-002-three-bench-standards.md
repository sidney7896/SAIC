# ADR-002: Track Three Bench Standards Separately

## Status

Accepted

## Decision

The coaching system tracks three distinct flat bench press standards, each with its own estimated max, trend line, and progression logic:

1. IPF 2026 (competition paused)
2. Normal gym (touch-and-go, no wraps)
3. Gym + wraps (max boost setup)

## Rationale

- Sidney explicitly defines three bench variants with different rules and different expected maxes
- Conflating them would produce noisy trend data and unreliable e1RM estimates
- The system needs to know which standard a logged set was performed under to interpret it correctly
- Future competition prep (if any) requires isolating the paused standard

## Consequences

- The training log needs a `bench_standard` field (or the system must infer it from notes/flags)
- Each standard gets its own e1RM estimate and trend
- Recommendations should specify which standard they target
- The majority of historical data is standard 2 (normal gym, no wraps) — this is the primary training standard
- Standards 1 and 3 will have sparser data and wider confidence intervals initially

## Open Questions

- How to handle sets where the standard is ambiguous or not logged
- Whether to estimate conversion factors between standards (e.g., gym TNG → IPF paused) or keep them fully independent
