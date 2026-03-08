# FBAC Bench Press — Deep Research Prompts

18 prompts across 13 domains. Generated March 2026.

---

## 3-Stage Research Workflow

Every domain goes through the same pipeline. Each stage uses a different model for what it's best at.

### Stage 1 — ChatGPT 5.2 Deep Research

**What it does best:** Persistent multi-round web search, pulling together dozens of sources, finding needle-in-a-haystack studies, and producing structured literature reviews. Deep Research mode will spend minutes actively searching, reading papers, and synthesizing before it responds.

**How to use it:** Paste the Stage 1 prompt (below) directly into ChatGPT with Deep Research mode enabled. Let it run — it may take several minutes. The output will be a long, source-heavy research brief.

**What to expect:** A 2,000–5,000 word evidence-backed document with citations, study summaries, and organized sections. It will be thorough but sometimes over-inclusive, occasionally surface-level in its analysis, and may not critically evaluate conflicting evidence well.

---

### Stage 2 — ChatGPT 5.4 Pro Extended Thinking

**What it does best:** GPT-5.4 Pro ET is the strongest at structured reasoning with steerability — it plans its thinking process upfront, verifies its own logic, and produces highly organized, precise outputs. It's 33% less likely to produce false claims than GPT-5.2. Its strength is taking a large, messy body of evidence and turning it into a clean, critically evaluated synthesis with practical recommendations. It's also excellent at spotting gaps and contradictions in research.

**How to use it:** Paste the Stage 2 prompt below, followed by the full Deep Research output from Stage 1. Use Extended Thinking mode. GPT-5.4 Pro will critically analyze the research, resolve contradictions, rank evidence quality, and produce a tighter, more actionable document.

**What to expect:** A refined, critically evaluated synthesis that's shorter but sharper than the Stage 1 output. It will flag where evidence is strong vs weak, resolve conflicting findings, and add practical recommendations. The structure will be clean and consistent.

---

### Stage 3 — Claude Opus 4.6 Extended Thinking

**What it does best:** Opus 4.6 has the strongest long-context reasoning of any model (93% retrieval accuracy at 256k tokens, 76% at 1M). It excels at deep, careful reasoning over large bodies of text — it will catch nuances, edge cases, and implications that other models miss. Its adaptive thinking means it automatically reasons harder on the difficult parts and moves quickly through the straightforward parts. It's also the best at producing coaching-quality writing that's specific, honest about uncertainty, and actionable.

**How to use it:** Paste the Stage 3 prompt below, followed by BOTH the Deep Research output (Stage 1) AND the GPT-5.4 synthesis (Stage 2). Opus 4.6 will read both, cross-reference them, and produce the final coaching knowledge document optimized for injection into the FBAC engine.

**What to expect:** The final, production-ready knowledge document. It will be written in the coaching voice (direct, specific, honest about uncertainty), structured for the AI engine to reference, and tagged with confidence levels. This is what goes into the `knowledge/research/` folder.

---

### Stage 2 Prompt (use for every domain)

Paste this before the Deep Research output:

```
You are a critical research analyst. I'm going to give you a deep research report on a bench press training topic. Your job is to:

1. CRITICALLY EVALUATE the evidence quality. For each major claim, rate it:
   - Strong: multiple peer-reviewed studies with consistent findings
   - Moderate: some studies, or consistent expert consensus with mechanistic support
   - Weak: anecdotal, single studies, or extrapolated from non-bench-specific research
   - Conflicting: studies disagree — summarize both sides

2. RESOLVE CONTRADICTIONS. Where the research presents conflicting findings, explain why they conflict (different populations, methodologies, definitions) and give a best-current-answer.

3. CUT THE FILLER. Remove anything that doesn't directly help a natural bench presser make better training decisions. No generic fitness advice. No padding.

4. ADD PRACTICAL RECOMMENDATIONS. For each section, end with a concrete "what to do" summary specific to this athlete:
   - Sidney, 25, male, natural, ~71 kg, gym bench ~100 kg, IPF ~93 kg
   - 1.5 years serious training age
   - Currently cutting, transitioning to lean bulk May 2026
   - Long-term goal: strongest possible natural bench over 15-20 years

5. FLAG GAPS. Where the research didn't cover something important, or where the evidence is too thin to draw conclusions, say so explicitly.

Output a clean, well-structured document with headers, evidence ratings inline, and practical takeaways at the end of each section.

Here is the deep research report:

[PASTE STAGE 1 OUTPUT HERE]
```

### Stage 3 Prompt (use for every domain)

Paste this before both previous outputs:

