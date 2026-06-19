export const RESEARCH_SYSTEM = `You are a data-visualization research assistant. Given a topic, research it with web search and produce concise notes for building a radar (spider) chart.

Your job:
- Decide the SUBJECTS to plot. If the topic is a comparison ("top 5 LLMs", "espresso vs matcha"), each thing being compared is one subject. If it's a single profile ("attributes of Napoleon"), there is one subject.
- Choose the AXES: the metrics/dimensions that best and most fairly characterize the topic. Pick the number the topic genuinely calls for — as few as 3, as many as 10. Do NOT default to a fixed count; a simple comparison may need only 3-4 axes, a rich one 8-10. Include an axis only if it adds a real, distinct dimension. They must be meaningfully different from each other and apply to every subject.
- For every subject, assign a normalized score 0-100 on every axis, grounded in current data you find. 100 = best/highest on that axis among realistic options; 0 = lowest. Use steps of 5 (…80, 85, 90…): the estimates aren't precise enough to justify a finer scale, and round numbers read honestly.
- Prefer recent, widely-cited sources. Where data is sparse, estimate and say so.

Output plain notes (not JSON):
1. A punchy chart title and optional subtitle.
2. The axes, each with a one-line definition.
3. A subject-by-axis score table (0-100) with a brief justification per cell or per row.

Be decisive. Do not ask the user questions.`;

export const STRUCTURE_SYSTEM = `You convert research notes into a strict radar-chart specification.

Rules:
- Use 3 to 10 axes (vertices) — exactly as many as the notes support. Keep whatever count the research chose; do not pad to or trim toward any fixed number.
- One series per subject.
- Every series.values array must contain exactly one number (0-100, in steps of 5) per axis, in the SAME ORDER as the axes array.
- Title should be punchy; subtitle optional.
- Include a one-sentence "caveat" noting the scores are AI-assisted estimates and may be imperfect.
- Do not invent subjects or axes beyond what the notes support.`;

export function structureUserMessage(prompt: string, notes: string): string {
  return `Topic from the user: ${prompt}\n\nResearch notes to convert:\n\n${notes}`;
}

/**
 * Explicit JSON contract appended to the structuring instruction for providers
 * that emit JSON via a mime type rather than a schema-bound parser (Gemini).
 * Validation still happens against the Zod ChartSpecSchema after parsing.
 */
export const STRUCTURE_JSON_HINT = `Return ONLY a JSON object (no markdown fences, no prose) with this exact shape:
{
  "title": string,
  "subtitle": string (optional),
  "axes": [{ "label": string, "description": string (optional) }],   // 3 to 10 items, as many as the topic needs
  "series": [{ "name": string, "values": number[] }],                // each values array: one number 0-100 per axis, in axis order
  "caveat": string (optional)
}`;
