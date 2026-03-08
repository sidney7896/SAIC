# T6: Scaffold the Product Shell

Implementation-ready task spec for Codex. This defines exactly what the scaffold must contain.

## Stack (per ADR-005)

- **Runtime:** Node.js 20+
- **Framework:** Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **Database:** SQLite via `better-sqlite3`
- **ORM/Query:** Drizzle ORM (type-safe, SQLite-compatible)
- **LLM:** `@anthropic-ai/sdk` for Claude API calls
- **Testing:** Vitest
- **Linting:** ESLint + Prettier (default Next.js config)

## Directory Structure

```
bench-coach/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Dashboard (StatusReport)
│   │   ├── session/
│   │   │   ├── new/page.tsx          # Get today's recommendation
│   │   │   ├── log/page.tsx          # Log a completed session
│   │   │   └── [id]/page.tsx         # Review a past session
│   │   ├── history/page.tsx          # Training history + e1RM charts
│   │   ├── profile/page.tsx          # Athlete profile editor
│   │   └── import/page.tsx           # Strengthlog CSV import
│   │
│   ├── engine/                       # Rules engine (deterministic)
│   │   ├── e1rm.ts                   # e1RM calculation module
│   │   ├── comparable-sessions.ts    # Comparable session matcher
│   │   ├── deload-triggers.ts        # Deload trigger evaluator
│   │   ├── safety.ts                 # Safety override + pain protocol
│   │   ├── progression.ts            # Progression logic
│   │   ├── phase.ts                  # Phase identification
│   │   ├── session-generator.ts      # Session prescription generator
│   │   ├── cut-strength.ts           # Cut-phase strength monitor
│   │   ├── validation.ts             # Input validation
│   │   ├── backoff.ts                # Back-off weight calculator
│   │   ├── constants.ts              # RPE table, volume table, rotation table, peaking table
│   │   └── types.ts                  # All TypeScript interfaces from engine-design.md
│   │
│   ├── llm/                          # LLM layer
│   │   ├── explain.ts                # Generate explanation from rules output
│   │   ├── client.ts                 # Claude API client wrapper
│   │   └── fallback.ts               # Template-based fallback explanations
│   │
│   ├── db/                           # Database layer
│   │   ├── schema.ts                 # Drizzle schema definition
│   │   ├── client.ts                 # SQLite connection
│   │   ├── migrations/               # Drizzle migrations
│   │   └── queries/                  # Query modules
│   │       ├── sessions.ts           # Session CRUD
│   │       ├── sets.ts               # Set CRUD
│   │       ├── e1rm.ts               # e1RM history queries
│   │       ├── profile.ts            # Athlete profile queries
│   │       └── state.ts              # AthleteState computation queries
│   │
│   ├── import/                       # Data import
│   │   └── strengthlog.ts            # Strengthlog CSV parser + importer
│   │
│   └── components/                   # React components
│       ├── ui/                       # Primitive UI components
│       ├── dashboard/                # Dashboard widgets
│       ├── session/                  # Session-related components
│       └── charts/                   # e1RM trend charts
│
├── data/                             # Seed data (from project files)
│   └── bench-log.csv                 # Copy of data/training/bench-log.csv
│
├── tests/                            # Test files
│   ├── engine/                       # Rules engine unit tests
│   │   ├── e1rm.test.ts
│   │   ├── comparable-sessions.test.ts
│   │   ├── deload-triggers.test.ts
│   │   ├── safety.test.ts
│   │   ├── progression.test.ts
│   │   ├── phase.test.ts
│   │   ├── cut-strength.test.ts
│   │   ├── backoff.test.ts
│   │   └── validation.test.ts
│   └── integration/                  # Integration tests from eval cases
│       └── bench-cases.test.ts       # Maps to evals/bench-cases.md
│
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── vitest.config.ts
├── .env.example                      # ANTHROPIC_API_KEY placeholder
└── README.md
```

## Database Schema (Drizzle)

```typescript
// src/db/schema.ts

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),                    // ISO date
  sessionType: text("session_type").notNull(),     // heavy | medium | light | test
  dayType: text("day_type").notNull(),             // push | pull | legs
  painBefore: real("pain_before"),                 // 0–10
  painDuring: real("pain_during"),
  painAfter: real("pain_after"),
  painLocation: text("pain_location"),
  sleepHours: real("sleep_hours"),
  bodyweightKg: real("bodyweight_kg"),
  subjectiveReadiness: integer("subjective_readiness"), // 1–5
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const sets = sqliteTable("sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  exercise: text("exercise").notNull(),            // comp_bench_paused, close_grip, etc.
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps").notNull(),
  sets: integer("num_sets").notNull().default(1),
  rir: real("rir"),                                // 0–5, half-steps
  benchStandard: text("bench_standard"),           // ipf | gym | gym_wraps
  isTopSingle: integer("is_top_single").default(0),
  isWarmup: integer("is_warmup").default(0),
  failed: integer("failed").default(0),
  notes: text("notes"),
});

export const e1rmHistory = sqliteTable("e1rm_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  date: text("date").notNull(),
  benchStandard: text("bench_standard").notNull(), // ipf | gym | gym_wraps
  valueKg: real("value_kg").notNull(),
  method: text("method").notNull(),                // rpe_table | epley | test_day
  confidence: text("confidence").notNull(),        // high | medium | low
  sourceWeightKg: real("source_weight_kg"),
  sourceReps: integer("source_reps"),
  sourceRir: real("source_rir"),
});

export const athleteProfile = sqliteTable("athlete_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),             // e.g., "current_phase", "bodyweight_target_kg"
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const recommendations = sqliteTable("recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").references(() => sessions.id), // null if not yet logged
  date: text("date").notNull(),
  phase: text("phase").notNull(),
  prescriptionJson: text("prescription_json").notNull(),  // Full SessionRecommendation
  stateSnapshotJson: text("state_snapshot_json").notNull(),
  explanationJson: text("explanation_json"),
  createdAt: text("created_at").notNull(),
});
```