```
You are the knowledge architect for FBAC (Flat Barbell AI Coach), a private bench press coaching engine for a single athlete. Your job is to produce the final coaching knowledge document from the research below.

You will receive TWO inputs:
1. A deep research report (raw evidence gathering)
2. A critical synthesis of that report (evaluated and refined)

Your task:

1. CROSS-REFERENCE both documents. Where they agree, consolidate. Where they disagree, use your judgment to resolve — explain your reasoning briefly.

2. WRITE FOR THE COACHING ENGINE. This document will be injected into an AI coaching system's knowledge base. Write it so a rules-based engine and an LLM explanation layer can both reference it. Be specific, quantitative where possible, and honest about confidence levels.

3. STRUCTURE for the engine:
   - Start with a 2-3 sentence "TLDR" summary
   - Use clear headers and sub-headers
   - Tag each recommendation with a confidence level: [HIGH CONFIDENCE], [MODERATE CONFIDENCE], [LOW CONFIDENCE / NEEDS MORE DATA]
   - Include a "Key Numbers" section with any specific thresholds, percentages, or ranges the engine should use
   - End with "Open Questions" — things we don't know yet that matter

4. ATHLETE CONTEXT — every recommendation must be grounded in:
   - Sidney, 25, male, natural (no PEDs, ever), ~71 kg, gym bench ~100 kg, IPF ~93 kg
   - 1.5 years serious training age, planning 15-20 year career
   - Currently cutting → lean bulk May 2026 → long-term trajectory to ~120 kg bodyweight
   - 6x/week PPL, bench on push (heavy), legs (medium), pull (light/skip)
   - Annual test day August 29 (IPF paused → gym no wraps → gym + wraps)

5. COACHING VOICE — direct, specific, no hype. Say "we don't know" when we don't know. Prefer "do X because Y" over "consider exploring X." This is a coach talking to an advanced athlete, not a textbook.

6. NO COPYRIGHT ISSUES — do not reproduce large blocks of text from either input. Synthesize in your own words.

Here are the two inputs:

--- DEEP RESEARCH REPORT (Stage 1) ---
[PASTE STAGE 1 OUTPUT HERE]

--- CRITICAL SYNTHESIS (Stage 2) ---
[PASTE STAGE 2 OUTPUT HERE]
```

---

## Athlete Context Block

This is included in every Stage 1 prompt so the deep research models have full context:

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.
```

---

## Domain Overview

| # | Domain | Prompts | Depth |
|---|--------|---------|-------|
| 1 | Programming Science | 1, 2, 3 | Deep |
| 2 | Peaking & Competition | 4 | Deep |
| 3 | Exercise Selection | 5 | Deep + Practical |
| 4 | Technique & Biomechanics | 6 | Deep |
| 5 | Body Composition | 7, 17 | Deep + Practical |
| 6 | Muscle Development | 8 | Deep + Practical |
| 7 | Neuromuscular | 9 | Deep |
| 8 | Connective Tissue & Injury | 10 | Deep |
| 9 | Recovery & Lifestyle | 11 | Practical |
| 10 | Equipment | 12, 18 | Practical + Deep |
| 11 | Biological Timeline | 13 | Deep |
| 12 | Psychological | 14 | Deep + Practical |
| 13 | Data & Tracking | 15 | Practical |
| — | Anthropometric | 16 | Deep |

---

## Stage 1 Prompts (for ChatGPT 5.2 Deep Research)

---

### Prompt 1 — Volume, Frequency & Intensity Distribution

**Domain:** Programming Science
**Depth:** Deep research
**Sub-topics:** Volume (sets/session, sets/week, MEV/MAV/MRV for bench), frequency (bench sessions/week by training age), intensity distribution (heavy/moderate/light split, pyramid vs polarized vs threshold)

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What does the current evidence say about optimal bench press volume, training frequency, and intensity distribution for a natural lifter progressing from intermediate to advanced?

Cover these three sub-topics in depth:

1. VOLUME — What are the practical MEV, MAV, and MRV benchmarks for the bench press specifically (not generic "chest")? How do these change with training age? How should volume be distributed across a training week with 3-6 bench sessions? Include hard sets counting methodology.

2. FREQUENCY — What does the research show about bench press frequency for strength (not hypertrophy)? Compare 2x, 3x, 4x, 5x, 6x/week frequencies. Does the optimal frequency change as training age increases? What are the diminishing returns and injury risk curves?

3. INTENSITY DISTRIBUTION — Compare heavy/moderate/light distribution models. What percentage of work should be above 85% 1RM vs 70-84% vs below 70% for a strength-focused bencher? How does this change during a cut vs a bulk? What does the "polarized training" concept mean applied to bench pressing?

For each sub-topic: cite specific studies where possible, note effect sizes when available, flag where evidence is weak or conflicting, and give practical recommendations for someone at Sidney's level. Address how these variables interact with each other (e.g., higher frequency typically requires lower per-session volume).

Output format: structured sections with clear headers, practical takeaways at the end of each section.
```

---

### Prompt 2 — Periodisation Models

**Domain:** Programming Science
**Depth:** Deep research
**Sub-topics:** Block periodisation, DUP (daily undulating), conjugate/concurrent, linear, wave loading — evidence, comparison, and application to bench press

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: Which periodisation model produces the best bench press strength outcomes for a natural intermediate-to-advanced lifter, and how should the model evolve over a 15-20 year career?

Cover these models in depth:
- Linear periodisation (and why it stops working)
- Daily Undulating Periodisation (DUP)
- Block periodisation (accumulation → intensification → realization)
- Conjugate/concurrent (Westside-style)
- Wave loading and hybrid approaches

