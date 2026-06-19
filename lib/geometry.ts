/**
 * Pure polar geometry for the radar chart. No DOM, no React — trivially
 * testable. Axis 0 points straight up; axes are laid out clockwise.
 */

export type Point = { x: number; y: number };

/** Angle (radians) for axis `i` of `n`, with axis 0 at the top (-90deg). */
export function axisAngle(i: number, n: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n;
}

/** Point at radius `r` along axis `i`. */
export function polar(cx: number, cy: number, r: number, angle: number): Point {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** The outer vertex of axis `i` (the rim). */
export function axisPoint(
  cx: number,
  cy: number,
  radius: number,
  i: number,
  n: number,
): Point {
  return polar(cx, cy, radius, axisAngle(i, n));
}

/** The data point for a value (0-100) on axis `i`. */
export function valuePoint(
  cx: number,
  cy: number,
  radius: number,
  i: number,
  n: number,
  value: number,
): Point {
  return polar(cx, cy, (radius * value) / 100, axisAngle(i, n));
}

/** Build the closed polygon points string for a series' values. */
export function seriesPolygon(
  cx: number,
  cy: number,
  radius: number,
  values: number[],
): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const p = valuePoint(cx, cy, radius, i, n, v);
      return `${round(p.x)},${round(p.y)}`;
    })
    .join(" ");
}

/** Concentric grid ring as a polygon points string (matches the axis shape). */
export function gridRing(
  cx: number,
  cy: number,
  radius: number,
  ratio: number,
  n: number,
): string {
  return Array.from({ length: n }, (_, i) => {
    const p = polar(cx, cy, radius * ratio, axisAngle(i, n));
    return `${round(p.x)},${round(p.y)}`;
  }).join(" ");
}

/**
 * Text anchor + a small outward offset for an axis label, chosen by which
 * quadrant the axis points into so labels never sit on top of the rim.
 */
export function labelAnchor(angle: number): {
  anchor: "start" | "middle" | "end";
  dx: number;
  dy: number;
} {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const anchor: "start" | "middle" | "end" =
    Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
  return {
    anchor,
    dx: round(cos * 14),
    dy: round(sin * 14) + 4, // +4 nudges for vertical text centering
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
