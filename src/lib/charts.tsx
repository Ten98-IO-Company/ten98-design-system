'use client';

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './primitives.js';
import { StatusLine } from './controls.js';
import { arcPath, bandScale, linearScale, niceDomain, segments, stackSigned, ticks, type ChartValue } from './chart-scale.js';

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

const plain = (value: number) => new Intl.NumberFormat('en').format(value);
const toneOf = (series: ChartSeries, index: number): ChartTone => series.tone ?? ((index % 5) + 1) as ChartTone;
const toneColor = (tone: ChartTone) => `var(--t98-chart-${tone})`;
const DASHES = ['', '7 4', '2 4', '10 4 2 4', '1 5'];

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
  table: ReactNode;
  children: ReactNode;
}

/** Shared chart chrome: caption, application summary, computed statistics, state messages, legend and a data table with every point. */
function ChartFrame({ label, context, summary, summaryId, statsId, stats, notice, loading, empty, emptyMessage, legend, tableLabel, table, children }: ChartFrameProps) {
  return <figure className="t98-chart" aria-busy={loading || undefined}>
    <figcaption className="t98-chart-caption"><strong>{label}</strong>{context && <span className="t98-chart-context">{context}</span>}</figcaption>
    {notice && <p className="t98-chart-notice" role="note">{notice}</p>}
    {loading ? <StatusLine busy>Loading chart…</StatusLine>
      : empty ? <p className="t98-chart-empty">{emptyMessage ?? 'No data for this period.'}</p>
      : children}
    <p id={summaryId} className="t98-chart-summary">{summary}</p>
    <p id={statsId} className="t98-chart-stats">{stats}</p>
    {!loading && !empty && legend}
    {!loading && !empty && <details className="t98-chart-data">
      <summary>View data table</summary>
      <div className="t98-table-scroll t98-chart-table-scroll" tabIndex={0} role="region" aria-label={tableLabel}>{table}</div>
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
  tableColumns?: readonly ChartTableColumn[];
  onInspect?: (index: number) => void;
  notice?: ReactNode;
  loading?: boolean;
  emptyMessage?: ReactNode;
}

const HEIGHT = 240;
const MARGIN = { top: 14, right: 14, bottom: 52, left: 58 };

function wrapLabel(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last !== undefined && last.length + word.length < 9 && lines.length < 3) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines.slice(0, 3);
}

