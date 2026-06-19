# Radar Chart Studio

Describe a topic, and an LLM researches it (with live web search), picks 5–8 axes,
scores the subjects, and renders a polished, Twitter-ready radar chart you can
tweak and export as a high-resolution PNG.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your API key
npm run dev                  # http://localhost:3000
```

## Configuration (`.env.local`)

The AI provider is pluggable via `AI_PROVIDER`:

| Provider             | Set `AI_PROVIDER` | Required key        | Model override   | Default model           |
| -------------------- | ----------------- | ------------------- | ---------------- | ----------------------- |
| Gemini (default)     | `gemini`          | `GEMINI_API_KEY`    | `GEMINI_MODEL`   | `gemini-3.1-pro-preview`|
| Anthropic            | `anthropic`       | `ANTHROPIC_API_KEY` | `CHART_MODEL`    | `claude-sonnet-4-6`     |

Both use a two-phase flow: phase 1 grounds the research with the provider's web /
Google Search tool; phase 2 emits JSON validated against the Zod `ChartSpecSchema`.

## How it works

- **`app/api/generate/route.ts`** — thin handler; delegates to the provider layer.
- **`lib/ai/*`** — `gemini.ts` and `anthropic.ts` providers behind `index.ts` (selected by `AI_PROVIDER`).
- **`lib/schema.ts`** — the single `ChartSpec` contract (Zod) shared by server + client.
- **`components/chart/RadarChart.tsx`** — hand-rolled native SVG (no `foreignObject`), themeable.
- **`lib/export.ts`** — serializes the SVG at 2× and rasterizes to PNG (system fonts → no embedding, no canvas taint).
- **`lib/chartReducer.ts`** + **`components/Editor.tsx`** — live editing of title, axes, series, and per-axis scores.
- **`hooks/useLocalCharts.ts`** — localStorage: restores the working chart on refresh and keeps saved snapshots.

No database, no auth — charts live in the browser.

## Export

Aspect presets are tuned for Twitter: **1:1** (1080²), **4:5** portrait (1080×1350),
**16:9** (1600×900). Exported at 2× as PNG, with configurable padding and an
optional `@handle` watermark.
