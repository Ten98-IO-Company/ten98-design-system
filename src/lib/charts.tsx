'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './primitives.js';
import { StatusLine } from './controls.js';
import { VisuallyHidden } from './structure.js';
import { arcPath, bandScale, extent, linearScale, niceDomain, segments, stackSigned, ticks, type ChartValue } from './chart-scale.js';

// Presentation only: applications compute the data. A null or unavailable value is never drawn as 0.

export type { ChartValue };
export type ChartTone = 1 | 2 | 3 | 4 | 5;
export type ChartPointState = 'observed' | 'partial' | 'unavailable';

export interface ChartPoint {
  x: number;
  /** Text shown on the axis, in the announcement and in the data table. */
  xLabel: string;
  y: ChartValue;
  state?: ChartPointState;
  /** Extra exact context for this point, shown in the data table. */
  note?: string;
  /** Hover text for this point's mark; defaults to "label · series: value". */
  title?: string;
}

export interface ChartSeries {
  id: string;
  label: string;
  points: readonly ChartPoint[];
  /** A comparison series is outlined, not filled. */
  role?: 'primary' | 'comparison';
  /** Palette slot 1-5; defaults to the series position. */
  tone?: ChartTone;
  /** The whole series could not be obtained. */
  unavailable?: boolean;
}

export interface ChartTableColumn { header: string; values: readonly ReactNode[] }

// Building an Intl.NumberFormat is far slower than formatting with one, so the default formatter is made once.
const plainFormat = new Intl.NumberFormat('en');
const plain = (value: number) => plainFormat.format(value);
const toneOf = (series: ChartSeries, index: number): ChartTone => series.tone ?? ((index % 5) + 1) as ChartTone;
const toneColor = (tone: ChartTone) => `var(--t98-chart-${tone})`;
const DASHES = ['', '7 4', '2 4', '10 4 2 4', '1 5'];
/** Per-tone SVG fills with a non-colour overlay (hatch, dots, stripes), referenced as `url(#${uid}-p${tone})`. */
function tonePatterns(uid: string) {
  return ([1, 2, 3, 4, 5] as ChartTone[]).map(tone => {
    const overlay = [null, 'M-2 2L2 -2M0 8L8 0M6 10L10 6', null, 'M0 3H8M0 7H8', 'M0 0L8 8M8 0L0 8'][tone - 1];
    return <pattern key={tone} id={`${uid}-p${tone}`} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" style={{ fill: toneColor(tone) }} />
      {overlay && <path d={overlay} className="t98-chart-pattern-line" />}
      {tone === 3 && <circle cx="4" cy="4" r="1.3" className="t98-chart-pattern-dot" />}
    </pattern>;
  });
}

function valueOf(series: ChartSeries, index: number): { value: number | null; state: ChartPointState } {
  const point = series.points[index];
  if (series.unavailable || !point || point.state === 'unavailable' || point.y === null || !Number.isFinite(point.y)) return { value: null, state: 'unavailable' };
  return { value: point.y, state: point.state ?? 'observed' };
}

function ChartMarker({ shape, x, y, tone }: { shape: number; x: number; y: number; tone: ChartTone }) {
  const style: CSSProperties = { stroke: toneColor(tone) };
  const r = 4;
  switch (shape % 5) {
    case 1: return <rect className="t98-chart-marker" x={x - r} y={y - r} width={2 * r} height={2 * r} style={style} />;
    case 2: return <polygon className="t98-chart-marker" points={`${x},${y - r - 1} ${x + r + 1},${y} ${x},${y + r + 1} ${x - r - 1},${y}`} style={style} />;
    case 3: return <polygon className="t98-chart-marker" points={`${x},${y - r - 1} ${x + r + 1},${y + r} ${x - r - 1},${y + r}`} style={style} />;
    case 4: return <path className="t98-chart-marker t98-chart-marker--cross" d={`M${x - r} ${y - r}L${x + r} ${y + r}M${x + r} ${y - r}L${x - r} ${y + r}`} style={style} />;
    default: return <circle className="t98-chart-marker" cx={x} cy={y} r={r} style={style} />;
  }
}

function SwatchKey({ series, index }: { series: ChartSeries; index: number }) {
  const tone = toneOf(series, index);
  return <svg className="t98-chart-key" width="30" height="14" viewBox="0 0 30 14" aria-hidden="true" focusable="false">
    <line x1="1" x2="29" y1="7" y2="7" className="t98-chart-key-line" strokeDasharray={DASHES[index % 5] || undefined} style={{ stroke: toneColor(tone) }} />
    <ChartMarker shape={index} x={15} y={7} tone={tone} />
  </svg>;
}