/** Bars, grouped or stacked bars, a line or an area over time. Keyboard: arrows move between points and series, Home/End jump. */
export function TimeSeriesChart({ label, context, summary, kind, series, xScale = 'band', xDomain, formatY = plain, yDomain = 'nice', baselineLabel, xHeader = 'Point', tableColumns = [], onInspect, notice, loading, emptyMessage }: TimeSeriesChartProps) {
  const uid = useId().replace(/:/g, '');
  const summaryId = `${uid}-summary`;
  const statsId = `${uid}-stats`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<{ index: number; series: number } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const count = Math.max(0, ...series.map(item => item.points.length));
  const stacked = kind === 'stacked-bars';
  const isBars = kind === 'bars' || kind === 'grouped-bars' || stacked;
  const xLabelAt = (index: number) => series.find(item => item.points[index])?.points[index].xLabel ?? `Point ${index + 1}`;

  const cells = series.map(item => item.points.length ? Array.from({ length: count }, (_, index) => valueOf(item, index)) : []);
  const stack = stacked ? stackSigned(cells.map(row => row.map(cell => cell.value))) : [];
  const extent: number[] = [];
  cells.forEach((row, s) => row.forEach((cell, i) => {
    if (cell.value === null) return;
    if (stacked) { const range = stack[s][i]; if (range) extent.push(range[0], range[1]); } else extent.push(cell.value);
  }));
  const unavailableCount = cells.reduce((sum, row) => sum + row.filter(cell => cell.value === null).length, 0);
  const lowest = extent.length ? Math.min(...extent) : null;
  const highest = extent.length ? Math.max(...extent) : null;
  const observed = cells.flatMap(row => row.map(cell => cell.value).filter((value): value is number => value !== null));
  const stats = `${count} points, minimum ${observed.length ? formatY(Math.min(...observed)) : 'unavailable'}, maximum ${observed.length ? formatY(Math.max(...observed)) : 'unavailable'}, ${unavailableCount} unavailable`;

  const wantsZero = isBars || kind === 'area';
  let domain: [number, number] = [0, 1];
  if (yDomain !== 'nice') domain = [yDomain[0], yDomain[1]];
  else if (lowest !== null && highest !== null) {
    const low = wantsZero ? Math.min(0, lowest) : lowest;
    const high = wantsZero ? Math.max(0, highest) : highest;
    domain = niceDomain(low === high ? [low - 1, high + 1] : [low, high], 5);
    if (low === high && wantsZero && low === 0) domain = [0, 1];
  }

  const step = isBars && kind === 'grouped-bars' ? Math.max(48, series.length * 16 + 14) : 48;
  const width = Math.max(320, MARGIN.left + MARGIN.right + count * step);
  const plotLeft = MARGIN.left;
  const plotRight = width - MARGIN.right;
  const plotTop = MARGIN.top;
  const plotBottom = HEIGHT - MARGIN.bottom;
  const y = linearScale(domain, [plotBottom, plotTop]);
  const yAt = (value: number) => y(value) ?? plotBottom;
  const band = bandScale(count, [plotLeft, plotRight], { paddingInner: 0.25, paddingOuter: 0.1 });
  const xs = series.flatMap(item => item.points.map(point => point.x)).filter(Number.isFinite);
  const linear = linearScale(xDomain ? [xDomain[0], xDomain[1]] : [Math.min(...xs), Math.max(...xs)], [plotLeft + step / 2, plotRight - step / 2]);
  const bandwidth = xScale === 'band' ? band.bandwidth : Math.max(8, (plotRight - plotLeft) / Math.max(1, count) * 0.7);
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

  const patterns = ([1, 2, 3, 4, 5] as ChartTone[]).map(tone => {
    const overlay = [null, 'M-2 2L2 -2M0 8L8 0M6 10L10 6', null, 'M0 3H8M0 7H8', 'M0 0L8 8M8 0L0 8'][tone - 1];
    return <pattern key={tone} id={`${uid}-p${tone}`} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" style={{ fill: toneColor(tone) }} />
      {overlay && <path d={overlay} className="t98-chart-pattern-line" />}
      {tone === 3 && <circle cx="4" cy="4" r="1.3" className="t98-chart-pattern-dot" />}
    </pattern>;
  });

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
          strokeDasharray={outlined ? DASHES[1] : cell.state === 'partial' ? '4 3' : undefined}><title>{describe(s, i)}</title></rect>);
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

  const table = <table className="t98-table t98-chart-table">
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
    empty={count === 0} emptyMessage={emptyMessage} legend={legend} tableLabel={`${label} data table`} table={table}>
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
        {Array.from({ length: count }, (_, i) => {
          const c = centre(i) ?? 0;
          return <text key={i} x={c} y={plotBottom + 14} textAnchor="middle" className="t98-chart-axis-text">
            {wrapLabel(xLabelAt(i)).map((line, n) => <tspan key={n} x={c} dy={n ? 11 : 0}>{line}</tspan>)}
          </text>;
        })}
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
  secondary?: { label: string; valueText: string; share?: number | null };
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
}

const clampShare = (share: number | null | undefined) => share === null || share === undefined || !Number.isFinite(share) ? null : Math.min(1, Math.max(0, share));
const shareStyle = (share: number | null | undefined): CSSProperties => ({ '--t98-bar-share': `${(clampShare(share) ?? 0) * 100}%` } as CSSProperties);

/** Ranked horizontal bars with the value always visible as text. */
export function BarList({ label, items, emptyMessage = 'No items.' }: { label: string; items: readonly BarListItem[]; emptyMessage?: ReactNode }) {
  if (!items.length) return <p className="t98-chart-empty">{emptyMessage}</p>;
  return <ol className="t98-bar-list" aria-label={label}>
    {items.map(item => {
      const share = clampShare(item.share ?? undefined);
      const name = item.onSelect ? <button type="button" className="t98-bar-list-name t98-bar-list-button" aria-pressed={item.selected ?? false} onClick={item.onSelect}>{item.label}</button>
        : item.href ? <a className="t98-bar-list-name" href={item.href}>{item.label}</a>
        : <span className="t98-bar-list-name">{item.label}</span>;
      return <li key={item.id} className="t98-bar-list-item" data-selected={item.selected || undefined}>
        <div className="t98-bar-list-head">{name}<span className="t98-bar-list-value">{item.value === null ? 'Unavailable' : item.valueText}</span></div>
        <span className={cx('t98-bar-track', item.value === null && 't98-bar-track--unavailable')} style={shareStyle(item.value === null ? null : share)} aria-hidden="true"><span className="t98-bar-fill" /></span>
        {item.secondary && <>
          <div className="t98-bar-list-head t98-bar-list-secondary"><span>{item.secondary.label}</span><span className="t98-bar-list-value">{item.secondary.valueText}</span></div>
          <span className="t98-bar-track t98-bar-track--secondary" style={shareStyle(item.secondary.share)} aria-hidden="true"><span className="t98-bar-fill" /></span>
        </>}
        {item.reason && <p className="t98-bar-list-reason">{item.reason}</p>}
      </li>;
    })}
  </ol>;
}

