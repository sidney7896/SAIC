import type { Alert, Explanation, SessionRecommendation } from "@/engine/types";

function alertMessages(alerts: Alert[]) {
  return alerts.map((alert) => alert.message);
}

export function buildRuleExplanation(
  recommendation: SessionRecommendation,
): Explanation {
  const topExercise = recommendation.exercises[0];
  const alertText = alertMessages(recommendation.alerts);

  return {
    summary:
      recommendation.session_type === "deload"
        ? `Deload session for ${recommendation.day_type} day. Volume and effort are reduced while bench frequency stays intact.`
        : topExercise
          ? `${recommendation.phase} ${recommendation.day_type} day. Lead work starts with ${topExercise.exercise} at ${topExercise.target_weight_kg} kg.`
          : `No bench work prescribed because the safety gate stopped the session.`,
    key_inputs: [
      `Phase: ${recommendation.phase}`,
      `Pain score: ${recommendation.state_snapshot.pain_score}/10`,
      `Current gym e1RM: ${recommendation.state_snapshot.e1rm_gym_kg.toFixed(1)} kg`,
      `Deload triggers met: ${recommendation.state_snapshot.deload_triggers_met}`,
    ],
    rule_applied:
      recommendation.session_type === "deload"
        ? "The 2-of-3 deload rule or mini-deload gate overrode normal session generation."
        : `Used the ${recommendation.phase} template for a ${recommendation.day_type} ${recommendation.session_type} session.`,
    tradeoff:
      recommendation.phase === "cut"
        ? "Biasing toward strength preservation and fatigue control rather than chasing extra volume."
        : "Biasing toward the current phase objective while keeping the prescription explainable and safe.",
    monitor_next: alertText.length > 0 ? alertText : ["Top single effort and pain trend on the next comparable session."],
  };
}