For each model:
1. Summarize the core mechanism and how it drives adaptation.
2. Cite the key studies comparing it to alternatives for upper body pressing strength.
3. Identify who it works best for (training age, goals, schedule constraints).
4. Note the practical downsides and failure modes.

Then synthesize:
- Which model fits a 12-week mesocycle with 6x/week training (3 bench days)?
- How should the periodisation approach change across training years 1-5, 5-10, and 10-20?
- How do you handle periodisation during a caloric deficit (cut phase)?

Practical output: a recommendation for Sidney's current situation (1.5 years training age, 6x/week PPL, currently cutting, transitioning to builder phase in May 2026).
```

---

### Prompt 3 — Progressive Overload, Deloads & Overreaching

**Domain:** Programming Science
**Depth:** Deep research
**Sub-topics:** Progressive overload methods and timescales, planned vs reactive deloads, functional vs non-functional overreaching, fatigue management, SFR (stimulus-to-fatigue ratio)

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: How should progressive overload be structured for the bench press across different timescales, and how do deloads and deliberate overreaching fit into the long-term plan?

Cover these sub-topics:

1. PROGRESSIVE OVERLOAD — What are the practical methods beyond "add weight to the bar"? Cover: load progression, rep progression, set progression, density progression, RPE/RIR progression, tempo manipulation. When does linear progression stop working and what replaces it? What is the expected rate of bench press strength gain by training year for a natural lifter?

2. DELOADS — Planned vs reactive deloads: which approach is better supported by evidence? What should a bench-focused deload look like (volume reduction vs intensity reduction vs both)? How often should deloads occur? What are the signs that a deload is needed vs the signs that you should push through?

3. OVERREACHING — Define functional overreaching (FOR) vs non-functional overreaching (NFOR). Can deliberate overreaching be used as a programming tool for bench press? What does the supercompensation curve actually look like for bench strength? How do you distinguish productive overreaching from early overtraining?

4. FATIGUE MANAGEMENT & SFR — What is the stimulus-to-fatigue ratio concept applied to bench press exercise selection? Which bench variations and rep ranges have the best SFR? How does SFR change during a cut vs a bulk?

Cite studies where available. Flag where the evidence is mostly anecdotal or coach-derived rather than peer-reviewed.
```

---

### Prompt 4 — Peaking & Competition Preparation

**Domain:** Peaking & Competition
**Depth:** Deep research
**Sub-topics:** Peaking protocols (6-12 weeks), taper strategies, test day execution, attempt selection, competition commands and strategy

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: How should a natural bench presser peak for a maximal test day, and what does optimal test-day execution look like?

Sidney tests all three bench standards every August 29. This is not a formal competition but follows competition-style protocols (IPF commands for the paused bench).

Cover:
1. PEAKING PROTOCOLS — What does a 6-12 week peaking block look like for bench press? How should volume, intensity, and frequency change week by week? Compare common approaches (Sheiko-style, RTS-style, percentage-based taper). What does the research say about supercompensation timing?

2. TAPER STRATEGY — How far out should the last heavy single be? What should the final 2 weeks look like? How much strength can be "revealed" by a proper taper vs lost by a poor one? What role does CNS fatigue play?

3. ATTEMPT SELECTION — How to choose an opener, second attempt, and third attempt. What RPE should the opener be? How to adjust based on how the opener moves? Decision trees for the second and third attempts.

4. COMPETITION COMMANDS & STRATEGY — IPF bench commands (start, press, rack). How to train for the pause. Timing between attempts. Warm-up room strategy and timing. How to manage three different bench standards tested in sequence with 25 min rest between.

Practical output: a week-by-week framework Sidney can use for his August 29 test day.
```

---

### Prompt 5 — Bench Variations, Accessories & Exercise Selection Strategy

**Domain:** Exercise Selection
**Depth:** Deep on hierarchy, practical on individual variations
**Sub-topics:** Bench press variations, accessory hierarchy by training age, weak point diagnosis & variation matching, overload methods (slingshot, bands, chains, boards), BFR for bench accessories, specificity vs variation balance

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What is the optimal exercise selection strategy for maximizing bench press strength, including variations, accessories, and overload methods?

Cover:

1. BENCH VARIATIONS — For each major variation (comp paused, touch-and-go, close-grip, Spoto, Larsen press, feet-up, floor press, board press, pin press, tempo bench), explain: what it trains, when to use it in a training cycle, and where it fits in a periodised program. Which variations have the highest transfer to competition bench?

2. ACCESSORY HIERARCHY — Rank the most effective accessories for bench press strength (not just chest hypertrophy). Consider: tricep work, shoulder work, back work, chest isolation. How does the optimal accessory selection change from beginner to intermediate to advanced? What is the minimum effective dose of accessory work during a cut?

3. WEAK POINT DIAGNOSIS — How to identify whether the weak point is off the chest, at midrange, or at lockout. What does each sticking point tell you about muscle/technique deficiency? Which variations and accessories fix which sticking points?

4. OVERLOAD METHODS — Evaluate slingshot, board press, bands (accommodating resistance), chains, and reverse bands for bench press. What does the evidence say about supramaximal loading for neural adaptations? Are these useful for a natural lifter or mainly relevant for equipped/enhanced lifters?

5. BFR (BLOOD FLOW RESTRICTION) — Is there evidence for using BFR on bench accessories during a cut to maintain muscle with reduced load?

6. SPECIFICITY VS VARIATION — How much variation is productive vs diluting specificity? How should the specificity-variation balance shift across a mesocycle and across training years?
```

