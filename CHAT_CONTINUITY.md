# Chat Continuity Protocol

Attach this file to the first message of every new chat in this project.

## Commands

### `[continue]`

When the first message in a new chat is `[continue]`, do all of the following before substantive work:

1. Read this file.
2. Read the role file that applies in the current environment:
   - `CLAUDE.md` for Claude planning and review.
   - `AGENTS.md` for Codex implementation and testing.
3. Read the project state files in this order:
   - `VERSION`
   - `CHANGELOG.md`
   - `docs/current-context.md`
   - `docs/spec.md`
   - `docs/coach-logic.md`
   - `docs/task-plan.md`
   - `docs/review-rubric.md`
   - `docs/implementation-notes.md`
   - `docs/review-notes.md`
   - the latest ADR files in `docs/adr/`
4. Read supporting knowledge only as needed:
   - `knowledge/about-me.md`
   - relevant files in `knowledge/research/`
   - relevant files in `data/profile/`
   - relevant files in `data/training/`
   - `evals/bench-cases.md`
5. Start by reporting:
   - what you loaded
   - the current mission
   - the active task or next best task
   - any blockers or ambiguities

Never rely on memory from a prior chat if the project files disagree.

### `[end]`

When the user sends `[end]`, stop normal work and create a clean handoff before closing out the turn.

Always update:

- `docs/current-context.md`
- `docs/task-plan.md`

Update the role-specific handoff file too:

- Claude: `docs/review-notes.md` and any planning docs changed during the session.
- Codex: `docs/implementation-notes.md` and any code-adjacent docs changed during the session.

The handoff must capture:

- current status
- what changed
- what remains
- blockers
- assumptions
- exact next step

End with a short message that the checkpoint is complete.

## Project Rules

- This is a private, single-user bench-first coaching system.
- Do not expand into a generic fitness app unless the project files explicitly change scope.
- Prefer high-signal, testable, explainable decisions over broad feature sets.
- Keep handoff files compact and current so new chats can resume with minimal drift.
