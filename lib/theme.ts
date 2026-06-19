/**
 * Visual theming for the chart. Kept data-only so both the live SVG and the
 * export path render identically.
 */

export type BackgroundStyle = "solid" | "gradient" | "grid";

export type Theme = {
  id: string;
  name: string;
  mode: "dark" | "light";
  background: string; // base fill
  backgroundAlt: string; // gradient target / grid dot color
  grid: string; // ring + spoke stroke
  axisLabel: string; // axis name text
  tickLabel: string; // ring value text
  title: string;
  subtitle: string;
  watermark: string;
};

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    mode: "dark",
    background: "#0b0d12",
    backgroundAlt: "#161a23",
    grid: "#2a3040",
    axisLabel: "#e7ecf3",
    tickLabel: "#5b6577",
    title: "#ffffff",
    subtitle: "#9aa4b6",
    watermark: "#5b6577",
  },
  {
    id: "paper",
    name: "Paper",
    mode: "light",
    background: "#f7f5f0",
    backgroundAlt: "#ece8df",
    grid: "#d6d0c4",
    axisLabel: "#2a2620",
    tickLabel: "#a59d8e",
    title: "#1a1712",
    subtitle: "#6b6457",
    watermark: "#b3ab9c",
  },
  {
    id: "ink",
    name: "Ink",
    mode: "dark",
    background: "#101013",
    backgroundAlt: "#1b1b20",
    grid: "#33333c",
    axisLabel: "#f2f2f4",
    tickLabel: "#666670",
    title: "#ffffff",
    subtitle: "#9b9ba6",
    watermark: "#666670",
  },
];

/**
 * Curated, high-contrast palettes for series. Picked to stay legible when
 * overlapped semi-transparent on dark or light backgrounds.
 */
export const PALETTES: { id: string; name: string; colors: string[] }[] = [
  {
    id: "vivid",
    name: "Vivid",
    colors: ["#5b8cff", "#ff6b8a", "#ffce5b", "#46d6a5", "#b07cff", "#ff9a52"],
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: ["#ff7a59", "#ffb14e", "#ef476f", "#ffd166", "#c44dff", "#ff5d8f"],
  },
  {
    id: "cool",
    name: "Cool",
    colors: ["#4cc9f0", "#4361ee", "#7209b7", "#3a86ff", "#06d6a0", "#48bfe3"],
  },
  {
    id: "mono",
    name: "Mono",
    colors: ["#9aa4b6", "#5b8cff", "#c8d0dd", "#3a5bd9", "#6b7689", "#aebbd6"],
  },
];

export function colorAt(paletteId: string, index: number): string {
  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  return palette.colors[index % palette.colors.length];
}

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export const ASPECTS = [
  { id: "square", name: "1:1", width: 1080, height: 1080 },
  { id: "portrait", name: "4:5", width: 1080, height: 1350 },
  { id: "landscape", name: "16:9", width: 1600, height: 900 },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

export function aspectById(id: AspectId) {
  return ASPECTS.find((a) => a.id === id) ?? ASPECTS[0];
}
