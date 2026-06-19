import type { ChartSpec } from "@/lib/schema";
import { generateWithGemini } from "@/lib/ai/gemini";
import { generateWithAnthropic } from "@/lib/ai/anthropic";

export type AiProvider = "gemini" | "anthropic";

export function activeProvider(): AiProvider {
  return (process.env.AI_PROVIDER ?? "gemini").toLowerCase() === "anthropic"
    ? "anthropic"
    : "gemini";
}

/** Generate a (validated) chart spec using the configured provider. */
export function generateSpec(prompt: string): Promise<ChartSpec> {
  return activeProvider() === "anthropic"
    ? generateWithAnthropic(prompt)
    : generateWithGemini(prompt);
}
