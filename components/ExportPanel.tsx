"use client";

import {
  ASPECTS,
  type AspectId,
  type BackgroundStyle,
  PALETTES,
  THEMES,
} from "@/lib/theme";
import {
  Button,
  SectionTitle,
  Segmented,
  Slider,
  TextInput,
} from "@/components/ui/controls";

export type StyleState = {
  themeId: string;
  paletteId: string;
  aspectId: AspectId;
  background: BackgroundStyle;
  watermark: string;
  watermarkOn: boolean;
  paddingScale: number;
};

export function ExportPanel({
  style,
  onChange,
  onExport,
  onSave,
  exporting,
}: {
  style: StyleState;
  onChange: (patch: Partial<StyleState>) => void;
  onExport: () => void;
  onSave: () => void;
  exporting: boolean;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <SectionTitle>Theme</SectionTitle>
        <Segmented
          value={style.themeId}
          onChange={(themeId) => onChange({ themeId })}
          options={THEMES.map((t) => ({ id: t.id, label: t.name }))}
        />
      </section>

      <section className="space-y-2">
        <SectionTitle>Palette</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ paletteId: p.id })}
              title={p.name}
              className={`flex items-center gap-1 rounded-lg border p-1.5 transition ${
                style.paletteId === p.id
                  ? "border-white/60"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {p.colors.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="h-4 w-4 rounded-full"
                  style={{ background: c }}
                />
              ))}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <SectionTitle>Background</SectionTitle>
        <Segmented<BackgroundStyle>
          value={style.background}
          onChange={(background) => onChange({ background })}
          options={[
            { id: "solid", label: "Solid" },
            { id: "gradient", label: "Gradient" },
            { id: "grid", label: "Dots" },
          ]}
        />
      </section>

      <section className="space-y-2">
        <SectionTitle>Aspect (Twitter)</SectionTitle>
        <Segmented<AspectId>
          value={style.aspectId}
          onChange={(aspectId) => onChange({ aspectId })}
          options={ASPECTS.map((a) => ({ id: a.id, label: a.name }))}
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionTitle>Padding</SectionTitle>
          <span className="text-xs tabular-nums text-white/50">
            {Math.round(style.paddingScale * 100)}%
          </span>
        </div>
        <Slider
          min={3}
          max={11}
          value={Math.round(style.paddingScale * 100)}
          onChange={(v) => onChange({ paddingScale: v / 100 })}
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionTitle>Watermark</SectionTitle>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-white/55">
            <input
              type="checkbox"
              checked={style.watermarkOn}
              onChange={(e) => onChange({ watermarkOn: e.target.checked })}
              className="h-3.5 w-3.5 accent-white"
            />
            Show
          </label>
        </div>
        <TextInput
          value={style.watermark}
          onChange={(watermark) => onChange({ watermark })}
          placeholder="@yourhandle"
        />
      </section>

      <div className="flex gap-2 pt-1">
        <Button onClick={onExport} disabled={exporting} className="flex-1">
          {exporting ? "Exporting…" : "Export PNG"}
        </Button>
        <Button variant="subtle" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