export interface ShareSegment { id: string; label: string; count: number; tone: ChartTone }

const percent = (count: number, total: number) => `${Math.round(count / total * 1000) / 10}%`;

/** One bar split by count, with a legend that states each count. `total` null is Unavailable; 0 shows `emptyMessage`. */
export function ProportionBar({ label, segments: parts, total, formatCount = plain, emptyMessage = 'No samples' }: { label: string; segments: readonly ShareSegment[]; total: number | null; formatCount?: (count: number) => string; emptyMessage?: ReactNode }) {
  return <div className="t98-proportion">
    <p className="t98-proportion-label">{label}</p>
    {total === null ? <p className="t98-chart-empty t98-chart-empty--unavailable">Unavailable</p>
      : total === 0 ? <p className="t98-chart-empty">{emptyMessage}</p>
      : <>
        <div className="t98-proportion-bar" aria-hidden="true">
          {parts.filter(part => part.count > 0).map(part => <span key={part.id} className={`t98-proportion-segment t98-chart-fill-${part.tone}`} style={{ flexGrow: part.count }} />)}
        </div>
        <ul className="t98-chart-legend t98-proportion-legend" aria-label={`${label} breakdown`}>
          {parts.map(part => <li key={part.id}><span className={`t98-chart-swatch t98-chart-fill-${part.tone}`} aria-hidden="true" /><span>{part.label}: <strong>{formatCount(part.count)}</strong> ({percent(part.count, total)})</span></li>)}
        </ul>
      </>}
  </div>;
}

/** A donut with a legend and a table. The graphic is decorative: the legend and table carry the figures. */
export function ShareChart({ label, context, summary, segments: parts, total, formatCount = plain, emptyMessage = 'No samples', notice }: { label: string; context?: ReactNode; summary?: ReactNode; segments: readonly ShareSegment[]; total: number | null; formatCount?: (count: number) => string; emptyMessage?: ReactNode; notice?: ReactNode }) {
  const uid = useId().replace(/:/g, '');
  const summaryId = `${uid}-summary`;
  let angle = 0;
  const arcs = total ? parts.filter(part => part.count > 0).map(part => {
    const start = angle;
    angle += Math.min(1, part.count / total) * 2 * Math.PI;
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
            {arcs.map(({ part, d }) => <path key={part.id} d={d} fillRule="evenodd" className={`t98-share-slice t98-chart-fill-${part.tone}`} />)}
          </svg>
          <ul className="t98-chart-legend t98-share-legend" aria-label={`${label} breakdown`}>
            {parts.map(part => <li key={part.id}><span className={`t98-chart-swatch t98-chart-fill-${part.tone}`} aria-hidden="true" /><span>{part.label}: <strong>{percent(part.count, total)}</strong> ({formatCount(part.count)})</span></li>)}
          </ul>
        </div>
        {summary && <p id={summaryId} className="t98-chart-summary">{summary}</p>}
        <details className="t98-chart-data">
          <summary>View data table</summary>
          <div className="t98-table-scroll t98-chart-table-scroll" tabIndex={0} role="region" aria-label={`${label} data table`}>
            <table className="t98-table t98-chart-table">
              <caption className="t98-visually-hidden">{label}: counts and shares</caption>
              <thead><tr><th scope="col">Segment</th><th scope="col">Count</th><th scope="col">Share</th></tr></thead>
              <tbody>{parts.map(part => <tr key={part.id}><th scope="row">{part.label}</th><td className="t98-table-cell--numeric">{formatCount(part.count)}</td><td className="t98-table-cell--numeric">{percent(part.count, total)}</td></tr>)}</tbody>
              <tfoot><tr><th scope="row">Total</th><td className="t98-table-cell--numeric">{formatCount(total)}</td><td className="t98-table-cell--numeric">100%</td></tr></tfoot>
            </table>
          </div>
        </details>
      </>}
  </figure>;
}
