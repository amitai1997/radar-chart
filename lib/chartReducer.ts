import type { ChartModel, ChartSpec, ColoredSeries } from "@/lib/schema";
import { clamp } from "@/lib/schema";
import { colorAt } from "@/lib/theme";

export const MIN_AXES = 3;
export const MAX_AXES = 10;
export const MAX_SERIES = 6;

/** Turn an AI-produced spec into an editable, colored model. */
export function specToModel(spec: ChartSpec, paletteId: string): ChartModel {
  return {
    ...spec,
    series: spec.series.map((s, i) => ({
      ...s,
      color: colorAt(paletteId, i),
    })),
  };
}

/** Reassign every series color from a palette (used when the palette changes). */
export function recolor(model: ChartModel, paletteId: string): ChartModel {
  return {
    ...model,
    series: model.series.map((s, i) => ({ ...s, color: colorAt(paletteId, i) })),
  };
}

export type ChartAction =
  | { type: "set"; model: ChartModel }
  | { type: "title"; value: string }
  | { type: "subtitle"; value: string }
  | { type: "axisLabel"; index: number; value: string }
  | { type: "addAxis" }
  | { type: "removeAxis"; index: number }
  | { type: "value"; series: number; axis: number; value: number }
  | { type: "addSeries"; paletteId: string }
  | { type: "removeSeries"; index: number }
  | { type: "seriesName"; index: number; value: string }
  | { type: "seriesColor"; index: number; value: string };

export function chartReducer(
  state: ChartModel,
  action: ChartAction,
): ChartModel {
  switch (action.type) {
    case "set":
      return action.model;

    case "title":
      return { ...state, title: action.value };

    case "subtitle":
      return { ...state, subtitle: action.value };

    case "axisLabel":
      return {
        ...state,
        axes: state.axes.map((a, i) =>
          i === action.index ? { ...a, label: action.value } : a,
        ),
      };

    case "addAxis": {
      if (state.axes.length >= MAX_AXES) return state;
      return {
        ...state,
        axes: [...state.axes, { label: `Axis ${state.axes.length + 1}` }],
        series: state.series.map((s) => ({ ...s, values: [...s.values, 50] })),
      };
    }

    case "removeAxis": {
      if (state.axes.length <= MIN_AXES) return state;
      return {
        ...state,
        axes: state.axes.filter((_, i) => i !== action.index),
        series: state.series.map((s) => ({
          ...s,
          values: s.values.filter((_, i) => i !== action.index),
        })),
      };
    }

    case "value":
      return {
        ...state,
        series: state.series.map((s, si) =>
          si === action.series
            ? {
                ...s,
                values: s.values.map((v, ai) =>
                  ai === action.axis ? clamp(Math.round(action.value)) : v,
                ),
              }
            : s,
        ),
      };

    case "addSeries": {
      if (state.series.length >= MAX_SERIES) return state;
      const next: ColoredSeries = {
        name: `Series ${state.series.length + 1}`,
        values: state.axes.map(() => 50),
        color: colorAt(action.paletteId, state.series.length),
      };
      return { ...state, series: [...state.series, next] };
    }

    case "removeSeries": {
      if (state.series.length <= 1) return state;
      return {
        ...state,
        series: state.series.filter((_, i) => i !== action.index),
      };
    }

    case "seriesName":
      return {
        ...state,
        series: state.series.map((s, i) =>
          i === action.index ? { ...s, name: action.value } : s,
        ),
      };

    case "seriesColor":
      return {
        ...state,
        series: state.series.map((s, i) =>
          i === action.index ? { ...s, color: action.value } : s,
        ),
      };

    default:
      return state;
  }
}
