import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ChartSpecSchema, type ChartSpec } from "@/lib/schema";
import {
  RESEARCH_SYSTEM,
  STRUCTURE_SYSTEM,
  structureUserMessage,
} from "@/lib/prompts";
import { AiConfigError } from "@/lib/ai/errors";

const MODEL = process.env.CHART_MODEL ?? "claude-sonnet-4-6";
const MAX_TOOL_TURNS = 6;

/** Two-phase generation: web-search research, then structured chart spec. */
export async function generateWithAnthropic(prompt: string): Promise<ChartSpec> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiConfigError("ANTHROPIC_API_KEY is not set on the server.");
  }
  const client = new Anthropic({ apiKey });

  const notes = await research(client, prompt);

  const structured = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: STRUCTURE_SYSTEM,
    messages: [{ role: "user", content: structureUserMessage(prompt, notes) }],
    output_config: { format: zodOutputFormat(ChartSpecSchema) },
  });

  if (!structured.parsed_output) {
    throw new Error("The model could not produce a valid chart for that topic.");
  }
  return structured.parsed_output;
}

/**
 * Research turn with the web_search server tool. Web search runs a server-side
 * loop that can return `pause_turn`; re-send to resume until done or capped.
 */
async function research(client: Anthropic, prompt: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: RESEARCH_SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search" }],
      messages,
    });

    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }
    return extractText(res);
  }

  const final = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: RESEARCH_SYSTEM,
    messages: [
      ...messages,
      {
        role: "user",
        content:
          "Stop searching and write your radar-chart research notes now using what you have.",
      },
    ],
  });
  return extractText(final);
}

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export function isAnthropicApiError(err: unknown): err is APIError {
  return err instanceof APIError;
}