---

### Prompt 6 — Technique & Biomechanics

**Domain:** Technique & Biomechanics
**Depth:** Deep research
**Sub-topics:** Bar path, arch training, setup cues, leg drive, grip width, breathing/bracing, shoulder blade mechanics, eccentric tempo, touch point, unracking/handoff

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What does the biomechanical evidence say about optimal bench press technique for maximizing 1RM strength, and how should technique be trained and refined?

This is career-defining territory. Cover each sub-topic:

1. BAR PATH — J-curve vs straight line. What do elite lifters actually do? What does the biomechanical research show? How does optimal bar path change with grip width and body proportions?

2. ARCH — How to build and maintain a competition-legal arch safely. What are the mobility requirements? Progressive arch training protocols. Injury risks and how to mitigate them.

3. SETUP SEQUENCE — Step-by-step setup procedure. What order should cues be executed in? What are the most common setup errors? How to make the setup automatic and repeatable.

4. LEG DRIVE — Mechanics of leg drive in the bench press. Timing (constant vs initiated at the bottom). Feet flat vs on toes. How leg drive interacts with arch and bar path.

5. GRIP WIDTH — How to determine optimal grip width based on arm length, shoulder width, and torso depth. Competition rules (81 cm max in IPF). Narrower vs wider grip tradeoffs for strength.

6. BREATHING & BRACING — When to take the breath. Intra-abdominal pressure for bench. Valsalva maneuver considerations. Re-breathing between reps.

7. SHOULDER BLADE MECHANICS — Retraction and depression. How to set and maintain scapular position through the lift. Why it matters for shoulder health and power transfer.

8. ECCENTRIC TEMPO — Does lowering speed matter for strength development? Controlled descent vs fast eccentric. What the research says.

9. TOUCH POINT — Optimal contact point on the chest by grip width and body type. How touch point affects bar path and shoulder stress.

10. UNRACKING — Self-unrack vs handoff. Liftoff angle. How to preserve setup tightness during the unrack.

For each: cite research where available, note where it's coach-derived knowledge, and flag what is individual-dependent vs universally applicable.
```

---

### Prompt 7 — Body Composition & Weight Trajectory

**Domain:** Body Composition
**Depth:** Deep research (highest ceiling impact)
**Sub-topics:** Bodyweight-strength relationship for bench, career weight trajectory (71 kg → 120 kg), bulk/cut cycling strategy, strength impact of weight changes

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What is the relationship between bodyweight and absolute bench press strength for a natural lifter, and how should Sidney plan his long-term weight trajectory to maximize his bench ceiling?

This is likely the single most impactful research domain for absolute bench ceiling.

Cover:

1. BODYWEIGHT-STRENGTH RELATIONSHIP — What does the data show about the relationship between bodyweight and bench press 1RM in natural lifters? Allometric scaling. Wilks/DOTS/IPF GL points and what they reveal about weight class advantages. At what bodyweight does the bench press ceiling tend to maximize for natural lifters? Is there a point of diminishing returns?

2. CAREER WEIGHT TRAJECTORY — Sidney is 71 kg now and plans to reach ~120 kg over 8+ years. What is a healthy and productive rate of weight gain for a natural lifter focused on bench strength? How should weight gain be phased? What are the health considerations of gaining 50 kg (blood pressure, metabolic health, joint stress, sleep apnea)?

3. BULK/CUT CYCLING — How should bulk and cut phases be structured to maximize long-term bench strength? Optimal surplus size during bulks (lean bulk vs aggressive bulk). Optimal deficit size during cuts. How long should each phase last? What is the expected strength impact of cutting (how much 1RM loss per kg of bodyweight lost)?

4. NUTRITION PERIODISATION AROUND TRAINING — Caloric and macronutrient strategy on bench training days vs rest days during both bulk and cut. Protein requirements for bench-focused strength athletes. Carbohydrate timing around heavy bench sessions.

Cite the research where it exists. For the weight trajectory question specifically, look at data from natural powerlifting federations, long-term lifter tracking, and allometric scaling studies.
```

---

### Prompt 8 — Muscle Development for Bench Transfer

**Domain:** Muscle Development
**Depth:** Deep on contribution mapping, practical on programming
**Sub-topics:** Muscles used in bench press by strength level, hypertrophy phases for bench transfer, grip strength and forearm development

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: Which muscles contribute most to bench press strength at different levels, and how should hypertrophy work be structured to maximize transfer to the bench?

Cover:

