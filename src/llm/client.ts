import Anthropic from "@anthropic-ai/sdk";
import { buildRuleExplanation } from "@/engine/explanation";
import type { Explanation, SessionRecommendation } from "@/engine/types";

export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export async function generateClaudeExplanation(
  recommendation: SessionRecommendation,
): Promise<Explanation> {
  const client = getAnthropicClient();

  if (!client) {
    return buildRuleExplanation(recommendation);
  }

  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 250,
      temperature: 0.2,
      system:
        "You are a bench-specialist coach. Summarize the given structured recommendation into JSON with keys summary, key_inputs, rule_applied, tradeoff, monitor_next. Do not change the prescription.",
      messages: [
        {
          role: "user",
          content: JSON.stringify(recommendation),
        },
      ],
    });
    const text = message.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("");
    const parsed = JSON.parse(text) as Explanation;

    return parsed;
  } catch {
    return buildRuleExplanation(recommendation);
  }
}
