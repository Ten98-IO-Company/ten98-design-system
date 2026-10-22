// Internal chart geometry (not exported from the package index).
// Pure functions ported from d3 (ISC, Copyright 2010-2023 Mike Bostock; see THIRD_PARTY_NOTICES.md),
// adapted to strict TypeScript. No d3 package is a dependency.

export type ChartValue = number | null;

const e10 = Math.sqrt(50);
const e5 = Math.sqrt(10);
const e2 = Math.sqrt(2);

// Ported from d3-array v3.2.4 src/ticks.js (tickSpec).
function tickSpec(start: number, stop: number, count: number): [number, number, number] {
  const step = (stop - start) / Math.max(0, count);
  const power = Math.floor(Math.log10(step));
  const error = step / Math.pow(10, power);
  const factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  let i1: number;
  let i2: number;
  let inc: number;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start) ++i1;
    if (i2 / inc > stop) --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start) ++i1;
    if (i2 * inc > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
  return [i1, i2, inc];
}

// Ported from d3-array v3.2.4 src/ticks.js (default export).
export function ticks(start: number, stop: number, count: number): number[] {
  if (!(count > 0)) return [];
  if (start === stop) return [start];
  const reverse = stop < start;
  const [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1;
  const result = new Array<number>(n);
  for (let i = 0; i < n; ++i) {
    const index = reverse ? i2 - i : i1 + i;
    result[i] = inc < 0 ? index / -inc : index * inc;
  }
  return result;
}

// Ported from d3-array v3.2.4 src/ticks.js (tickIncrement).
export function tickIncrement(start: number, stop: number, count: number): number {
  return tickSpec(start, stop, count)[2];
}

// Ported from d3-scale v4.0.2 src/linear.js (linearish nice): extend a domain to round tick steps.
export function niceDomain(domain: readonly [number, number], count = 10): [number, number] {
  let [start, stop] = domain;
  const flipped = stop < start;
  if (flipped) [start, stop] = [stop, start];
  if (start === stop || !Number.isFinite(start + stop)) return [domain[0], domain[1]];
  let previous: number | undefined;
  for (let iteration = 0; iteration < 10; iteration++) {
    const step = tickIncrement(start, stop, count);
    if (step === previous) break;
    if (step > 0) {
      start = Math.floor(start / step) * step;
      stop = Math.ceil(stop / step) * step;
    } else if (step < 0) {
      start = Math.ceil(start * step) / step;
      stop = Math.floor(stop * step) / step;
    } else break;
    previous = step;
  }
  return flipped ? [stop, start] : [start, stop];
}

// Ported from d3-scale v4.0.2 src/linear.js (continuous scale). Null in, null out: a missing value is never drawn as 0.
export function linearScale(domain: readonly [number, number], range: readonly [number, number]): (value: ChartValue) => number | null {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  return value => {
    if (value === null || !Number.isFinite(value)) return null;
    return span === 0 ? (r0 + r1) / 2 : r0 + (value - d0) / span * (r1 - r0);
  };
}

export interface BandScale { step: number; bandwidth: number; start: (index: number) => number }
export interface BandOptions { paddingInner?: number; paddingOuter?: number; align?: number }

// Ported from d3-scale v4.0.2 src/band.js (rescale): step, bandwidth, padding and alignment; rounding and reversed ranges are omitted.
export function bandScale(count: number, range: readonly [number, number], options: BandOptions = {}): BandScale {
  const paddingInner = Math.min(1, options.paddingInner ?? 0);
  const paddingOuter = options.paddingOuter ?? 0;
  const align = Math.max(0, Math.min(1, options.align ?? 0.5));
  const [r0, r1] = range;
  const step = (r1 - r0) / Math.max(1, count - paddingInner + paddingOuter * 2);
  const first = r0 + (r1 - r0 - step * (count - paddingInner)) * align;
  return { step, bandwidth: step * (1 - paddingInner), start: index => first + step * index };
}

// Ported from d3-shape v3.2.0 src/offset/diverging.js: positive extents stack up from 0, negative extents stack down from 0.
// Input is series x points; a null value yields a null extent so the caller can mark it unavailable instead of drawing 0.
export function stackSigned(series: readonly (readonly ChartValue[])[]): ([number, number] | null)[][] {
  const result = series.map(values => values.map((): [number, number] | null => null));
  const points = Math.max(0, ...series.map(values => values.length));
  for (let j = 0; j < points; j++) {
    let positive = 0;
    let negative = 0;
    for (let i = 0; i < series.length; i++) {
      const value = series[i][j];
      if (value === null || value === undefined || !Number.isFinite(value)) continue;
      if (value > 0) {
        result[i][j] = [positive, positive += value];
      } else if (value < 0) {
        const top = negative;
        result[i][j] = [negative += value, top];
      } else {
        result[i][j] = [0, 0];
      }
    }
  }
  return result;
}

// Idea from d3-shape v3.2.0 src/line.js (defined): split a series at missing values so a gap is drawn as a gap.
export function segments<T>(items: readonly T[], defined: (item: T, index: number) => boolean): { index: number; item: T }[][] {
  const runs: { index: number; item: T }[][] = [];
  let run: { index: number; item: T }[] = [];
  items.forEach((item, index) => {
    if (defined(item, index)) run.push({ index, item });
    else if (run.length) { runs.push(run); run = []; }
  });
  if (run.length) runs.push(run);
  return runs;
}

const tau = 2 * Math.PI;
const epsilon = 1e-6;
const fixed = (value: number) => Number(value.toFixed(3));

// Reduced from d3-shape v3.2.0 src/arc.js: no corner radius or pad angle. Angles are radians clockwise from 12 o'clock,
// centred on the origin. A full turn is two arcs because one arc cannot start and end at the same point.
export function arcPath(r0: number, r1: number, a0: number, a1: number): string {
  const inner = Math.max(0, Math.min(r0, r1));
  const outer = Math.max(r0, r1);
  const sweep = Math.min(Math.abs(a1 - a0), tau);
  if (!(outer > 0) || !(sweep > epsilon)) return '';
  const point = (radius: number, angle: number) => `${fixed(radius * Math.sin(angle))} ${fixed(-radius * Math.cos(angle))}`;
  if (sweep > tau - epsilon) {
    const ring = (radius: number) => `M${fixed(radius)} 0A${fixed(radius)} ${fixed(radius)} 0 1 1 ${fixed(-radius)} 0A${fixed(radius)} ${fixed(radius)} 0 1 1 ${fixed(radius)} 0Z`;
    return inner > epsilon ? `${ring(outer)}${ring(inner)}` : ring(outer);
  }
  const start = Math.min(a0, a1);
  const end = start + sweep;
  const large = sweep > Math.PI ? 1 : 0;
  const outerArc = `M${point(outer, start)}A${fixed(outer)} ${fixed(outer)} 0 ${large} 1 ${point(outer, end)}`;
  return inner > epsilon
    ? `${outerArc}L${point(inner, end)}A${fixed(inner)} ${fixed(inner)} 0 ${large} 0 ${point(inner, start)}Z`
    : `${outerArc}L0 0Z`;
}

/** Smallest and largest of the values, or null when there are none. A loop, not Math.min(...values): spreading more than
 * about 125k arguments overflows the call stack. */
export function extent(values: readonly number[]): [number, number] | null {
  if (values.length === 0) return null;
  let low = values[0], high = values[0];
  for (let i = 1; i < values.length; i++) { const value = values[i]; if (value < low) low = value; if (value > high) high = value; }
  return [low, high];
}

