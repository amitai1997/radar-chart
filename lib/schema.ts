import { z } from "zod";

/**
 * The canonical chart specification. Shared between the AI route (validated
 * output) and the client editor. The AI returns everything except per-series
 * colors — colors are assigned client-side from the active palette so theming
 * stays purely a frontend concern.
 */

export const AxisSchema = z.object({
  label: z.string().min(1).describe("Short axis name, ideally 1-3 words"),
  description: z
    .string()
    .optional()
    .describe("Optional one-line explanation of what this axis measures"),
});

export const SeriesSchema = z.object({
  name: z.string().min(1).describe("Name of the subject this series represents"),
  values: z
    .array(z.number().min(0).max(100))
    .describe(
      "Normalized scores 0-100, one per axis, in the same order as `axes`",
    ),
});

export const ChartSpecSchema = z.object({
  title: z.string().min(1).describe("Punchy chart title"),
  subtitle: z.string().optional().describe("Optional supporting subtitle"),
  axes: z
    .array(AxisSchema)
    .min(3)
    .max(10)
    .describe(
      "The axes (vertices) of the radar chart — choose the number the topic naturally needs, from 3 to 10",
    ),
  series: z
    .array(SeriesSchema)
    .min(1)
    .describe("One entry per subject being plotted"),
  caveat: z
    .string()
    .optional()
    .describe(
      "One sentence noting scores are AI estimates and may be imperfect",
    ),
});

export type Axis = z.infer<typeof AxisSchema>;
export type Series = z.infer<typeof SeriesSchema>;
export type ChartSpec = z.infer<typeof ChartSpecSchema>;

/**
 * A series enriched with a render color. The chart component and editor work
 * with this shape; the AI never produces colors.
 */
export type ColoredSeries = Series & { color: string };

export type ChartModel = Omit<ChartSpec, "series"> & {
  series: ColoredSeries[];
};

/**
 * Guard + repair: ensure every series has exactly `axes.length` values,
 * clamped to 0-100. The AI is reliable but this keeps the editor invariant
 * (series.values.length === axes.length) airtight after any edit too.
 */
export function normalizeSpec(spec: ChartSpec): ChartSpec {
  const n = spec.axes.length;
  return {
    ...spec,
    series: spec.series.map((s) => {
      const values = Array.from({ length: n }, (_, i) => {
        const v = s.values[i];
        // Round AI scores to steps of 5: the estimates aren't precise enough
        // to justify a finer scale, and "85 vs 90" reads as an honest claim.
        return round5(clamp(typeof v === "number" && Number.isFinite(v) ? v : 50));
      });
      return { ...s, values };
    }),
  };
}

export function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

/** Round to the nearest multiple of 5 (matches the score granularity). */
export function round5(v: number): number {
  return Math.round(v / 5) * 5;
}