interface ChartFrameProps {
  label: string;
  context?: ReactNode;
  summary: ReactNode;
  summaryId: string;
  statsId: string;
  stats: string;
  notice?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: ReactNode;
  legend?: ReactNode;
  tableLabel: string;
  /** The data table, or a function that builds it; a function is only called once the table is opened when there are many rows. */
  table: ReactNode | (() => ReactNode);
  /** Row count, so very long tables are built on first open instead of on every render. */
  rows?: number;
  children: ReactNode;
}

/** Up to this many rows the table is always in the document (searchable without opening it); beyond it, it is built on open. */
const EAGER_TABLE_ROWS = 500;

/** Shared chart chrome: caption, application summary, computed statistics, state messages, legend and a data table with every point. */
function ChartFrame({ label, context, summary, summaryId, statsId, stats, notice, loading, empty, emptyMessage, legend, tableLabel, table, rows = 0, children }: ChartFrameProps) {
  const [tableOpen, setTableOpen] = useState(false);
  const showTable = typeof table !== 'function' || rows <= EAGER_TABLE_ROWS || tableOpen;
  return <figure className="t98-chart" aria-busy={loading || undefined}>
    <figcaption className="t98-chart-caption"><strong>{label}</strong>{context && <span className="t98-chart-context">{context}</span>}</figcaption>
    {notice && <p className="t98-chart-notice" role="note">{notice}</p>}
    {loading ? <StatusLine busy>Loading chart…</StatusLine>
      : empty ? <p className="t98-chart-empty">{emptyMessage ?? 'No data for this period.'}</p>
      : children}
    <p id={summaryId} className="t98-chart-summary">{summary}</p>
    <p id={statsId} className="t98-chart-stats">{stats}</p>
    {!loading && !empty && legend}
    {!loading && !empty && <details className="t98-chart-data" onToggle={event => { if (event.currentTarget.open) setTableOpen(true); }}>
      <summary>View data table{rows > EAGER_TABLE_ROWS ? ` (${rows.toLocaleString('en')} rows)` : ''}</summary>
      <div className="t98-table-scroll t98-chart-table-scroll" tabIndex={0} role="region" aria-label={tableLabel}>{showTable ? (typeof table === 'function' ? table() : table) : null}</div>
    </details>}
  </figure>;
}

export interface TimeSeriesChartProps {
  label: string;
  /** Date range, filters or units shown beside the label. */
  context?: ReactNode;
  /** The application's own reading of the chart; referenced by the SVG through aria-describedby. */
  summary: ReactNode;
  kind: 'bars' | 'grouped-bars' | 'stacked-bars' | 'line' | 'area';
  series: readonly ChartSeries[];
  /** `band` spaces points evenly by position; `linear` places them by `x`. */
  xScale?: 'band' | 'linear';
  xDomain?: readonly [number, number];
  formatY?: (value: number) => string;
  /** A fixed domain, or `nice` to round the data extent. Negatives are allowed. */
  yDomain?: readonly [number, number] | 'nice';
  baselineLabel?: string;
  /** Header of the first data-table column. */
  xHeader?: string;
  /** Short axis label for a point, for example "W7". The data table and announcements keep the full `xLabel`. */
  formatXTick?: (point: ChartPoint, index: number) => string;
  /** `scroll` (default) keeps a minimum width per point and scrolls inside the region; `compress` fits every point into the
   * figure (for example 90 daily or 60 per-minute points), thinning axis labels. Keyboard inspection and the table are the same. */
  fit?: 'scroll' | 'compress';
  /** Minimum width per point in pixels: default 48 when scrolling (more for grouped bars); none when compressing. */
  minStep?: number;
  tableColumns?: readonly ChartTableColumn[];
  onInspect?: (index: number) => void;
  notice?: ReactNode;
  loading?: boolean;
  emptyMessage?: ReactNode;
}

const HEIGHT = 240;
const MARGIN = { top: 14, right: 14, bottom: 52, left: 58 };

/** Width of the plot before it is measured; server and first client render both use it so the markup agrees. */
const FALLBACK_WIDTH = 640;
const CHAR_WIDTH = 6.5;
const TICK_GAP = 8;
const PREFERRED_TICK_WIDTH = 64;

/**
 * Axis labels that never overlap. Ports the label-skipping idea of d3-axis (ISC) and the
 * Recharts/visx `interval: preserveStartEnd` behaviour (MIT): show every Nth tick, always keep the
 * first and last, and truncate a label that still does not fit its slot.
 */
