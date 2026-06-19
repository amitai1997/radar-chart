import { z } from "zod";
import { normalizeSpec } from "@/lib/schema";
import { generateSpec } from "@/lib/ai";
import { AiConfigError } from "@/lib/ai/errors";
import { isAnthropicApiError } from "@/lib/ai/anthropic";
import { formatGeminiError, isGeminiApiError } from "@/lib/ai/gemini";

// Web search adds latency; give the function room.
export const maxDuration = 60;

export async function POST(request: Request) {
  let prompt: string;
  try {
    const body = (await request.json()) as { prompt?: unknown };
    if (typeof body.prompt !== "string" || !body.prompt.trim()) {
      return Response.json(
        { error: "Provide a non-empty `prompt`." },
        { status: 400 },
      );
    }
    prompt = body.prompt.trim();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const spec = normalizeSpec(await generateSpec(prompt));
    return Response.json({ spec });
  } catch (err) {
    if (err instanceof AiConfigError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof z.ZodError) {
      return Response.json(
        { error: "The model could not produce a valid chart for that topic." },
        { status: 502 },
      );
    }
    if (isAnthropicApiError(err)) {
      return Response.json(
        { error: `Claude API error (${err.status}): ${err.message}` },
        { status: 502 },
      );
    }
    if (isGeminiApiError(err)) {
      return Response.json(
        { error: formatGeminiError(err) },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error.";
    return Response.json({ error: message }, { status: 502 });
  }
}
