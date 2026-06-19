import type { ChartSpec } from "@/lib/schema";

/** Sample spec used as the initial canvas before the user generates anything. */
export const SAMPLE_SPEC: ChartSpec = {
  title: "Espresso vs Matcha",
  subtitle: "Two ways to caffeinate, compared",
  axes: [
    { label: "Caffeine" },
    { label: "Antioxidants" },
    { label: "Calm Energy" },
    { label: "Ritual" },
    { label: "Accessibility" },
    { label: "Bitterness" },
  ],
  series: [
    { name: "Espresso", values: [88, 45, 30, 70, 92, 75] },
    { name: "Matcha", values: [55, 90, 85, 80, 58, 50] },
  ],
  caveat: "Scores are AI-assisted estimates and editable.",
};
