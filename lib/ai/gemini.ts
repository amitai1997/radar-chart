import { GoogleGenAI } from "@google/genai";
import { ChartSpecSchema, type ChartSpec } from "@/lib/schema";
import {
  RESEARCH_SYSTEM,
  STRUCTURE_JSON_HINT,
  STRUCTURE_SYSTEM,
  structureUserMessage,
} from "@/lib/prompts";
import { AiConfigError } from "@/lib/ai/errors";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-pro-preview";

/**
 * Two-phase generation mirroring the Anthropic path: phase 1 grounds the
 * research with the Google Search tool, phase 2 emits JSON (validated by Zod).
 * The two are kept separate because Search grounding and a JSON-mime response
 * can't be combined in a single Gemini call.
 */
export async function generateWithGemini(prompt: string): Promise<ChartSpec> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiConfigError("GEMINI_API_KEY is not set on the server.");
  }
  const ai = new GoogleGenAI({ apiKey });

  // Phase 1 — grounded research.
  const research = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: RESEARCH_SYSTEM,
      tools: [{ googleSearch: {} }],
    },
  });
  const notes = (research.text ?? "").trim();
  if (!notes) {
    throw new Error("The model returned no research for that topic.");
  }

  // Phase 2 — structured JSON.
  const structured = await ai.models.generateContent({
    model: MODEL,
    contents: structureUserMessage(prompt, notes),
    config: {
      systemInstruction: `${STRUCTURE_SYSTEM}\n\n${STRUCTURE_JSON_HINT}`,
      responseMimeType: "application/json",
    },
  });

  const raw = (structured.text ?? "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new Error("The model did not return valid JSON for that topic.");
  }
  return ChartSpecSchema.parse(parsed);
}

export function isGeminiApiError(err: unknown): err is Error {
  if (!(err instanceof Error)) return false;
  try {
    const body = JSON.parse(err.message) as unknown;
    return (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "object"
    );
  } catch {
    return false;
  }
}

export function formatGeminiError(err: Error): string {
  try {
    const body = JSON.parse(err.message) as {
      error: { code: number; message: string; status: string };
    };
    const { code, message, status } = body.error;
    if (code === 429 || status === "RESOURCE_EXHAUSTED") {
      return `Gemini quota exceeded (${code}). Enable billing at aistudio.google.com or set GEMINI_MODEL=gemini-2.0-flash in .env.local for the free tier.`;
    }
    if (code === 401 || code === 403) {
      return `Gemini API key invalid or unauthorized (${code}). Check GEMINI_API_KEY in .env.local.`;
    }
    return `Gemini API error (${code}): ${message}`;
  } catch {
    return err.message;
  }
}

/** Defensive: strip ```json fences if the model wraps output despite the hint. */
function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).trim();
}