## Scaffold Acceptance Criteria

The scaffold is DONE when:

1. **Project runs:** `npm run dev` starts the Next.js app on localhost.
2. **Database initialises:** SQLite database is created on first run with all tables from the schema above.
3. **Types exist:** `src/engine/types.ts` contains all TypeScript interfaces from `docs/engine-design.md` (SessionInput, AthleteState, SessionRecommendation, StatusReport, etc.).
4. **Constants exist:** `src/engine/constants.ts` contains RPE_TABLE, VOLUME_TABLE, ROTATION_TABLE, PEAKING_TABLE, BACKOFF_TABLE from engine-design.md.
5. **Module stubs exist:** Every file in `src/engine/` exists with exported function signatures and `TODO` implementations. The function signatures must match the pseudocode in engine-design.md.
6. **Page stubs exist:** Every route in `src/app/` renders a basic page with a title and placeholder content. No functionality yet.
7. **Test stubs exist:** Every test file in `tests/engine/` exists with `describe` blocks and `it.todo()` stubs for each test case listed in engine-design.md's test coverage requirements.
8. **CSV import stub exists:** `src/import/strengthlog.ts` has the function signature for parsing the Strengthlog CSV format (schema: date, variation, load_kg, reps, rir, warmup, fail, notes).
9. **LLM client stub exists:** `src/llm/client.ts` has a function that takes a SessionRecommendation and returns an Explanation, with a TODO body and an `.env.example` showing ANTHROPIC_API_KEY.
10. **No dummy data:** The scaffold does not contain fake training data. The seed data is the real `bench-log.csv`.

## What T6 Does NOT Include

- No working engine logic (that's T7)
- No working UI forms or interactions (that's T7)
- No test implementations (that's T8)
- No CSS styling beyond basic Tailwind defaults
- No authentication (single user, local)
- No deployment configuration

## Module Signatures (Codex Must Implement These Stubs)

```typescript
// src/engine/e1rm.ts
export function calculateE1rm(weightKg: number, reps: number, rir: number | null): E1rmResult;

// src/engine/comparable-sessions.ts
export function findComparableSessions(target: SessionContext, history: RecentSession[], count?: number): ComparableResult;

// src/engine/deload-triggers.ts
export function evaluateDeloadTriggers(state: AthleteState): DeloadTriggerResult;

// src/engine/safety.ts
export function checkSafetyGate(input: SessionInput, state: AthleteState): SafetyAction;
export function applyPainProtocol(painScore: number): PainLevel;

// src/engine/progression.ts
export function computeTopSingleTarget(state: AthleteState, block: BlockType, week: number): number;
export function computeBackoffWeight(state: AthleteState, block: BlockType): number;
export function evaluateProgression(lastSession: RecentSession, targetRir: number): ProgressionAction;

// src/engine/phase.ts
export function resolvePhase(date: string, profile: AthleteProfile): PhaseContext;

// src/engine/session-generator.ts
export function generateSession(input: SessionInput, state: AthleteState): SessionRecommendation;

// src/engine/cut-strength.ts
export function evaluateCutStrength(state: AthleteState): CutStrengthResult | null;

// src/engine/validation.ts
export function validateSessionInput(input: unknown): ValidationResult<SessionInput>;

// src/engine/backoff.ts
export function computeBackoffWeight(e1rmKg: number, block: BlockType, phase: Phase): number;
```

## Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18.3",
    "react-dom": "^18.3",
    "@anthropic-ai/sdk": "^0.30",
    "better-sqlite3": "^11",
    "drizzle-orm": "^0.35",
    "recharts": "^2.12"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "@types/better-sqlite3": "^7",
    "@types/react": "^18",
    "@types/node": "^20",
    "drizzle-kit": "^0.25",
    "vitest": "^2",
    "tailwindcss": "^3.4",
    "autoprefixer": "^10",
    "postcss": "^8",
    "eslint": "^8",
    "eslint-config-next": "^14",
    "prettier": "^3"
  }
}
```
