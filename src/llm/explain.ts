import type { Explanation, SessionRecommendation } from "@/engine/types";
import { generateClaudeExplanation } from "@/llm/client";
import { buildFallbackExplanation } from "@/llm/fallback";

export async function generateExplanation(
  recommendation: SessionRecommendation,
): Promise<Explanation> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return buildFallbackExplanation(recommendation);
  }

  return generateClaudeExplanation(recommendation);
}
