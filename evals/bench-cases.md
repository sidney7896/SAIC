# Bench Coach Evaluation Cases

Use these cases to compare versions of the coach. Each case uses Sidney's real data and tests specific coaching logic from `docs/coach-logic.md`.

## Scoring Lens

For each case, judge the response on:

- **Specificity:** Does it use real numbers and real context, not generic advice?
- **Safety:** Does it follow the pain protocol, deload triggers, and safety overrides?
- **Personalisation:** Does it reflect Sidney's phase, history, and preferences?
- **Logic correctness:** Does it apply the right rule from coach-logic.md?
- **Explainability:** Can the user trace the recommendation to its inputs?
- **Actionability:** Does it tell Sidney exactly what to do, not just what to think about?

---

## Case 1: Cut-phase heavy push day — normal conditions

**Context:**
- Phase: Cut (→ 65 kg)
- Current BW: ~70 kg
- Last heavy push session (3 days ago): 90 kg × 1 @ RIR 1.0 (e1RM = 93.8 kg)
- Pain: 0/10
- Sleep: 7.5 hours
- Session type: Push day (heavy)

**Expected output:**
- Top single: ~90 kg, target RIR 1.5–2.5 (RPE 7.5–8.5)
- Back-off sets: 3–4 × 3–5 @ ~70–75 kg (74–79% of 93.8 kg e1RM)
- Optional paused variant or close-grip: 2–3 × 3–5 @ RIR 2–2.5
- Rest: 3–5 min for heavy work
- Explanation references: stable e1RM trend, cut phase, strength preservation mode

**A weak answer would:** prescribe volume-focused work, ignore the cut context, or suggest a weight above the last session without justification.

---

## Case 2: Safety override — top single runs hot

**Context:**
- Phase: Cut
- Today's top single: 90 kg × 1 @ RIR 0 (RPE 10 — grinder)
- Planned back-offs: 4 × 4 @ 75 kg
- Pain: 0/10

**Expected output:**
- Flag that RPE exceeded target (target was 7.5–8.5, actual was 10)
- Apply safety override: reduce back-off volume by 20–33% (→ 3 × 4 or 3 × 3 @ 75 kg)
- Do NOT prescribe the optional variation work
- Warn: if this happens again next session, consider mini-deload
- Explanation references: safety override rule, cut-phase stress management

**A weak answer would:** ignore the RPE overshoot, proceed with full planned volume, or just say "good effort."

---

## Case 3: Deload trigger — 2-of-3 rule fires

**Context:**
- Phase: Cut
- Last 3 comparable heavy push sessions:
  - Feb 28: 90 kg × 1 @ RIR 1.0 → e1RM = 93.8 kg
  - Mar 3: 85 kg × 1 @ RIR 2.5 → e1RM = 93.9 kg (but also failed 92.5 kg)
  - Mar 7: 90 kg × 1 @ RIR 1.0 → e1RM = 93.8 kg
- Pain: trending from 0 to 2/10 (shoulder, mild)
- RPE drift: same 90 kg felt RIR 1.5 two weeks ago, now feels RIR 1.0

**Expected output:**
- Check triggers: e1RM drop ≥2%? No (93.8 → 93.9 → 93.8, stable). RPE drift ≥1? Borderline (1.5 → 1.0 = 0.5 drift, not enough). Pain ≥3/10? No (2/10).
- Conclusion: 0 of 3 triggers met → no deload yet
- But flag the RPE drift as worth monitoring and note that pain is non-zero and trending up
- Explain exactly which triggers were checked and why each did or did not fire

**A weak answer would:** recommend a deload based on "vibes," ignore the trigger thresholds, or not check all three triggers explicitly.

---

## Case 4: Deload trigger — actually fires

**Context:**
- Phase: Cut
- Last 3 comparable heavy push sessions:
  - Session A: 90 kg × 1 @ RIR 1.5 → e1RM = 95.7 kg
  - Session B: 90 kg × 1 @ RIR 0.5 → e1RM = 91.8 kg (e1RM drop: 4.1%, trigger 1 ✓)
  - Session C: 87.5 kg × 1 @ RIR 0.5 → e1RM = 89.3 kg (RPE drift: same weight harder, trigger 2 ✓)
- Pain: 1/10 (trigger 3 ✗)

**Expected output:**
- 2-of-3 triggers met → recommend deload week
- Deload prescription: volume −40% (reduce sets, not reps), RPE −1, maintain frequency, cut accessories in half
- Duration: 1 week, reassess after
- Explanation: "Your e1RM dropped 6.7% over 2 comparable sessions (95.7 → 89.3) and the same weight is feeling harder. Two of three deload triggers have fired."
- Also flag: during a cut, an e1RM drop of 3–5% + RPE drift → reduce volume 20% and consider whether the caloric deficit needs adjustment

**A weak answer would:** not compute the exact trigger values, recommend "taking it easy" without a structured deload protocol, or miss the cut-phase strength loss threshold.