function planTicks(texts: readonly string[], centres: readonly number[], width: number) {
  const count = texts.length;
  if (!count) return [];
  let pitch = Infinity;
  for (let i = 1; i < count; i++) pitch = Math.min(pitch, Math.abs(centres[i] - centres[i - 1]));
  if (!Number.isFinite(pitch) || pitch <= 0) pitch = width;
  let widest = 0;
  for (const text of texts) widest = Math.max(widest, text.length * CHAR_WIDTH);
  const wanted = Math.min(widest, PREFERRED_TICK_WIDTH);
  let every = 1;
  while (every < count - 1 && every * pitch - TICK_GAP < wanted) every++;
  const shown: number[] = [];
  for (let i = 0; i < count; i += every) shown.push(i);
  if (shown.at(-1) !== count - 1) {
    if (count - 1 - shown.at(-1)! < every && shown.length > 1) shown.pop();
    shown.push(count - 1);
  }
  const slot = every * pitch - TICK_GAP;
  return shown.map(index => {
    const edge = 2 * Math.min(centres[index], width - centres[index]) - 2;
    const room = Math.max(CHAR_WIDTH * 2, Math.min(slot, edge));
    const text = texts[index];
    if (text.length * CHAR_WIDTH <= room) return { index, text, full: null as string | null };
    const keep = Math.max(1, Math.floor(room / CHAR_WIDTH) - 1);
    return { index, text: `${text.slice(0, keep).trimEnd()}…`, full: text as string | null };
  });
}

