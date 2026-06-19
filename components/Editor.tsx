"use client";

import type { Dispatch } from "react";
import type { ChartModel } from "@/lib/schema";
import {
  type ChartAction,
  MAX_AXES,
  MAX_SERIES,
  MIN_AXES,
} from "@/lib/chartReducer";
import {
  Button,
  IconButton,
  SectionTitle,
  Slider,
  TextInput,
} from "@/components/ui/controls";

export function Editor({
  model,
  dispatch,
  paletteId,
}: {
  model: ChartModel;
  dispatch: Dispatch<ChartAction>;
  paletteId: string;
}) {
  return (
    <div className="space-y-6">
      {/* Titles */}
      <section className="space-y-2">
        <SectionTitle>Titles</SectionTitle>
        <TextInput
          value={model.title}
          onChange={(v) => dispatch({ type: "title", value: v })}
          placeholder="Chart title"
        />
        <TextInput
          value={model.subtitle ?? ""}
          onChange={(v) => dispatch({ type: "subtitle", value: v })}
          placeholder="Subtitle (optional)"
        />
      </section>

      {/* Axes */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionTitle>
            Axes ({model.axes.length}/{MAX_AXES})
          </SectionTitle>
          <Button
            variant="subtle"
            onClick={() => dispatch({ type: "addAxis" })}
            disabled={model.axes.length >= MAX_AXES}
            className="!px-2.5 !py-1 !text-xs"
          >
            + Axis
          </Button>
        </div>
        <div className="space-y-1.5">
          {model.axes.map((axis, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <TextInput
                value={axis.label}
                onChange={(v) =>
                  dispatch({ type: "axisLabel", index: i, value: v })
                }
              />
              <IconButton
                title="Remove axis"
                onClick={() => dispatch({ type: "removeAxis", index: i })}
                disabled={model.axes.length <= MIN_AXES}
              >
                ✕
              </IconButton>
            </div>
          ))}
        </div>
      </section>

      {/* Series + values */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>
            Series ({model.series.length}/{MAX_SERIES})
          </SectionTitle>
          <Button
            variant="subtle"
            onClick={() => dispatch({ type: "addSeries", paletteId })}
            disabled={model.series.length >= MAX_SERIES}
            className="!px-2.5 !py-1 !text-xs"
          >
            + Series
          </Button>
        </div>

        {model.series.map((s, si) => (
          <div
            key={si}
            className="rounded-xl border border-white/10 bg-black/20 p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <label
                className="relative h-5 w-5 shrink-0 cursor-pointer rounded-md ring-1 ring-white/15"
                style={{ background: s.color }}
                title="Series color"
              >
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) =>
                    dispatch({
                      type: "seriesColor",
                      index: si,
                      value: e.target.value,
                    })
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <TextInput
                value={s.name}
                onChange={(v) =>
                  dispatch({ type: "seriesName", index: si, value: v })
                }
              />
              <IconButton
                title="Remove series"
                onClick={() => dispatch({ type: "removeSeries", index: si })}
                disabled={model.series.length <= 1}
              >
                ✕
              </IconButton>
            </div>

            <div className="space-y-2">
              {model.axes.map((axis, ai) => (
                <div key={ai} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs text-white/55">
                    {axis.label}
                  </span>
                  <Slider
                    value={s.values[ai] ?? 0}
                    color={s.color}
                    step={5}
                    onChange={(v) =>
                      dispatch({
                        type: "value",
                        series: si,
                        axis: ai,
                        value: v,
                      })
                    }
                  />
                  <span className="w-8 shrink-0 text-right text-xs tabular-nums text-white/70">
                    {s.values[ai] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {model.caveat && (
        <p className="text-xs leading-relaxed text-white/35">{model.caveat}</p>
      )}
    </div>
  );
}
