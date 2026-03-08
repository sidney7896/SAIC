import { buildRuleExplanation } from "@/engine/explanation";
import type { Explanation, SessionRecommendation } from "@/engine/types";

export function buildFallbackExplanation(
  recommendation: SessionRecommendation,
): Explanation {
  return buildRuleExplanation(recommendation);
}
