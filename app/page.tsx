"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { RadarChart } from "@/components/chart/RadarChart";
import { Editor } from "@/components/Editor";
import { ExportPanel, type StyleState } from "@/components/ExportPanel";
import { PromptBar } from "@/components/PromptBar";
import { Button, Card, Segmented } from "@/components/ui/controls";
import { chartReducer, recolor, specToModel } from "@/lib/chartReducer";
import { exportSvgToPng, slugify } from "@/lib/export";
import { SAMPLE_SPEC } from "@/lib/mock";
import { ChartSpecSchema, type ChartSpec } from "@/lib/schema";
import { aspectById, themeById } from "@/lib/theme";
import { loadCurrent, saveCurrent, useRecents } from "@/hooks/useLocalCharts";

const INITIAL_STYLE: StyleState = {
  themeId: "midnight",
  paletteId: "vivid",
  aspectId: "portrait",
  background: "gradient",
  watermark: "@dataviz",
  watermarkOn: true,
  paddingScale: 0.06,
};

export default function Home() {
  const [model, dispatch] = useReducer(chartReducer, undefined, () =>
    specToModel(SAMPLE_SPEC, INITIAL_STYLE.paletteId),
  );
  const [style, setStyle] = useState<StyleState>(INITIAL_STYLE);
  const [tab, setTab] = useState<"edit" | "style">("edit");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const { recents, save, remove } = useRecents();

  // Restore the in-progress chart on first mount.
  useEffect(() => {
    const saved = loadCurrent();
    if (saved) dispatch({ type: "set", model: saved });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change.
  useEffect(() => {
    saveCurrent(model);
  }, [model]);

  const theme = themeById(style.themeId);
  const aspect = aspectById(style.aspectId);

  const handleStyleChange = (patch: Partial<StyleState>) => {
    setStyle((prev) => ({ ...prev, ...patch }));
    if (patch.paletteId && patch.paletteId !== style.paletteId) {
      dispatch({ type: "set", model: recolor(model, patch.paletteId) });
    }
  };

  const handleGenerate = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json()) as { spec?: ChartSpec; error?: string };
      if (!res.ok || !data.spec) {
        throw new Error(data.error ?? "Generation failed.");
      }
      const spec = ChartSpecSchema.parse(data.spec);
      dispatch({ type: "set", model: specToModel(spec, style.paletteId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      await exportSvgToPng(svgRef.current, {
        width: aspect.width,
        height: aspect.height,
        scale: 2,
        fileName: `${slugify(model.title)}.png`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const watermark =
    style.watermarkOn && style.watermark.trim() ? style.watermark : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Radar Chart Studio
          </h1>
          <p className="text-sm text-white/45">
            Describe a topic. Get a publish-ready spider chart.
          </p>
        </div>
      </header>

      <PromptBar onGenerate={handleGenerate} loading={loading} error={error} />

      {recents.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/30">Saved:</span>
          {recents.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 py-1 pl-2.5 pr-1 text-xs text-white/55"
            >
              <button
                className="transition hover:text-white"
                onClick={() => dispatch({ type: "set", model: r.model })}
              >
                {r.title}
              </button>
              <button
                onClick={() => remove(r.id)}
                title="Delete"
                className="rounded-full px-1 text-white/30 hover:text-white/80"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="flex items-center justify-center overflow-hidden p-4 lg:p-6">
          <div className="w-full" style={{ maxWidth: previewMaxWidth(aspect) }}>
            <RadarChart
              ref={svgRef}
              model={model}
              theme={theme}
              width={aspect.width}
              height={aspect.height}
              background={style.background}
              watermark={watermark}
              caveat={model.caveat}
              paddingScale={style.paddingScale}
            />
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <div className="mb-4 flex items-center justify-between">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { id: "edit", label: "Edit" },
                { id: "style", label: "Style & Export" },
              ]}
            />
            {tab === "edit" && (
              <Button
                variant="ghost"
                onClick={() => save(model)}
                className="!px-2.5 !py-1 !text-xs"
              >
                Save
              </Button>
            )}
          </div>

          {tab === "edit" ? (
            <Editor model={model} dispatch={dispatch} paletteId={style.paletteId} />
          ) : (
            <ExportPanel
              style={style}
              onChange={handleStyleChange}
              onExport={handleExport}
              onSave={() => save(model)}
              exporting={exporting}
            />
          )}
        </Card>
      </div>
    </main>
  );
}

/** Keep portrait charts from dominating the column; cap by aspect. */
function previewMaxWidth(aspect: { width: number; height: number }): string {
  return aspect.height > aspect.width ? "440px" : "640px";
}
