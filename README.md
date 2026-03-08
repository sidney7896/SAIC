# Bench Coach

Private, single-user, bench-first coaching system for Sidney Drost. Phase 1 stays focused on natural flat barbell bench performance and preserves a strict split between deterministic rules logic and LLM-generated explanation.

## Current State

T7 is complete:

- Dashboard reads live status from SQLite and the computed athlete state
- Profile form persists durable coaching inputs
- Recommendation flow generates a structured bench session with explanation and stored basis
- Session log persists completed sessions, sets, and e1RM history
- Review page shows planned-versus-logged context when a recommendation is linked
- Real seed CSV is imported from `data/bench-log.csv`
- Test files still exist as placeholders and are the next task

## Run It

1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy environment defaults if needed:
   ```sh
   cp .env.example .env.local
   ```
3. Start the app:
   ```sh
   npm run dev
   ```
4. Optional verification:
   ```sh
   npm run build
   npm test
   ```

The SQLite file is created at `data/bench-coach.sqlite` on first render and is ignored by git.

## Project Structure

- `src/app/` — Next.js routes and layout
- `src/engine/` — deterministic rules-engine stubs and constant tables
- `src/db/` — Drizzle schema, SQLite client, and query stubs
- `src/llm/` — Claude client boundary and fallback explanation stubs
- `src/import/` — Strengthlog CSV import boundary
- `tests/` — unit and integration test placeholders
- `docs/` — product, logic, planning, ADRs, and continuity handoff files

## Workflow

- `CLAUDE.md` handles planning and review.
- `AGENTS.md` handles implementation and validation.
- Start a new implementation chat with `[continue]`.
- Close out a chat with `[end]` to force a handoff update.