---

## Case 5: Comparable session rule — mixed data

**Context:**
- Phase: Cut
- Recent sessions:
  - Mon (Push, heavy): 90 kg × 1 @ RIR 1.0 → e1RM = 93.8 kg
  - Wed (Legs, medium): 80 kg × 5 @ RIR 0.0
  - Sat (Push, heavy): 87.5 kg × 1 @ RIR 1.0 → e1RM = 91.1 kg
- Question: Is e1RM dropping? Should we deload?

**Expected output:**
- Compare only the two push-day heavy sessions (Mon: 93.8, Sat: 91.1)
- e1RM drop: 2.9% → meets the ≥2% threshold (trigger 1 ✓)
- Exclude the Wednesday leg-day session from the comparison — it's not comparable
- Check remaining triggers before recommending deload
- Explicitly state: "I'm comparing your Monday and Saturday heavy push sessions. The Wednesday leg-day bench is excluded because it was a medium session at a different intensity."

**A weak answer would:** average all three sessions, compare heavy to medium, or use the Wednesday session as evidence of a drop.

---

## Case 6: Standard conflation trap

**Context:**
- Phase: Cut
- Tuesday: IPF paused bench 85 kg × 1 @ RIR 1.0 → e1RM = 88.5 kg (IPF standard)
- Thursday: Gym TnG bench 90 kg × 1 @ RIR 1.0 → e1RM = 93.8 kg (gym standard)
- Question: What's my current e1RM?

**Expected output:**
- Report two separate e1RM values:
  - IPF (paused): ~88.5 kg
  - Gym (no wraps): ~93.8 kg
- Do NOT average them or treat 88.5 as a "drop" from 93.8
- Note the expected gap between standards (~3–7% per reference docs; actual gap here: 6.0%, within range)
- If asked to track the trend, track each standard independently

**A weak answer would:** report a single e1RM, treat the IPF session as a regression, or blend the two standards.

---

## Case 7: Pain escalation — Level 2

**Context:**
- Phase: Cut
- Today's warm-up: mild anterior shoulder discomfort, 3/10 by the time working sets begin
- Planned session: heavy push day, top single + back-offs

**Expected output:**
- Activate Level 2 pain protocol:
  - Bench variant volume −33%
  - Top single target RPE −0.5 (so target RIR becomes 2.0–3.0 instead of 1.5–2.5)
  - Switch to a joint-friendly variant for back-off work (e.g., Spoto press or feet-up bench)
- Do NOT say "rest and come back when it's better" without structure
- Log the pain and monitor trend: if ≥3/10 becomes persistent, it contributes to deload triggers
- Recommend: "If pain increases during the session to ≥5/10, stop immediately and follow Level 3 protocol."

**A weak answer would:** ignore the pain signal and proceed as planned, or give generic "rest more" advice with no structured modification.

---

## Case 8: Cut-phase strength loss — warning threshold

**Context:**
- Phase: Cut (BW dropped from 72 to 68 kg over 4 weeks)
- e1RM trend (gym standard, comparable heavy sessions):
  - Week 1: 95.7 kg
  - Week 2: 94.0 kg
  - Week 3: 92.4 kg
  - Week 4: 91.0 kg
- Total drop: 4.9% over 4 weeks
- Pain: 0/10
- RPE drift: marginal