/** Bars, grouped or stacked bars, a line or an area over time. Keyboard: arrows move between points and series, Home/End jump. */
export function TimeSeriesChart({ label, context, summary, kind, series, xScale = 'band', xDomain, formatY = plain, yDomain = 'nice', baselineLabel, xHeader = 'Point', formatXTick, fit = 'scroll', minStep, tableColumns = [], onInspect, notice, loading, emptyMessage }: TimeSeriesChartProps) {
  const uid = useId().replace(/:/g, '');
  const summaryId = `${uid}-summary`;
  const statsId = `${uid}-stats`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<{ index: number; series: number } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [available, setAvailable] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const measure = () => { if (box.clientWidth > 0) setAvailable(Math.round(box.clientWidth)); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [loading, series.length > 0 && series.some(item => item.points.length > 0)]);
  const count = Math.max(0, ...series.map(item => item.points.length));
  const stacked = kind === 'stacked-bars';
  const isBars = kind === 'bars' || kind === 'grouped-bars' || stacked;
  const xLabelAt = (index: number) => series.find(item => item.points[index])?.points[index].xLabel ?? `Point ${index + 1}`;

  const cells = series.map(item => item.points.length ? Array.from({ length: count }, (_, index) => valueOf(item, index)) : []);
  const stack = stacked ? stackSigned(cells.map(row => row.map(cell => cell.value))) : [];
  const bounds: number[] = [];
  cells.forEach((row, s) => row.forEach((cell, i) => {
    if (cell.value === null) return;
    if (stacked) { const range = stack[s][i]; if (range) bounds.push(range[0], range[1]); } else bounds.push(cell.value);
  }));
  const unavailableCount = cells.reduce((sum, row) => sum + row.filter(cell => cell.value === null).length, 0);
  const [lowest, highest] = extent(bounds) ?? [null, null];
  const observed = cells.flatMap(row => row.map(cell => cell.value).filter((value): value is number => value !== null));
  const observedRange = extent(observed);
  const stats = `${count} points, minimum ${observedRange ? formatY(observedRange[0]) : 'unavailable'}, maximum ${observedRange ? formatY(observedRange[1]) : 'unavailable'}, ${unavailableCount} unavailable`;

  const wantsZero = isBars || kind === 'area';
  let domain: [number, number] = [0, 1];
  if (yDomain !== 'nice') domain = [yDomain[0], yDomain[1]];
  else if (lowest !== null && highest !== null) {
    const low = wantsZero ? Math.min(0, lowest) : lowest;
    const high = wantsZero ? Math.max(0, highest) : highest;
    domain = niceDomain(low === high ? [low - 1, high + 1] : [low, high], 5);
    if (low === high && wantsZero && low === 0) domain = [0, 1];
  }

  const grouped = isBars && kind === 'grouped-bars';
  const step = fit === 'compress' ? Math.max(minStep ?? 0, grouped ? series.length : 0)
    : Math.max(minStep ?? 48, grouped ? series.length * 16 + 14 : 0);
  // Scroll: fill the figure but keep a minimum width per point, so dense series scroll inside the region.
  // Compress: always the figure's width unless the app sets minStep (or grouped bars need one pixel per series).
  const width = Math.max(available, MARGIN.left + MARGIN.right + count * step);
  const plotLeft = MARGIN.left;
  const plotRight = width - MARGIN.right;
  const plotTop = MARGIN.top;
  const plotBottom = HEIGHT - MARGIN.bottom;
  const y = linearScale(domain, [plotBottom, plotTop]);
  const yAt = (value: number) => y(value) ?? plotBottom;
  const band = bandScale(count, [plotLeft, plotRight], { paddingInner: 0.25, paddingOuter: 0.1 });
  const xs = series.flatMap(item => item.points.map(point => point.x)).filter(Number.isFinite);
  const linear = linearScale(xDomain ? [xDomain[0], xDomain[1]] : (extent(xs) ?? [0, 1]), [plotLeft + step / 2, plotRight - step / 2]);
  const bandwidth = xScale === 'band' ? band.bandwidth : Math.max(fit === 'compress' ? 1 : 8, (plotRight - plotLeft) / Math.max(1, count) * 0.7);
  const centre = (index: number) => {
    if (xScale === 'linear') {
      const x = series.find(item => item.points[index])?.points[index].x;
      return (x === undefined ? null : linear(x)) ?? plotLeft + (index + 0.5) * ((plotRight - plotLeft) / Math.max(1, count));
    }
    return band.start(index) + band.bandwidth / 2;
  };
  const baseline = Math.min(Math.max(0, domain[0]), domain[1]);
  const gridTicks = ticks(domain[0], domain[1], 5);
  const hasPartial = cells.some(row => row.some(cell => cell.state === 'partial'));
  const hasUnavailable = unavailableCount > 0;

  const describe = (s: number, i: number) => {
    const cell = cells[s]?.[i];
    const text = !cell || cell.value === null ? 'unavailable' : `${formatY(cell.value)}${cell.state === 'partial' ? ' (partial)' : ''}`;
    return `${xLabelAt(i)} · ${series[s].label}: ${text}`;
  };
  const inspect = (next: { index: number; series: number }) => {
    setActive(next);
    setAnnouncement(describe(next.series, next.index));
    onInspect?.(next.index);
    const box = scrollRef.current;
    const x = centre(next.index);
    if (box && x !== null) {
      if (x - step < box.scrollLeft) box.scrollLeft = Math.max(0, x - step);
      else if (x + step > box.scrollLeft + box.clientWidth) box.scrollLeft = x + step - box.clientWidth;
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!count || !series.length) return;
    const current = active ?? { index: 0, series: 0 };
    const moves: Record<string, { index: number; series: number }> = {
      ArrowRight: { ...current, index: Math.min(count - 1, current.index + 1) },
      ArrowLeft: { ...current, index: Math.max(0, current.index - 1) },
      Home: { ...current, index: 0 },
      End: { ...current, index: count - 1 },
      ArrowDown: { ...current, series: Math.min(series.length - 1, current.series + 1) },
      ArrowUp: { ...current, series: Math.max(0, current.series - 1) },
    };
    const next = moves[event.key];
    if (!next || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    inspect(next);
  };

  const patterns = tonePatterns(uid);

  const layers: ReactNode[] = [];
  const unavailableColumns = new Set<number>();
  cells.forEach(row => row.forEach((cell, i) => { if (cell.value === null) unavailableColumns.add(i); }));
  const columns = [...unavailableColumns].map(index => {
    const names = series.filter((_, s) => cells[s]?.[index]?.value === null).map(item => item.label).join(', ');
    const cx0 = centre(index) ?? 0;
    const mid = (plotTop + plotBottom) / 2;
    return <g key={`u${index}`} className="t98-chart-unavailable">
      <rect x={cx0 - bandwidth / 2} y={plotTop} width={bandwidth} height={plotBottom - plotTop} fill={`url(#${uid}-hatch)`} className="t98-chart-unavailable-column"><title>{`${xLabelAt(index)} · ${names}: unavailable`}</title></rect>
      <text transform={`rotate(-90 ${cx0} ${mid})`} x={cx0} y={mid} textAnchor="middle" dominantBaseline="central" className="t98-chart-unavailable-text">Unavailable</text>
    </g>;
  });

  series.forEach((item, s) => {
    const tone = toneOf(item, s);
    const outlined = item.role === 'comparison';
    const row = cells[s] ?? [];
    if (isBars) {
      row.forEach((cell, i) => {
        if (cell.value === null) return;
        const c = centre(i) ?? 0;
        let x0 = c - bandwidth / 2;
        let w = bandwidth;
        let top: number;
        let bottom: number;
        if (stacked) {
          const [low, high] = stack[s][i]!;
          top = yAt(high); bottom = yAt(low);
        } else {
          top = yAt(Math.max(cell.value, baseline)); bottom = yAt(Math.min(cell.value, baseline));
          if (kind === 'grouped-bars') { w = bandwidth / series.length; x0 += s * w; w *= 0.88; }
          else if (!outlined && series.some(other => other.role === 'comparison')) { x0 += bandwidth * 0.2; w = bandwidth * 0.6; }
        }
        const height = Math.max(bottom - top, cell.value === 0 ? 2 : 0);
        if (height <= 0) return;
        layers.push(<rect key={`${item.id}-${i}`} x={x0} y={cell.value === 0 ? top - 1 : top} width={w} height={height}
          className={cx('t98-chart-bar', outlined && 't98-chart-bar--outline', cell.state === 'partial' && 't98-chart-bar--partial')}
          fill={outlined ? 'none' : `url(#${uid}-p${tone})`} style={{ stroke: toneColor(tone) }}
          strokeDasharray={outlined ? DASHES[1] : cell.state === 'partial' ? '4 3' : undefined}><title>{series[s].points[i]?.title ?? describe(s, i)}</title></rect>);
        if (cell.state === 'partial') layers.push(<circle key={`${item.id}-${i}-p`} className="t98-chart-partial-mark" cx={x0 + w / 2} cy={top - 7} r="5" style={{ stroke: toneColor(tone) }}><title>Partial</title></circle>);
      });
    } else {
      const known = row.map(cell => cell.value);
      const runs = segments(known, value => value !== null);
      runs.forEach(run => {
        const points = run.map(({ index, item: value }) => `${centre(index)},${yAt(value!)}`);
        const first = run[0].index;
        if (kind === 'area' && !outlined && run.length > 1) {
          layers.push(<path key={`${item.id}-a${first}`} className="t98-chart-area" d={`M${points.join('L')}L${centre(run.at(-1)!.index)},${yAt(baseline)}L${centre(first)},${yAt(baseline)}Z`} fill={`url(#${uid}-p${tone})`} />);
        }
        if (run.length > 1) layers.push(<path key={`${item.id}-l${first}`} className="t98-chart-line" d={`M${points.join('L')}`} strokeDasharray={DASHES[s % 5] || undefined} style={{ stroke: toneColor(tone) }} />);
      });
      row.forEach((cell, i) => {
        if (cell.value === null) return;
        const c = centre(i) ?? 0;
        layers.push(<ChartMarker key={`${item.id}-m${i}`} shape={s} x={c} y={yAt(cell.value)} tone={tone} />);
        if (cell.state === 'partial') layers.push(<circle key={`${item.id}-m${i}-p`} className="t98-chart-partial-mark" cx={c} cy={yAt(cell.value)} r="8" style={{ stroke: toneColor(tone) }}><title>Partial</title></circle>);
      });
    }
  });

  const activeCell = active ? cells[active.series]?.[active.index] : undefined;
  const activeX = active ? centre(active.index) : null;
  const activeY = active && activeCell && activeCell.value !== null
    ? stacked ? yAt(stack[active.series][active.index]![1]) : yAt(activeCell.value) : null;

  const legend = <ul className="t98-chart-legend" aria-label="Series">
    {series.map((item, s) => <li key={item.id}><SwatchKey series={item} index={s} /><span>{item.label}{item.role === 'comparison' ? ' (comparison, outlined)' : ''}{item.unavailable ? ' — unavailable' : ''}</span></li>)}
    {hasPartial && <li><svg className="t98-chart-key" width="30" height="14" viewBox="0 0 30 14" aria-hidden="true" focusable="false"><circle className="t98-chart-partial-mark" cx="15" cy="7" r="5" /></svg><span>Dashed ring: partial data</span></li>}
    {hasUnavailable && <li><svg className="t98-chart-key" width="30" height="14" viewBox="0 0 30 14" aria-hidden="true" focusable="false"><rect className="t98-chart-unavailable-column" x="8" y="1" width="14" height="12" fill={`url(#${uid}-hatch)`} /></svg><span>Hatched: unavailable, not zero</span></li>}
  </ul>;

  const table = () => <table className="t98-table t98-chart-table">
    <caption className="t98-visually-hidden">{label}: every point</caption>
    <thead><tr><th scope="col">{xHeader}</th>{series.map(item => <th key={item.id} scope="col">{item.label}</th>)}{tableColumns.map(column => <th key={column.header} scope="col">{column.header}</th>)}</tr></thead>
    <tbody>{Array.from({ length: count }, (_, i) => <tr key={i}>
      <th scope="row">{xLabelAt(i)}</th>
      {series.map((item, s) => {
        const cell = cells[s]?.[i];
        const note = item.points[i]?.note;
        return <td key={item.id} className="t98-table-cell--numeric">{!cell || cell.value === null ? 'Unavailable' : `${formatY(cell.value)}${cell.state === 'partial' ? ' (partial)' : ''}`}{note && <span className="t98-chart-note"> · {note}</span>}</td>;
      })}
      {tableColumns.map(column => <td key={column.header}>{column.values[i]}</td>)}
    </tr>)}</tbody>
  </table>;

  return <ChartFrame label={label} context={context} summary={summary} summaryId={summaryId} statsId={statsId} stats={stats} notice={notice} loading={loading}
    empty={count === 0} emptyMessage={emptyMessage} legend={legend} tableLabel={`${label} data table`} table={table} rows={count}>
    <div ref={scrollRef} className="t98-chart-scroll" dir="ltr" tabIndex={0} role="group" aria-label={`${label} plot. Arrow keys move between points and series.`}
      aria-describedby={`${summaryId} ${statsId}`} onKeyDown={onKeyDown} onFocus={() => { if (!active && count) inspect({ index: 0, series: 0 }); }} onBlur={() => setActive(null)}>
      <svg className="t98-chart-svg" width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={label} aria-describedby={`${summaryId} ${statsId}`}>
        <defs>
          {patterns}
          <pattern id={`${uid}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" className="t98-chart-hatch-line" />
          </pattern>
        </defs>
        {gridTicks.map(tick => <g key={tick} className="t98-chart-grid">
          <line x1={plotLeft} x2={plotRight} y1={yAt(tick)} y2={yAt(tick)} />
          <text x={plotLeft - 8} y={yAt(tick)} textAnchor="end" dominantBaseline="central" className="t98-chart-axis-text">{formatY(tick)}</text>
        </g>)}
        {domain[0] <= 0 && domain[1] >= 0 && <g><line className="t98-chart-baseline" x1={plotLeft} x2={plotRight} y1={yAt(0)} y2={yAt(0)} />
          {baselineLabel && <text x={plotRight} y={yAt(0) - 4} textAnchor="end" className="t98-chart-axis-text">{baselineLabel}</text>}</g>}
        {columns}
        {planTicks(Array.from({ length: count }, (_, i) => {
          const point = series.find(item => item.points[i])?.points[i];
          return point && formatXTick ? formatXTick(point, i) : xLabelAt(i);
        }), Array.from({ length: count }, (_, i) => centre(i) ?? 0), width).map(tick => <text key={tick.index} x={centre(tick.index) ?? 0} y={plotBottom + 14} textAnchor="middle" className="t98-chart-axis-text t98-chart-x-tick">
          {tick.full !== null && <title>{tick.full}</title>}{tick.text}
        </text>)}
        {layers}
        {active && activeX !== null && <g className="t98-chart-active" aria-hidden="true">
          <line x1={activeX} x2={activeX} y1={plotTop} y2={plotBottom} />
          {activeY !== null && <circle cx={activeX} cy={activeY} r="9" />}
        </g>}
      </svg>
    </div>
    <p className="t98-chart-readout" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </ChartFrame>;
}

export interface BarListItem {
  id: string;
  label: string;
  /** Number that sizes the bar; the visible text is `valueText`. Use null when unavailable. */
  value: number | null;
  valueText: string;
  /** Bar length from 0 to 1, computed by the application. */
  share?: number | null;
  /** Why the value is partial or unavailable. */
  reason?: string;
  /** A second measure under the first. `value` null reads Unavailable, as for the item itself. */
  secondary?: { label: string; valueText: string; value?: number | null; share?: number | null };
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
}

const clampShare = (share: number | null | undefined) => share === null || share === undefined || !Number.isFinite(share) ? null : Math.min(1, Math.max(0, share));
const shareStyle = (share: number | null | undefined): CSSProperties => ({ '--t98-bar-share': `${(clampShare(share) ?? 0) * 100}%` } as CSSProperties);

/** Ranked horizontal bars with the value always visible as text. */
/** `busy` keeps selectable rows visible but inert (aria-disabled, so focus stays put) while the app applies a selection. */
export function BarList({ label, items, emptyMessage = 'No items.', busy = false }: { label: string; items: readonly BarListItem[]; emptyMessage?: ReactNode; busy?: boolean }) {
  if (!items.length) return <p className="t98-chart-empty">{emptyMessage}</p>;
  return <ol className="t98-bar-list" aria-label={label} aria-busy={busy || undefined}>
    {items.map(item => {
      const share = clampShare(item.share ?? undefined);
      const name = item.onSelect ? <button type="button" className="t98-bar-list-name t98-bar-list-button" aria-pressed={item.selected ?? false} aria-disabled={busy || undefined} onClick={() => { if (!busy) item.onSelect?.(); }}>{item.label}</button>
        : item.href ? <a className="t98-bar-list-name" href={item.href}>{item.label}</a>
        : <span className="t98-bar-list-name">{item.label}</span>;
      return <li key={item.id} className="t98-bar-list-item" data-selected={item.selected || undefined}>
        <div className="t98-bar-list-head">{name}<span className="t98-bar-list-value">{item.value === null ? 'Unavailable' : item.valueText}</span></div>
        <span className={cx('t98-bar-track', item.value === null && 't98-bar-track--unavailable')} style={shareStyle(item.value === null ? null : share)} aria-hidden="true"><span className="t98-bar-fill" /></span>
        {item.secondary && <>
          <div className="t98-bar-list-head t98-bar-list-secondary"><span>{item.secondary.label}</span><span className="t98-bar-list-value">{item.secondary.value === null ? 'Unavailable' : item.secondary.valueText}</span></div>
          <span className={cx('t98-bar-track', 't98-bar-track--secondary', item.secondary.value === null && 't98-bar-track--unavailable')} style={shareStyle(item.secondary.value === null ? null : item.secondary.share)} aria-hidden="true"><span className="t98-bar-fill" /></span>
        </>}
        {item.reason && <p className="t98-bar-list-reason">{item.reason}</p>}
      </li>;
    })}
  </ol>;
}

export interface ShareSegment {
  id: string;
  label: string;
  /** Null when this segment's count is unavailable: it reads Unavailable and is left out of the graphic, never drawn as 0. */
  count: number | null;
  tone: ChartTone;
}

const known = (count: number | null): count is number => count !== null && Number.isFinite(count);
const percent = (count: number | null, total: number) => known(count) ? `${Math.round(count / total * 1000) / 10}%` : 'Unavailable';
/** Visible text for a segment's count and share. */
const segmentText = (part: ShareSegment, total: number, formatCount: (count: number) => string, shareFirst: boolean) => {
  if (!known(part.count)) return <strong>Unavailable</strong>;
  return shareFirst ? <><strong>{percent(part.count, total)}</strong> ({formatCount(part.count)})</> : <><strong>{formatCount(part.count)}</strong> ({percent(part.count, total)})</>;
};
const missingNote = (parts: readonly ShareSegment[]) => {
  const missing = parts.filter(part => !known(part.count)).map(part => part.label);
  return missing.length ? <p className="t98-chart-notice" role="note">{`Unavailable: ${missing.join(', ')}. The graphic shows only segments with a known count.`}</p> : null;
};

/** One bar split by count, with a legend that states each count. `total` null is Unavailable; 0 shows `emptyMessage`. */
export function ProportionBar({ label, segments: parts, total, formatCount = plain, emptyMessage = 'No samples' }: { label: string; segments: readonly ShareSegment[]; total: number | null; formatCount?: (count: number) => string; emptyMessage?: ReactNode }) {
  return <div className="t98-proportion">
    <p className="t98-proportion-label">{label}</p>
    {total === null ? <p className="t98-chart-empty t98-chart-empty--unavailable">Unavailable</p>
      : total === 0 ? <p className="t98-chart-empty">{emptyMessage}</p>
      : <>
        <div className="t98-proportion-bar" aria-hidden="true">
          {parts.filter(part => known(part.count) && part.count > 0).map(part => <span key={part.id} className={`t98-proportion-segment t98-chart-fill-${part.tone}`} style={{ flexGrow: part.count! }} />)}
        </div>
        <ul className="t98-chart-legend t98-proportion-legend" aria-label={`${label} breakdown`}>
          {parts.map(part => <li key={part.id}><span className={`t98-chart-swatch t98-chart-fill-${part.tone}`} aria-hidden="true" /><span>{part.label}: {segmentText(part, total, formatCount, false)}</span></li>)}
        </ul>
        {missingNote(parts)}
      </>}
  </div>;
}

/** A donut with a legend and a table. The graphic is decorative: the legend and table carry the figures. */
export function ShareChart({ label, context, summary, segments: parts, total, formatCount = plain, emptyMessage = 'No samples', notice }: { label: string; context?: ReactNode; summary?: ReactNode; segments: readonly ShareSegment[]; total: number | null; formatCount?: (count: number) => string; emptyMessage?: ReactNode; notice?: ReactNode }) {
  const uid = useId().replace(/:/g, '');
  const summaryId = `${uid}-summary`;
  let angle = 0;
  const arcs = total ? parts.filter(part => known(part.count) && part.count > 0).map(part => {
    const start = angle;
    angle += Math.min(1, part.count! / total) * 2 * Math.PI;
    return { part, d: arcPath(38, 66, start, angle) };
  }) : [];
  return <figure className="t98-chart t98-share-chart" aria-describedby={summary ? summaryId : undefined}>
    <figcaption className="t98-chart-caption"><strong>{label}</strong>{context && <span className="t98-chart-context">{context}</span>}</figcaption>
    {notice && <p className="t98-chart-notice" role="note">{notice}</p>}
    {total === null ? <p className="t98-chart-empty t98-chart-empty--unavailable">Unavailable</p>
      : total === 0 ? <p className="t98-chart-empty">{emptyMessage}</p>
      : <>
        <div className="t98-share-body">
          <svg className="t98-share-donut" viewBox="-70 -70 140 140" aria-hidden="true" focusable="false">
            <defs>{tonePatterns(uid)}</defs>
            {/* The same hatch, dot and stripe fills as the legend swatches, so slices never differ by colour alone. */}
            {arcs.map(({ part, d }) => <path key={part.id} d={d} fillRule="evenodd" className="t98-share-slice" fill={`url(#${uid}-p${part.tone})`} />)}
          </svg>
          <ul className="t98-chart-legend t98-share-legend" aria-label={`${label} breakdown`}>
            {parts.map(part => <li key={part.id}><span className={`t98-chart-swatch t98-chart-fill-${part.tone}`} aria-hidden="true" /><span>{part.label}: {segmentText(part, total, formatCount, true)}</span></li>)}
          </ul>
        </div>
        {missingNote(parts)}
        {summary && <p id={summaryId} className="t98-chart-summary">{summary}</p>}
        <details className="t98-chart-data">
          <summary>View data table</summary>
          <div className="t98-table-scroll t98-chart-table-scroll" tabIndex={0} role="region" aria-label={`${label} data table`}>
            <table className="t98-table t98-chart-table">
              <caption className="t98-visually-hidden">{label}: counts and shares</caption>
              <thead><tr><th scope="col">Segment</th><th scope="col">Count</th><th scope="col">Share</th></tr></thead>
              <tbody>{parts.map(part => <tr key={part.id}><th scope="row">{part.label}</th><td className="t98-table-cell--numeric">{known(part.count) ? formatCount(part.count) : 'Unavailable'}</td><td className="t98-table-cell--numeric">{percent(part.count, total)}</td></tr>)}</tbody>
              <tfoot><tr><th scope="row">Total</th><td className="t98-table-cell--numeric">{formatCount(total)}</td><td className="t98-table-cell--numeric">100%</td></tr></tfoot>
            </table>
          </div>
        </details>
      </>}
  </figure>;
}

export interface WeekdayHourGridProps {
  label: string;
  /** Date range, metric and time zone shown beside the label. */
  context?: ReactNode;
  /** The application's own reading of the grid. */
  summary: ReactNode;
  /** One row of 24 hourly values per weekday, in `weekdays` order. Null or a missing cell is Unavailable, never 0. */
  values: readonly (readonly ChartValue[])[];
  /** Row names in the order of `values`, for example Monday to Sunday. */
  weekdays: readonly string[];
  formatValue?: (value: number) => string;
  /** Column headers; defaults to 00 to 23. */
  hourLabels?: readonly string[];
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

/** A weekday × hour density table. Every cell states its value as text; shading uses square-root steps, so a few
 * busy hours do not wash out the rest, and an unavailable cell is hatched rather than drawn as empty. */
export function WeekdayHourGrid({ label, context, summary, values, weekdays, formatValue = plain, hourLabels = HOURS, className }: WeekdayHourGridProps) {
  const cellOf = (day: number, hour: number) => { const value = values[day]?.[hour]; return value != null && Number.isFinite(value) ? value : null; };
  const known = weekdays.flatMap((_, day) => HOURS.map((__, hour) => cellOf(day, hour))).filter((value): value is number => value !== null);
  const max = extent(known)?.[1] ?? 0;
  const step = (value: number) => value <= 0 || max <= 0 ? 0 : Math.min(4, 1 + Math.floor(Math.sqrt(value / max) * 3.999));
  return <figure className={cx('t98-chart', 't98-hour-grid', className)}>
    <figcaption className="t98-chart-caption"><strong>{label}</strong>{context && <span className="t98-chart-context">{context}</span>}</figcaption>
    <p className="t98-chart-summary">{summary}</p>
    <div className="t98-table-scroll t98-hour-grid-scroll" dir="ltr" tabIndex={0} role="region" aria-label={`${label} table`}>
      <table className="t98-hour-grid-table">
        <caption className="t98-visually-hidden">{label}: values by weekday and hour</caption>
        <thead><tr><th scope="col" className="t98-hour-grid-corner">Day</th>{HOURS.map((_, hour) => <th key={hour} scope="col">{hourLabels[hour] ?? HOURS[hour]}</th>)}</tr></thead>
        <tbody>{weekdays.map((weekday, day) => <tr key={weekday}>
          <th scope="row">{weekday}</th>
          {HOURS.map((_, hour) => {
            const value = cellOf(day, hour);
            return value === null
              ? <td key={hour} className="t98-hour-cell t98-hour-cell--unavailable"><span aria-hidden="true">–</span><VisuallyHidden>Unavailable</VisuallyHidden></td>
              : <td key={hour} className={`t98-hour-cell t98-hour-cell--${step(value)}`}>{formatValue(value)}</td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
    <ul className="t98-chart-legend t98-hour-grid-legend" aria-label={`${label} key`}>
      <li><span className="t98-hour-grid-scale" aria-hidden="true">{[0, 1, 2, 3, 4].map(level => <span key={level} className={`t98-hour-cell t98-hour-cell--${level}`} />)}</span><span>Darker cells: more ({max > 0 ? `up to ${formatValue(max)}` : 'no values above 0'})</span></li>
      <li><span className="t98-hour-cell t98-hour-cell--unavailable" aria-hidden="true" /><span>Hatched: unavailable, not zero</span></li>
    </ul>
  </figure>;
}
