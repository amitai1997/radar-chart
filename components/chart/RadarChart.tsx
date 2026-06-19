import { forwardRef } from "react";
import type { ChartModel } from "@/lib/schema";
import type { BackgroundStyle, Theme } from "@/lib/theme";
import {
  axisAngle,
  axisPoint,
  gridRing,
  labelAnchor,
  polar,
  seriesPolygon,
  valuePoint,
} from "@/lib/geometry";

export type RadarChartProps = {
  model: ChartModel;
  theme: Theme;
  width: number;
  height: number;
  background?: BackgroundStyle;
  watermark?: string; // empty/undefined => hidden
  caveat?: string; // source / estimate disclaimer, rendered bottom-left
  fontFamily?: string;
  /** Extra outer margin as a fraction of the smaller dimension. */
  paddingScale?: number;
};

const RING_RATIOS = [0.25, 0.5, 0.75, 1];
const FILL_ALPHA = "2e"; // ~18%

/**
 * Hand-rolled, fully native SVG radar chart (no foreignObject / HTML), so the
 * same markup renders in the browser and rasterizes cleanly to PNG.
 */
export const RadarChart = forwardRef<SVGSVGElement, RadarChartProps>(
  function RadarChart(
    {
      model,
      theme,
      width: W,
      height: H,
      background = "solid",
      watermark,
      caveat,
      fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif",
      paddingScale = 0.06,
    },
    ref,
  ) {
    const min = Math.min(W, H);
    const m = Math.round(min * paddingScale);

    // Shrink title/subtitle to fit the available width (one line, never clipped).
    const fitFont = (text: string, base: number, maxW: number) => {
      const est = text.length * base * 0.56;
      return est > maxW ? Math.max(base * 0.5, (base * maxW) / est) : base;
    };
    const titleFont = Math.round(fitFont(model.title, min * 0.05, W - 2 * m));
    const subtitleFont = Math.round(
      fitFont(model.subtitle?.trim() ?? "", min * 0.026, W - 2 * m),
    );
    const axisFont = Math.round(min * 0.024);
    const tickFont = Math.round(min * 0.016);
    const legendFont = Math.round(min * 0.024);

    const hasSubtitle = !!model.subtitle?.trim();
    const topReserved =
      m + titleFont + (hasSubtitle ? subtitleFont * 1.8 : 0) + titleFont * 0.6;

    // Legend layout (greedy wrap into rows).
    const legend = layoutLegend(model.series, legendFont, W - 2 * m);
    const legendRowH = legendFont * 1.7;
    const bottomReserved = m + legend.rows.length * legendRowH + legendFont;

    // Wrap long axis labels onto multiple lines so they never overflow the
    // canvas width. Gutters are sized to the longest *wrapped line* and to the
    // tallest label (line count), so the radius shrinks to leave exact room.
    const maxLineW = W * 0.24;
    const axisLines = model.axes.map((a) => wrapLabel(a.label, maxLineW, axisFont));
    const lineW = (s: string) => s.length * axisFont * 0.55;
    const longestLineW = Math.max(0, ...axisLines.flat().map(lineW));
    const maxLines = Math.max(1, ...axisLines.map((l) => l.length));
    const sideGutter = Math.min(longestLineW + axisFont * 0.6, W * 0.28);
    const vertGutter = axisFont * (1 + maxLines);

    const bandH = H - bottomReserved - topReserved;
    // hPad: outer margin and label clearance share the same space — take the max, not sum.
    const hPad = Math.max(m, sideGutter);
    const radiusH = (W - 2 * hPad) / 2;
    const radiusV = (bandH - 2 * vertGutter) / 2;
    const radius = Math.max(40, Math.min(radiusH, radiusV));
    const cx = W / 2;
    const cy = topReserved + bandH / 2;

    const n = model.axes.length;
    const strokeW = Math.max(1.5, min * 0.0038);
    const dotR = strokeW * 1.7;

    const legendStartY = H - bottomReserved + legendFont * 0.4;

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", maxWidth: "100%", height: "auto" }}
        fontFamily={fontFamily}
      >
        <defs>
          <linearGradient id="rc-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.backgroundAlt} />
            <stop offset="100%" stopColor={theme.background} />
          </linearGradient>
          <pattern
            id="rc-dots"
            width={Math.round(min * 0.04)}
            height={Math.round(min * 0.04)}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={2}
              cy={2}
              r={1.4}
              fill={theme.backgroundAlt}
            />
          </pattern>
        </defs>

        {/* Background */}
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill={background === "gradient" ? "url(#rc-bg)" : theme.background}
        />
        {background === "grid" && (
          <rect x={0} y={0} width={W} height={H} fill="url(#rc-dots)" />
        )}

        {/* Grid rings */}
        {RING_RATIOS.map((ratio) => (
          <polygon
            key={ratio}
            points={gridRing(cx, cy, radius, ratio, n)}
            fill="none"
            stroke={theme.grid}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        ))}

        {/* Spokes */}
        {model.axes.map((_, i) => {
          const p = axisPoint(cx, cy, radius, i, n);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={theme.grid}
              strokeWidth={1}
            />
          );
        })}

        {/* Ring tick labels (subtle, along the up spoke, nudged left) */}
        {RING_RATIOS.map((ratio) => {
          const p = polar(cx, cy, radius * ratio, -Math.PI / 2);
          return (
            <text
              key={ratio}
              x={p.x - 6}
              y={p.y + tickFont * 0.35}
              textAnchor="end"
              fontSize={tickFont}
              fill={theme.tickLabel}
            >
              {ratio * 100}
            </text>
          );
        })}

        {/* Series (polygon + vertices), one group each for a staggered fade-in */}
        {model.series.map((s, si) => (
          <g
            key={si}
            className="rc-series"
            style={{ animationDelay: `${si * 0.12}s` }}
          >
            <polygon
              points={seriesPolygon(cx, cy, radius, s.values)}
              fill={`${s.color}${FILL_ALPHA}`}
              stroke={s.color}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {s.values.map((v, i) => {
              const p = valuePoint(cx, cy, radius, i, n, v);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={dotR}
                  fill={s.color}
                  stroke={theme.background}
                  strokeWidth={dotR * 0.4}
                />
              );
            })}
          </g>
        ))}

        {/* Vertex value labels — only for 1–2 series (more would be noise).
            Labels are offset *perpendicular* to each spoke so they sit beside
            the vertex rather than along it. Series 0 goes to the left of the
            spoke (CCW), series 1 to the right (CW). This means:
            - The two series labels are always side-by-side, never stacked.
            - Labels never ride the spoke line toward the axis label text. */}
        {model.series.length <= 2 &&
          model.series.map((s, si) => {
            const valueFont = Math.round(min * 0.019);
            const perpOff = valueFont * 1.1 + dotR;
            const radialOff = dotR * 2.2;
            return (
              <g key={`v${si}`}>
                {s.values.map((v, i) => {
                  const angle = axisAngle(i, n);
                  const p = valuePoint(cx, cy, radius, i, n, v);
                  const cos = Math.cos(angle);
                  const sin = Math.sin(angle);
                  // Perpendicular to spoke: (-sin, cos) CCW / (sin, -cos) CW
                  const side = si === 0 ? 1 : -1;
                  const x = p.x - cos * radialOff + (-sin) * perpOff * side;
                  const y = p.y - sin * radialOff + cos * perpOff * side + valueFont * 0.34;
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fontSize={valueFont}
                      fontWeight={700}
                      fill={s.color}
                      stroke={theme.background}
                      strokeWidth={valueFont * 0.16}
                      paintOrder="stroke"
                    >
                      {Math.round(v)}
                    </text>
                  );
                })}
              </g>
            );
          })}

        {/* Axis labels (multiline, vertically centered on the rim point) */}
        {model.axes.map((_, i) => {
          const angle = axisAngle(i, n);
          const p = polar(cx, cy, radius, angle);
          const { anchor, dx, dy } = labelAnchor(angle);
          const lines = axisLines[i];
          const lineH = axisFont * 1.15;
          const startY = p.y + dy - ((lines.length - 1) * lineH) / 2;
          return (
            <text
              key={i}
              x={p.x + dx}
              y={startY}
              textAnchor={anchor}
              fontSize={axisFont}
              fontWeight={600}
              fill={theme.axisLabel}
            >
              {lines.map((ln, li) => (
                <tspan key={li} x={p.x + dx} dy={li === 0 ? 0 : lineH}>
                  {ln}
                </tspan>
              ))}
            </text>
          );
        })}

        {/* Title + subtitle */}
        <text
          x={W / 2}
          y={m + titleFont}
          textAnchor="middle"
          fontSize={titleFont}
          fontWeight={800}
          fill={theme.title}
        >
          {model.title}
        </text>
        {hasSubtitle && (
          <text
            x={W / 2}
            y={m + titleFont + subtitleFont * 1.4}
            textAnchor="middle"
            fontSize={subtitleFont}
            fill={theme.subtitle}
          >
            {model.subtitle}
          </text>
        )}

        {/* Legend */}
        {legend.rows.map((row, ri) =>
          row.items.map((item) => {
            const y = legendStartY + ri * legendRowH;
            const sw = legendFont * 0.8;
            return (
              <g key={`${ri}-${item.index}`}>
                <rect
                  x={row.startX + item.offsetX}
                  y={y - sw * 0.75}
                  width={sw}
                  height={sw}
                  rx={sw * 0.25}
                  fill={model.series[item.index].color}
                />
                <text
                  x={row.startX + item.offsetX + sw + legendFont * 0.35}
                  y={y}
                  fontSize={legendFont}
                  fill={theme.axisLabel}
                >
                  {item.name}
                </text>
              </g>
            );
          }),
        )}

        {/* Caveat / source footer (bottom-left), shrunk to fit beside the watermark */}
        {caveat?.trim() &&
          (() => {
            const captionFont = Math.round(min * 0.018);
            const wmRoom = watermark?.trim() ? W * 0.2 : 0;
            const maxW = W - 2 * m - wmRoom;
            const font = Math.round(fitFont(caveat, captionFont, maxW));
            return (
              <text
                x={m}
                y={H - m * 0.5}
                textAnchor="start"
                fontSize={font}
                fill={theme.tickLabel}
              >
                {caveat}
              </text>
            );
          })()}

        {/* Watermark */}
        {watermark?.trim() && (
          <text
            x={W - m}
            y={H - m * 0.5}
            textAnchor="end"
            fontSize={Math.round(min * 0.02)}
            fontWeight={600}
            fill={theme.watermark}
          >
            {watermark}
          </text>
        )}
      </svg>
    );
  },
);