**Expected output:**
- Identify this as a 3–5% e1RM drop + RPE drift → warning zone per cut-phase thresholds
- Recommend: reduce volume by 20%, consider whether the ~1 kg/week deficit rate is sustainable
- Do NOT recommend stopping the cut (scope discipline — that's a nutrition decision outside phase 1)
- Surface the tradeoff: "You're losing strength faster than the acceptable threshold during this cut. Reducing training volume by 20% should help stabilise. If the drop exceeds 5%, a deload week is warranted."
- Track: if next session shows further decline past 5%, escalate to deload + deficit reassessment flag

**A weak answer would:** panic and tell Sidney to stop cutting, or ignore the trend and say "it's fine, you're in a cut."

---

## Case 9: Good day — push opportunity

**Context:**
- Phase: Cut
- Push day (heavy)
- Sleep: 8 hours, felt rested
- Pain: 0/10
- Last heavy session: 90 kg × 1 @ RIR 1.5 → e1RM = 95.7 kg
- Warm-up feels fast and crisp

**Expected output:**
- Recognise this is an opportunity day
- Top single: attempt 92.5 kg (target RIR 1.5–2.5)
- If 92.5 feels good (RIR ≥1.5), proceed with normal back-offs
- If 92.5 feels heavy (RIR ≤0.5), do NOT chase more — apply safety override
- Explain: "Your last e1RM was 95.7 kg and conditions are good today. A 92.5 kg single would give you data at a heavier load while staying within the target RPE window."
- Do NOT recommend testing a true max during a cut

**A weak answer would:** tell Sidney to attempt 95+ during a cut, or not capitalise on the good day and prescribe the same conservative session regardless.

---

## Case 10: Leg day medium bench — correct prescription

**Context:**
- Phase: Cut
- Leg day (bench is secondary/medium)
- Current e1RM (gym): ~93.8 kg
- Pain: 0/10

**Expected output:**
- Session type: medium
- Working sets: 3–5 × 3–5 @ ~65–70 kg (TnG or light paused), target RIR 3–4 (RPE 6–7)
- Rest: 2–3 min
- No top single on leg day
- Purpose explanation: "This is volume accumulation and movement pattern practice. Intensity stays low so it doesn't interfere with your next heavy push day."

**A weak answer would:** prescribe heavy work on a leg day, include a top single, or set RPE targets above 7.

---

## Case 11: Missing RIR data — uncertainty handling

**Context:**
- Phase: Cut
- Sidney logged: "85 kg × 3" with no RIR, no RPE, no subjective notes
- This is the only data point for the session

**Expected output:**
- Do NOT fabricate an e1RM from this set
- State: "This set doesn't have intensity data (no RIR/RPE), so I can't estimate your e1RM from it. I'll exclude it from trend calculations."
- Ask for the minimum extra data needed: "Can you recall roughly how many reps you had left? Even a rough estimate (easy / moderate / hard / near failure) would help."
- Continue using the most recent valid e1RM from a prior session

**A weak answer would:** silently estimate e1RM using Epley without flagging the missing intensity data, or drop the data point without telling the user.

---

## Case 12: Phase transition — cut to builder

**Context:**
- Date: ~May 2026 (post-Japan vacation)
- Sidney returns from vacation, hasn't trained in 2 weeks
- Last known e1RM (gym): ~92 kg (pre-vacation)
- BW: ~65 kg (cut complete)
- New phase: transition into Year-Round Builder

**Expected output:**
- Prescribe 1 week ramp-back: light sessions, rebuild movement patterns
- Do NOT jump into 6x/week heavy programming immediately
- Ramp-back week: 3–4 sessions, RPE cap 7, no top singles above 80% of last known e1RM
- After ramp-back: begin Cycle 1 Block A (Accumulation) of the Year-Round Builder
- Flag: e1RM will need recalibration after the layoff — first heavy session after ramp-back should establish a new baseline
- Explain: "You haven't trained for 2 weeks. Jumping straight into heavy work risks injury and gives unreliable e1RM data. One transition week first."

**A weak answer would:** prescribe the first week of the builder at full intensity, or keep applying cut-phase rules when the phase has changed.

---

## Case 13: Annual peak — Week 3 check

**Context:**
- Date: early August 2026
- Phase: Peaking (Week 3 of 10-week program)
- Target IPF 1RM for Aug 29: 115 kg
- Current e1RM (from Week 3 heavy single): 112 kg
- Pain: 0/10

**Expected output:**
- e1RM is at 97.4% of target (112/115) — on track per the reference doc's W3 check
- Continue peaking protocol as planned
- Prescribe Week 3: 10 hard sets, top single @ RPE 8.5 ("peak exposure" — last real heavy week)
- Volume starts tapering from here
- Flag: "If e1RM had been <98% of target at this point, we'd need to reassess the target or adjust the approach for the remaining weeks."

**A weak answer would:** not do the W3 check calculation, or recommend changes when the athlete is on track.

---

## Case 14: Test day attempt selection

**Context:**
- Date: August 29, 2026
- Phase: Test Day
- Testing IPF standard first
- Expected IPF 1RM: 115 kg
- Warm-ups complete, feeling good

**Expected output:**
- Opener: 92% of 115 = 105.8 → round to 105 kg, target RPE 7.5–8.0
- 2nd attempt decision tree:
  - If opener RPE ≤8.0 → 2nd at 112.5 kg (97%)
  - If opener RPE 8.5 → 2nd at 110 kg (95%)
  - If opener RPE ≥9.0 → 2nd at 107.5 kg (93%)
- 3rd attempt: +2.5 kg if 2nd was RPE ≤9.0, repeat if RPE 9.5, stop if RPE 10
- Rest between IPF and gym standard: 25 min
- Explain each jump and why

**A weak answer would:** prescribe fixed attempts without the conditional logic, or not follow the test day protocol from the reference docs.

---

## Case 15: Pull day — minimal bench

**Context:**
- Phase: Cut
- Pull day (Friday)
- Sidney asks: "Should I bench today?"

**Expected output:**
- Per the cut protocol: bench on pull days is minimal or skipped
- If Sidney wants to bench: very light sets at ~60 kg, no difficulty, RPE 5–6 max
- Do NOT prescribe structured bench work on pull days during the cut
- Explain: "During the cut, pull days are recovery days for your bench. If you want to move the bar, keep it at 60 kg for easy sets. This is not a training stimulus — it's just pattern maintenance."

**A weak answer would:** prescribe real working sets on a pull day during a cut, or treat it as a training opportunity.
