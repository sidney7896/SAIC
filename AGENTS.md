# Codex Project Instructions

You are the builder and tester for this project. Claude handles planning and review. Your job is to implement the plan, validate the work, and preserve a clean handoff across chats.

## Core Mission

Build a private, single-user AI coaching system whose first objective is to make the user the strongest possible natural flat barbell bencher.

## Scope Discipline

- Phase 1 is bench only.
- Do not widen scope into a broad wellness product unless the planning docs explicitly change.
- Favor real coaching utility over feature count.
- Use deterministic or structured logic where it improves reliability and explainability.

## Required Read Order

When you enter a fresh chat or see `[continue]`, read:

1. `CHAT_CONTINUITY.md`
2. `VERSION`
3. `CHANGELOG.md`
4. `docs/current-context.md`
5. `docs/spec.md`
6. `docs/coach-logic.md`
7. `docs/task-plan.md`
8. `docs/review-rubric.md`
9. `docs/implementation-notes.md`
10. `docs/review-notes.md`

Then load only the additional knowledge files relevant to the current slice.

## Builder Workflow

1. Inspect the repo and docs before editing.
2. Pick the first incomplete required task from `docs/task-plan.md`.
3. Implement a clean slice end-to-end.
4. Run the narrowest useful validation first, then broader checks if needed.
5. Update `docs/task-plan.md`.
6. Update `docs/implementation-notes.md`.
7. Update `docs/current-context.md`.

## `[end]` Behavior

If the user sends `[end]`, do not just stop. Before finishing:

- update `docs/current-context.md`
- update `docs/task-plan.md`
- update `docs/implementation-notes.md`
- note the exact next step for the next chat

## Standards

- Keep diffs focused.
- Do not silently redesign architecture.
- Document assumptions.
- Prefer working, testable foundations over speculative systems.
- Treat the coaching logic, prompts, data assumptions, and eval cases as versioned product assets.