1. MUSCLE CONTRIBUTION MAPPING — What EMG and biomechanical research tells us about the relative contribution of pectorals (upper, mid, lower), anterior deltoids, triceps (long head, lateral, medial), lats, and other stabilizers to the bench press. How do these contributions shift as a lifter goes from beginner to intermediate to elite? At what strength level do the triceps become the primary limiter?

2. HYPERTROPHY FOR BENCH TRANSFER — How to structure hypertrophy phases that actually transfer to bench 1RM (vs just building muscle that doesn't help). Exercise selection for bench-specific hypertrophy. Rep ranges, volume, and proximity to failure for strength-transferring hypertrophy. How to transition from a hypertrophy block to a strength/peaking block without losing the gains.

3. GRIP STRENGTH & FOREARMS — At heavier weights (150+ kg bench), does grip security on the bar become a meaningful factor? How to develop grip strength relevant to bench pressing. Forearm training considerations.

4. PRACTICAL APPLICATION — For Sidney at ~100 kg bench: which muscles are most likely his current limiters? How should his hypertrophy work change as he progresses from 100 kg to 140 kg to 180+ kg bench?
```

---

### Prompt 9 — Neuromuscular Adaptations & Motor Learning

**Domain:** Neuromuscular
**Depth:** Deep research
**Sub-topics:** Neural adaptations (rate coding, motor unit recruitment, intermuscular coordination), motor learning for bench, training age considerations

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: How do neural adaptations and motor learning contribute to bench press strength development, and how should training be structured to optimize these adaptations across a multi-decade career?

Cover:

1. NEURAL ADAPTATIONS — Rate coding (firing frequency), motor unit recruitment thresholds, intermuscular coordination, intramuscular coordination, antagonist co-contraction reduction, and corticospinal drive. Which of these are trainable? How quickly do they adapt vs hypertrophy? What training methods specifically target neural adaptations (heavy singles, speed work, maximal intent)?

2. MOTOR LEARNING — The bench press as a motor skill. How "grooved" does the movement pattern need to be for maximal strength expression? How much practice (sets, reps, frequency) is needed to develop and maintain bench press motor patterns? What happens to motor patterns during deloads and layoffs?

3. TRAINING AGE CONSIDERATIONS — What drives strength gains at different stages? Years 0-2: mostly neural + motor learning? Years 2-5: shifting toward hypertrophy-driven gains? Years 5-10: neural efficiency + muscle maturity? Years 10+: incremental hypertrophy + neural refinement + technique mastery? How should programming priorities shift as these mechanisms change?

4. SPECIFICITY IMPLICATIONS — What the neural/motor learning research means for exercise selection. How much non-bench pressing is too much? Does training the bench press in different rep ranges (1s vs 5s vs 8s) develop different neural qualities?

Cite neuroscience and sports science literature where available.
```

---

### Prompt 10 — Connective Tissue & Injury Prevention

**Domain:** Connective Tissue & Injury Prevention
**Depth:** Deep research (career-critical)
**Sub-topics:** Tendon adaptation, shoulder longevity, elbow/wrist/pec health, common bench injuries, red flags, pre-bench assessment, prehab

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: How should a natural bench presser manage connective tissue health and injury prevention across a 15-20 year career of heavy benching?

This is career-critical research. One pec tear at year 8 could cost 2 years.

Cover:

1. TENDON ADAPTATION SCIENCE — How do tendons adapt to loading? How does the adaptation timeline differ from muscle (tendons lag behind)? What loading protocols promote tendon health (isometrics, slow eccentrics, heavy singles)? How does tendon adaptation change with age?

2. SHOULDER LONGEVITY — The shoulder is the most vulnerable joint for bench pressers. What are the structural risks of high-volume, high-intensity bench pressing over decades? Rotator cuff management. Impingement prevention. The role of back training volume for shoulder health. Specific prehab protocols with evidence.

3. ELBOW, WRIST & PEC HEALTH — Common bench-related elbow issues (medial epicondylitis, triceps tendinopathy). Wrist health and bracing. Pec tear risk factors (what causes pec tears and how to minimize risk). Warning signs for each.

4. RED FLAGS & PRE-BENCH ASSESSMENT — What symptoms should stop a bench session immediately? A practical pre-bench checklist. Pain scales and when to modify vs when to stop. How to distinguish normal training discomfort from injury warning signs.

5. LONG-TERM STRUCTURAL MANAGEMENT — What does a career-length joint health strategy look like? How should training volume, variation selection, and recovery practices evolve with age to protect the joints while still progressing?

Cite orthopedic and sports medicine literature where available.
```

---

### Prompt 11 — Recovery & Lifestyle

**Domain:** Recovery & Lifestyle
**Depth:** Practical summaries
**Sub-topics:** Sleep optimization, supplementation (evidence-backed), post-workout routine

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What are the most impactful recovery and lifestyle factors for bench press strength, and what are the practical, evidence-backed recommendations?

Cover:

1. SLEEP — What does the research say about sleep and strength performance? Minimum hours, sleep quality vs quantity, napping, sleep timing. What is the measurable strength impact of sleeping 6 vs 7 vs 8 vs 9 hours? Practical optimization strategies.

2. SUPPLEMENTATION — Only cover supplements with strong evidence for strength performance. For each: the mechanism, the dose, the expected effect size, and any caveats. Likely list: creatine, caffeine, beta-alanine, and possibly vitamin D and omega-3. Be ruthless about cutting anything without solid evidence.

3. POST-WORKOUT ROUTINE — What actually matters after a heavy bench session? Protein timing, cool-down, stretching, foam rolling — what has evidence and what is ritual? Keep this practical and brief.

Keep each section focused on practical takeaways with evidence ratings (strong, moderate, weak/anecdotal).
```

---

### Prompt 12 — Equipment

**Domain:** Equipment
**Depth:** Practical summaries
**Sub-topics:** Wrist wraps, elbow wraps/sleeves, chalk, shoe selection, bar type

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What equipment choices meaningfully affect bench press performance, and what are the practical recommendations?

Cover:

1. WRIST WRAPS — Types (cloth, stiff, competition-legal). How to wrap for bench. When to start using wraps in a training career. Do wraps actually add kilos to the bench or just protect the joint? How to choose stiffness level.

2. ELBOW WRAPS/SLEEVES — Elbow sleeves vs wraps. Neoprene thickness. Do they add anything to the bench or just manage pain? When are they appropriate?

3. CHALK — Liquid vs block chalk. Application technique for bench (hands, back, bench pad). Federation rules. Does chalk meaningfully affect bench performance?

4. SHOES — Flat sole (Converse, wrestling shoes, deadlift slippers) vs heeled shoes vs barefoot. How shoe choice interacts with leg drive style (flat feet vs toes). What do elite bench pressers wear?

5. BAR TYPE — Stiff bar vs whip (flex). 28mm vs 29mm diameter. Knurling patterns. How bar choice affects bench pressing (especially at higher weights). IPF-spec bar characteristics.

Keep this practical and equipment-recommendation focused. Sidney currently benches ~100 kg and will be moving toward much heavier weights over the next decade.
```

---

### Prompt 13 — Biological Timeline & Plateau Management

**Domain:** Biological Timeline
**Depth:** Deep research
**Sub-topics:** Expected strength curve for natural lifters, biological prime window, plateau management and diagnosis

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What is the realistic long-term strength trajectory for a natural bench presser, and how should plateaus be managed across a 15-20 year career?

Cover:

1. EXPECTED STRENGTH CURVE — What does the data show about year-by-year bench press gains for natural lifters? Expected gain rates at different training ages (years 1-3, 3-5, 5-10, 10-15, 15+). What are realistic lifetime bench ceilings at different bodyweights for natural lifters? Use data from natural powerlifting federations, tracking studies, and strength standards databases.

2. BIOLOGICAL PRIME WINDOW — At what age do natural lifters typically peak for bench press strength? How does the prime window interact with training age (starting at 24 vs starting at 18)? What physiological changes happen after the prime window and how do they affect bench strength?

3. PLATEAU MANAGEMENT — How to diagnose the cause of a bench press plateau (programming issue vs recovery issue vs technique issue vs bodyweight issue). A systematic troubleshooting framework. What percentage of plateaus are solved by eating more vs changing programming vs fixing technique? How long should you persist with a program before declaring it's not working?

4. DECADE-SCALE PLANNING — How to structure training priorities across: Years 1-3 (foundation), Years 3-7 (rapid development), Years 7-12 (peak performance window), Years 12+ (maintenance and incremental gains). Apply this specifically to Sidney: started serious training at ~24, currently 25 with 1.5 years of training, planning 15-20 years.
```

---

### Prompt 14 — Psychology of Max Attempts & Long-Term Motivation

**Domain:** Psychological
**Depth:** Deep on max attempts, practical on motivation
**Sub-topics:** Mental rehearsal, visualization, arousal regulation, confidence building, PR strategy, long-term motivation

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What does sports psychology say about maximizing bench press 1RM performance, and how do you sustain motivation across a 15-20 year strength pursuit?

Cover:

1. MAX ATTEMPT PSYCHOLOGY — Mental rehearsal and visualization techniques specifically for heavy bench attempts. What does the research show about their effectiveness? Practical protocols (how often, how detailed, when to do it).

2. AROUSAL REGULATION — The psyching up vs staying calm debate. Optimal arousal levels for maximal strength (inverted U hypothesis). What works better for bench press specifically? Does this change with training age and experience? How to find your personal optimal arousal state.

3. CONFIDENCE BUILDING — How to systematically build confidence for PR attempts. The role of submaximal autoregulation in building confidence (hitting prescribed RPEs consistently). How missed attempts affect subsequent performance and confidence.

4. PR ATTEMPT STRATEGY — When to attempt a PR vs when to wait. How to set up the training week before a PR attempt. Warm-up strategy on PR day. What to do when a PR attempt fails.

5. LONG-TERM MOTIVATION — How to sustain a 15-20 year pursuit of a single lift. Identity-based motivation vs goal-based motivation. Process attachment. How to handle multi-month plateaus without losing drive. What long-term successful lifters say about motivation.

Cite sports psychology research where available. Practical protocols preferred over theory.
```

---

### Prompt 15 — Autoregulation & Response Tracking

**Domain:** Data & Tracking
**Depth:** Practical, applicable to coaching engine
**Sub-topics:** RPE/RIR systems, velocity-based training, readiness-based autoregulation, individual response tracking

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What are the most effective autoregulation methods for bench press training, and how should individual response be tracked to optimize programming?

This research directly feeds into Sidney's AI coaching engine, which uses RPE/RIR-based autoregulation and tracks session data to adjust prescriptions.

Cover:

1. RPE/RIR SYSTEMS — How accurate are self-reported RPE/RIR ratings? Do they improve with training age? What is the typical error margin? How to calibrate RPE/RIR over time. RPE vs RIR — which is more useful for programming?

2. VELOCITY-BASED TRAINING (VBT) — Mean concentric velocity as a proxy for intensity. Velocity targets for bench press at different percentages of 1RM. Can VBT improve autoregulation beyond RPE alone? Cost and practical barriers. Is it worth it for a self-coached athlete?

3. READINESS-BASED AUTOREGULATION — Using subjective readiness, sleep data, and other signals to modify training. What signals are most predictive of bench performance on a given day? How should bad-day and good-day adjustments work?

4. INDIVIDUAL RESPONSE TRACKING — How to determine if a program is working for YOU specifically. Key metrics to track. Minimum data collection period before drawing conclusions. How to distinguish signal from noise in training data. Statistical approaches to detecting real trends vs random variation.

5. PRACTICAL DATA MODEL — What data points should be logged every session for optimal coaching? What is the minimum viable data set vs the ideal data set? How should the data be structured for trend analysis?

Focus on practical application for a self-coached athlete using an AI coaching engine.
```

---

### Prompt 16 — Anthropometric Analysis

**Domain:** Anthropometric
**Depth:** Focused deep research
**Sub-topics:** How body proportions determine optimal bench technique, grip width, arch, and bar path

> **NOTE: Fill in your actual measurements before running this prompt.**

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Additional anthropometric data:
- Height: [MEASURE]
- Arm span: [MEASURE]
- Shoulder width (biacromial): [MEASURE]
- Upper arm length (shoulder to elbow): [MEASURE]
- Forearm length (elbow to wrist): [MEASURE]
- Torso depth (sternum to bench pad when lying flat, no arch): [MEASURE]
- Hand span: [MEASURE]

Research question: How do individual body proportions determine optimal bench press technique, and what do Sidney's specific measurements mean for his approach?

Cover:

1. LEVERAGES AND BENCH MECHANICS — How arm length, torso depth, and shoulder width affect range of motion, moment arms, and optimal bar path. What ratios matter most. The biomechanical model for bench press leverages.

2. GRIP WIDTH — How to calculate optimal grip width from shoulder width and arm length. The tradeoffs of wider vs narrower grip for different body types. Competition-legal maximum (81 cm ring-to-ring).

3. ARCH OPTIMIZATION — How torso depth and spinal mobility determine potential arch height. What arch is achievable for someone with Sidney's proportions. Safety limits.

4. BAR PATH — How lever arms change through the range of motion for someone with Sidney's proportions. Where the mechanical disadvantage is greatest. What this means for sticking points.

5. FOOT PLACEMENT — How leg length and hip mobility affect optimal foot position for leg drive.

Note: if Sidney hasn't filled in his measurements yet, provide the framework and formulas so he can input his numbers and get personalized recommendations.
```

---

### Prompt 17 — Bench-Day Nutrition & Carb Strategy

**Domain:** Body Composition (moved from Domain 8)
**Depth:** Practical
**Sub-topics:** Pre-workout meal, intra-workout nutrition, bench-day calorie strategy during cut and bulk, protein timing

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Research question: What is the optimal nutrition strategy specifically around heavy bench press sessions, during both cutting and bulking phases?

Cover:

1. PRE-BENCH MEAL — Optimal timing (1h, 2h, 3h before?). Macro composition. Carb loading for bench performance. Specific food recommendations. Does meal size matter for bench strength?

2. INTRA-WORKOUT — Is intra-workout nutrition (carb drinks, EAAs) beneficial for a bench session lasting 60-90 minutes? At what training intensity/duration does it start mattering?

3. BENCH-DAY CALORIES DURING A CUT — Should bench days be higher calorie than non-training days (calorie cycling)? If so, by how much? Where should the extra calories come from? How to implement this without undermining the weekly deficit.

4. BENCH-DAY CALORIES DURING A BULK — Same questions during a surplus. Is there benefit to concentrating more of the surplus on training days?

5. POST-BENCH NUTRITION — Protein timing (does the "anabolic window" matter?). Post-workout meal composition. Recovery nutrition vs the next session's preparation.

6. PROTEIN FOR BENCH-FOCUSED ATHLETES — Optimal daily protein intake during cut (likely 2.0-2.4 g/kg) and bulk (likely 1.6-2.2 g/kg). Distribution across meals. Does protein source matter?

Keep this practical and bench-specific. Cite the research where it's clear, and flag where it's mostly bro science.
```

---

### Prompt 18 — Wrist/Elbow Wraps Deep Dive

**Domain:** Equipment (deep research extension)
**Depth:** Deep research (directly relevant to gym + wraps standard)
**Sub-topics:** Wrap mechanics, wraps as performance tool, wrap selection by strength level, training with wraps, impact on the three bench standards

```
Context about the athlete (include in every prompt):
- Name: Sidney. Male, 25, Dutch, natural lifter (no PEDs, ever).
- Current stats: ~71 kg bodyweight, gym bench ~100 kg (touch-and-go), IPF comp bench ~93 kg (paused).
- Training age: ~1.5 years of serious structured bench training.
- Current phase: caloric deficit (cut), transitioning to a lean bulk around May 2026.
- Long-term goal: strongest possible natural flat barbell bench press over a 15-20 year career.
- Annual test day: August 29 each year, three standards tested (IPF paused, gym no wraps, gym + wraps).
- Planned bodyweight trajectory: 71 kg now → eventually ~120 kg over 8+ years.
- Training setup: 6x/week PPL split, bench on push days (heavy), leg days (medium), pull days (light/skip).
- No competition plans — this is a private, self-coached pursuit of absolute strength.
- The research output will be injected as knowledge into a custom AI coaching engine (rules-based + LLM hybrid) that generates session-by-session bench prescriptions.

Additional context: Sidney tests three bench standards annually — IPF (strict paused, no wraps), gym (touch-and-go, no wraps), and gym + wraps (touch-and-go with wrist wraps). Understanding wraps deeply matters because the gym+wraps standard is where the absolute ceiling number lives.

Research question: What is the science and practice of using wraps (wrist and elbow) to maximize bench press performance?

Cover:

1. WRIST WRAPS FOR BENCH — Biomechanical mechanism (joint stabilization, proprioceptive feedback, force transfer). Do wraps add measurable kilos to the bench press or just reduce pain? How much carryover should be expected (2-5%? More?)? Wrapping technique specifically for bench press (direction, tightness, position on wrist).

2. ELBOW SLEEVES/WRAPS — Neoprene elbow sleeves vs wraps. Mechanism for bench: warmth, proprioception, mild elastic rebound? Do they meaningfully add to bench press performance or just manage tendinopathy?

3. WRAP SELECTION BY STRENGTH LEVEL — What wraps are appropriate at 100 kg bench vs 150 kg vs 200+ kg? Stiffness levels. Material (cotton, elastic, competition-spec). Brand/model recommendations if available from competitive powerlifters.

4. TRAINING WITH WRAPS — How often to use wraps in training (always? Only heavy days? Only top singles?). Does training with wraps reduce the skill of pressing without them? How to program wrap usage across a mesocycle.

5. IMPACT ON THE THREE STANDARDS — How to predict the gap between "no wraps" and "with wraps" at different strength levels. What the typical boost is (the spec says +12-18% over IPF). How this gap changes as absolute strength increases.

Cite biomechanical studies where available. Include practical recommendations from competitive bench pressers.
```

---

## Checklist

Use this to track progress through the pipeline:

| # | Domain | Stage 1 (Deep Research) | Stage 2 (GPT-5.4 Pro ET) | Stage 3 (Opus 4.6 ET) | Saved to knowledge/ |
|---|--------|:-:|:-:|:-:|:-:|
| 1 | Volume, Frequency & Intensity | [ ] | [ ] | [ ] | [ ] |
| 2 | Periodisation Models | [ ] | [ ] | [ ] | [ ] |
| 3 | Overload, Deloads & Overreaching | [ ] | [ ] | [ ] | [ ] |
| 4 | Peaking & Competition | [ ] | [ ] | [ ] | [ ] |
| 5 | Variations & Accessories | [ ] | [ ] | [ ] | [ ] |
| 6 | Technique & Biomechanics | [ ] | [ ] | [ ] | [ ] |
| 7 | Body Composition & Weight | [ ] | [ ] | [ ] | [ ] |
| 8 | Muscle Development | [ ] | [ ] | [ ] | [ ] |
| 9 | Neuromuscular | [ ] | [ ] | [ ] | [ ] |
| 10 | Connective Tissue & Injury | [ ] | [ ] | [ ] | [ ] |
| 11 | Recovery & Lifestyle | [ ] | [ ] | [ ] | [ ] |
| 12 | Equipment | [ ] | [ ] | [ ] | [ ] |
| 13 | Biological Timeline | [ ] | [ ] | [ ] | [ ] |
| 14 | Psychology | [ ] | [ ] | [ ] | [ ] |
| 15 | Autoregulation & Tracking | [ ] | [ ] | [ ] | [ ] |
| 16 | Anthropometric | [ ] | [ ] | [ ] | [ ] |
| 17 | Bench-Day Nutrition | [ ] | [ ] | [ ] | [ ] |
| 18 | Wraps Deep Dive | [ ] | [ ] | [ ] | [ ] |
