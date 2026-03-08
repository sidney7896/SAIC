# ADR-004: Hybrid Rules + LLM Engine Architecture

## Status

Accepted

## Date

2026-03-07

## Context

The coaching engine needs to both (a) make safety-critical, deterministic decisions (deload triggers, pain protocol, e1RM math) and (b) produce natural-language explanations, synthesise multiple signals, and generate programming for new phases. A pure rules engine can't do (b) well. A pure LLM can't be trusted with (a).

## Decision

Use a **hybrid architecture** with two layers:

**Rules layer (deterministic, testable):** Handles all safety-critical logic — e1RM calculation, deload triggers, pain escalation, safety overrides, comparable session matching, phase identification, back-off weight math, data validation, test day attempt selection, and progression logic. This layer is implemented in code with full test coverage and produces structured data.

**LLM layer (generative, flexible):** Handles natural-language explanation of recommendations, multi-signal readiness synthesis, exercise variation selection within block constraints, coaching tone, pattern recognition across mesocycles, and phase transition programming. This layer receives the structured output from the rules layer and augments it with narrative and judgment.

**Pipeline:** The rules layer always runs first. The LLM layer cannot override safety decisions from the rules layer. The LLM layer can add nuance, context, and coaching language on top of the structured prescription.

## Consequences

- All safety-critical paths are testable and auditable. If the rules layer says "deload," the LLM layer explains why — it doesn't get to decide whether to deload.
- The system can produce good recommendations even if the LLM is unavailable (rules layer alone gives a structured session).
- The LLM layer adds significant value in making the output feel like coaching rather than a spreadsheet.
- Testing is tractable: rules layer has unit and integration tests; LLM layer is evaluated via the eval cases in `evals/bench-cases.md`.
- Implementation requires two distinct codepaths, which adds complexity but is justified by the safety/flexibility tradeoff.

## Alternatives Considered

1. **Pure rules engine:** Would handle safety well but produce rigid, template-y explanations. Programming generation for new phases would be clunky.
2. **Pure LLM:** Would produce great explanations but can't be trusted with e1RM math, deload triggers, or pain protocol. Risk of hallucinating weights or ignoring safety thresholds.
3. **LLM with structured output constraints:** Better than pure LLM, but still unreliable for math-heavy decisions. The rules layer is more robust and testable for the critical paths.