/**
 * Greedy word-wrap an axis label into lines that each fit `maxW` pixels.
 * Width is approximated from character count (no DOM measurement); a single
 * word longer than the budget is kept on its own line rather than broken.
 */
function wrapLabel(text: string, maxW: number, font: number): string[] {
  const maxChars = Math.max(6, Math.floor(maxW / (font * 0.55)));
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (candidate.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [text];
}

type LegendItem = { index: number; name: string; offsetX: number };
type LegendRow = { items: LegendItem[]; startX: number; width: number };

/**
 * Greedy legend layout: estimate each item's width (swatch + text), wrap into
 * rows that fit `maxWidth`, and center each row. Text width is approximated
 * (no DOM measurement) which is plenty accurate for short series names.
 */
function layoutLegend(
  series: { name: string }[],
  font: number,
  maxWidth: number,
): { rows: LegendRow[] } {
  const swatch = font * 0.8;
  const gap = font * 1.4;
  const itemWidth = (name: string) =>
    swatch + font * 0.35 + name.length * font * 0.56;

  const rows: { index: number; name: string; w: number }[][] = [[]];
  let cur = 0;
  let curW = 0;
  series.forEach((s, index) => {
    const w = itemWidth(s.name);
    const add = (rows[cur].length ? gap : 0) + w;
    if (curW + add > maxWidth && rows[cur].length) {
      cur += 1;
      rows[cur] = [];
      curW = 0;
    }
    rows[cur].push({ index, name: s.name, w });
    curW += (rows[cur].length > 1 ? gap : 0) + w;
  });

  return {
    rows: rows.map((row) => {
      const totalW =
        row.reduce((acc, it) => acc + it.w, 0) + gap * (row.length - 1);
      const startX = (maxWidth - totalW) / 2;
      let offset = 0;
      const items: LegendItem[] = row.map((it) => {
        const item = { index: it.index, name: it.name, offsetX: offset };
        offset += it.w + gap;
        return item;
      });
      return { items, startX, width: totalW };
    }),
  };
}
