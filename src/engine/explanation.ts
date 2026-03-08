import type { Alert, Explanation, ReasoningContext, SessionRecommendation } from "@/engine/types";

function alertMessages(alerts: Alert[]) {
  return alerts.map((alert) => alert.message);
}

export function buildRuleExplanation(
  recommendation: SessionRecommendation,
  reasoning?: ReasoningContext,
): Explanation {
  const topExercise = recommendation.exercises[0];
  const alertText = alertMessages(recommendation.alerts);
  const snap = recommendation.state_snapshot;

  // --- Summary ---
  let summary: string;
  if (recommendation.session_type === "deload") {
    summary = `Deload session for ${recommendation.day_type} day. Volume and effort are reduced while bench frequency stays intact.`;
  } else if (!topExercise) {
    summary = `No bench work prescribed because the safety gate stopped the session.`;
  } else {
    summary = `${capitalise(recommendation.phase)} ${recommendation.day_type} day. Lead work: ${formatExerciseName(topExercise.exercise, topExercise.variation)} at ${topExercise.target_weight_kg} kg (target RIR ${topExercise.target_rir}).`;
  }

  // --- Key inputs ---
  const keyInputs: string[] = [
    `Gym e1RM: ${snap.e1rm_gym_kg.toFixed(1)} kg${reasoning?.e1rmConfidence ? ` (${reasoning.e1rmConfidence} confidence)` : ""}`,
    `e1RM trend: ${reasoning?.e1rmTrend ?? "unknown"}${reasoning?.lastComparableDate ? ` (last comparable: ${reasoning.lastComparableDate}, ${reasoning.lastComparableE1rm?.toFixed(1)} kg)` : ""}`,
    `Phase: ${recommendation.phase}${snap.block ? ` / ${snap.block}` : ""}${snap.phase_week ? ` W${snap.phase_week}` : ""}`,
    `Pain: ${snap.pain_score}/10`,
    `Deload triggers: ${snap.deload_triggers_met}/3`,
  ];

  if (reasoning?.sleepHours !== undefined) {
    keyInputs.push(`Sleep: ${reasoning.sleepHours} hours`);
  }
  if (reasoning?.subjectiveReadiness !== undefined) {
    keyInputs.push(`Readiness: ${reasoning.subjectiveReadiness}/5`);
  }
  if (snap.bodyweight_kg > 0) {
    keyInputs.push(`Bodyweight: ${snap.bodyweight_kg.toFixed(1)} kg`);
  }

  // --- Rule applied ---
  let ruleApplied: string;
  if (recommendation.session_type === "deload") {
    ruleApplied = "The 2-of-3 deload rule or mini-deload gate overrode normal session generation. Volume reduced ~40%, RPE targets dropped by 1.";
  } else if (reasoning?.safetyDecision === "stop") {
    ruleApplied = `Safety gate stopped the session (pain ${snap.pain_score}/10). No bench work prescribed.`;
  } else {
    const parts: string[] = [];

    parts.push(`${capitalise(recommendation.phase)} ${recommendation.day_type} ${recommendation.session_type} template.`);

    if (reasoning?.progressionAction) {
      const pa = reasoning.progressionAction;
      if (pa.action === "increase") {
        parts.push(`Progression: +${pa.changeKg} kg (${pa.reason}).`);
      } else if (pa.action === "decrease") {
        parts.push(`Progression: ${pa.changeKg} kg (${pa.reason}).`);
      } else {
        parts.push(`Progression: hold (${pa.reason}).`);
      }
    }

    if (reasoning?.opportunityDay) {
      parts.push("Opportunity day: +2.5 kg on the top single (good sleep, readiness, zero pain).");
    }
    if (reasoning?.badDay) {
      parts.push("Bad day adjustment: -2.5 kg on the top single (poor sleep or low readiness).");
    }
    if (reasoning?.safetyDecision === "modify") {
      parts.push("Pain Level 2 active: RPE targets reduced by 0.5, volume cut ~33%, variant swapped to joint-friendly.");
    }
    if (reasoning?.safetyDecision === "mini_deload") {
      parts.push("Mini-deload: back-off sets reduced after 2+ consecutive sessions above target RPE.");
    }

    if (reasoning?.backoffPct) {
      parts.push(`Back-offs at ~${reasoning.backoffPct} of e1RM.`);
    }

    ruleApplied = parts.join(" ");
  }

  // --- Tradeoff ---
  let tradeoff: string;
  if (recommendation.phase === "cut") {
    const cutParts: string[] = ["Strength preservation over volume."];
    if (reasoning?.cutStrength) {
      const cs = reasoning.cutStrength;
      if (cs.threshold === "stable") {
        cutParts.push(`e1RM is stable during the cut (${cs.drop_pct.toFixed(1)}% change) — no action needed.`);
      } else if (cs.threshold === "monitor") {
        cutParts.push(`e1RM down ${cs.drop_pct.toFixed(1)}% since cut start — monitoring but no changes yet.`);
      } else if (cs.threshold === "warning") {
        cutParts.push(`e1RM down ${cs.drop_pct.toFixed(1)}% — approaching the warning zone. ${cs.action}.`);
      } else if (cs.threshold === "red_flag") {
        cutParts.push(`e1RM down ${cs.drop_pct.toFixed(1)}% — red flag. ${cs.action}.`);
      }
    } else {
      cutParts.push("Intensity maintained, volume at ~75% of peak to manage fatigue in a deficit.");
    }
    tradeoff = cutParts.join(" ");
  } else if (recommendation.session_type === "deload") {
    tradeoff = "Recovery over stimulus. Keeping frequency to maintain the motor pattern, but cutting volume and intensity to allow systemic recovery.";
  } else {
    tradeoff = "Biasing toward the current phase objective while keeping the prescription safe and traceable.";
  }

  // --- Monitor next ---
  const monitorNext: string[] = [];
  if (alertText.length > 0) {
    monitorNext.push(...alertText);
  }
  if (topExercise && recommendation.session_type !== "deload") {
    monitorNext.push(
      `Top single RIR — if it comes in at ${topExercise.target_rir - 1} or lower, the safety override will reduce volume next session.`,
    );
  }
  if (reasoning?.e1rmTrend === "down") {
    monitorNext.push("e1RM is trending down — watch for a second consecutive drop to confirm the deload trigger.");
  }
  if (monitorNext.length === 0) {
    monitorNext.push("Top single effort and pain trend on the next comparable session.");
  }

  return { summary, key_inputs: keyInputs, rule_applied: ruleApplied, tradeoff, monitor_next: monitorNext };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatExerciseName(exercise: string, variation?: string): string {
  const name = exercise.replace(/_/g, " ");
  if (variation && variation !== "competition") {
    return `${name} (${variation})`;
  }
  return name;
}
