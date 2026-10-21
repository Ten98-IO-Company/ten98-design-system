'use client';

import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { Alert, Button, cx } from './primitives.js';
import { StatusLine } from './controls.js';
import { ReplayControls, type ReplayControlsProps } from './inspection.js';
import { contentPolicyMeta, prefixDocument } from './sandbox.js';
import { PLAYER_CONNECT, PLAYER_PROTOCOL, parsePlayerMessage, playerDocument, playerFrameSource, playerScriptUrl, randomToken, validCommand, type PlayerCommand } from './player-protocol.js';

export type { PlayerCommand, PlayerMessage } from './player-protocol.js';

/** Presentation only: the app supplies geometry, data, player documents, access decisions and every explanatory message. */

export interface CountryShape {
  /** App country code (for example ISO 3166-1 alpha-2); null for a shape that never joins a row. */
  code: string | null;
  name: string;
  /** SVG path data in `viewBox` units. The library ships no geometry. */
  d: string;
}
export interface CountryRow {
  /** null means the metric is unavailable for this country; it is never drawn as zero. */
  value: number | null;
  /** App-formatted value with units, shown in the status line and the details table. */
  valueText: string;
}
export interface CountryMapSummary {
  /** App-formatted totals; null renders as "Unavailable", never 0. */
  mapped: string | null;
  unknown: string | null;
  notRecorded: string | null;
}
export interface CountryMapProps {
  label: string;
  /** Visible scope: metric, period, units and coverage. */
  context: ReactNode;
  /** Visible plain-language reading of the map for people who cannot see it. */
  summary: ReactNode;
  shapes: readonly CountryShape[];
  /** SVG viewBox of the supplied geometry, "minX minY width height". */
  viewBox: string;
  rows: ReadonlyMap<string, CountryRow>;
  metricLabel: string;
  /** Required boundary, data and licence attribution for the geometry. */
  attribution: ReactNode;
  unmappedSummary: CountryMapSummary;
  /** The geometry is simplified; a visible note says the map is approximate. */
  approximate?: boolean;
  /** Values are overlapping estimates (one visitor can count in several countries), so no mapped total is shown or implied. */
  overlapping?: boolean;
  selectedCode?: string | null;
  /** Makes countries with rows activatable with Enter or Space. */
  onSelect?: (code: string) => void;
  className?: string;
}

const SCALE_STEPS = 5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const compareNames = (a: { name: string }, b: { name: string }) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

function parseViewBox(viewBox: string): [number, number, number, number] {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  return parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0 ? [parts[0], parts[1], parts[2], parts[3]] : [0, 0, 100, 100];
}

/** Choropleth over app-supplied shapes. Countries with rows form one roving tab stop; the details table is always present. */
export function CountryMap({ label, context, summary, shapes, viewBox, rows, metricLabel, attribution, unmappedSummary, approximate = false, overlapping = false, selectedCode, onSelect, className }: CountryMapProps) {
  const id = useId();
  const patternId = `${id.replace(/:/g, '')}-nodata`;
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState<string | null>(null);
  const [rovingCode, setRovingCode] = useState<string | null>(null);
  const [minX, minY, width, height] = parseViewBox(viewBox);

  const navigable = useMemo(() => shapes.filter(shape => shape.code != null && rows.has(shape.code)).sort(compareNames), [shapes, rows]);
  const numbers = [...rows.values()].map(row => row.value).filter((value): value is number => value != null && Number.isFinite(value));
  const low = Math.min(...numbers);
  const high = Math.max(...numbers);
  const stepOf = (value: number | null) => value == null || !Number.isFinite(value) ? null : high === low ? SCALE_STEPS - 1 : Math.min(SCALE_STEPS - 1, Math.floor(((value - low) / (high - low)) * SCALE_STEPS));
  const lowRow = [...rows.values()].find(row => row.value === low);
  const highRow = [...rows.values()].find(row => row.value === high);

  const visibleWidth = width / zoom;
  const visibleHeight = height / zoom;
  const panLimitX = (width - visibleWidth) / 2;
  const panLimitY = (height - visibleHeight) / 2;
  const viewX = minX + (width - visibleWidth) / 2 + clamp(pan.x, -panLimitX, panLimitX);
  const viewY = minY + (height - visibleHeight) / 2 + clamp(pan.y, -panLimitY, panLimitY);
  const changeZoom = (next: number) => {
    const value = clamp(next, MIN_ZOOM, MAX_ZOOM);
    setZoom(value);
    if (value === MIN_ZOOM) setPan({ x: 0, y: 0 });
  };
  const movePan = (dx: number, dy: number) => setPan(current => ({ x: current.x + dx * visibleWidth * 0.25, y: current.y + dy * visibleHeight * 0.25 }));

  const stop = navigable.some(shape => shape.code === rovingCode) ? rovingCode : navigable[0]?.code ?? null;
  const describe = (shape: CountryShape) => {
    const row = shape.code != null ? rows.get(shape.code) : undefined;
    return `${shape.name}: ${row ? `${metricLabel} ${row.valueText}` : `no ${metricLabel} data`}`;
  };
  const activeShape = shapes.find(shape => shape.code === active && shape.code != null) ?? shapes.find(shape => shape.name === active);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const { key } = event;
    if (key === '+' || key === '=') { event.preventDefault(); changeZoom(zoom + 1); return; }
    if (key === '-' || key === '_') { event.preventDefault(); changeZoom(zoom - 1); return; }
    // Horizontal keys follow the writing direction: in RTL, ArrowLeft means "forward" and pans the other way.
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forwardKey = rtl ? 'ArrowLeft' : 'ArrowRight', backwardKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    const arrow: Record<string, [number, number]> = { [backwardKey]: [-1, 0], [forwardKey]: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (arrow[key] && (event.shiftKey || navigable.length === 0)) { event.preventDefault(); movePan(...arrow[key]); return; }
    const index = navigable.findIndex(shape => shape.code === stop);
    if (index < 0) return;
    const next = key === forwardKey || key === 'ArrowDown' ? index + 1 : key === backwardKey || key === 'ArrowUp' ? index - 1 : key === 'Home' ? 0 : key === 'End' ? navigable.length - 1 : null;
    if (next == null) return;
    event.preventDefault();
    const target = navigable[clamp(next, 0, navigable.length - 1)];
    setRovingCode(target.code);
    setActive(target.code);
    event.currentTarget.querySelector<SVGElement>(`[data-code="${CSS.escape(target.code ?? '')}"]`)?.focus();
  }

  const rowOnly = [...rows.keys()].filter(code => !shapes.some(shape => shape.code === code));
  const text = (value: string | null) => value ?? 'Unavailable';
  return <section className={cx('t98-map', className)} aria-label={label}>
    <h3 className="t98-map-title">{label}</h3>
    <div className="t98-map-context">{context}</div>
    <div className="t98-map-summary" id={`${id}-summary`}>{summary}</div>
    <div className="t98-map-toolbar" role="group" aria-label={`${label} zoom and pan`}>
      <Button className="t98-map-control" variant="secondary" disabled={zoom <= MIN_ZOOM} onClick={() => changeZoom(zoom - 1)}>Zoom out</Button>
      <Button className="t98-map-control" variant="secondary" disabled={zoom >= MAX_ZOOM} onClick={() => changeZoom(zoom + 1)}>Zoom in</Button>
      <Button className="t98-map-control" variant="secondary" disabled={zoom === MIN_ZOOM} onClick={() => movePan(-1, 0)}>Pan left</Button>
      <Button className="t98-map-control" variant="secondary" disabled={zoom === MIN_ZOOM} onClick={() => movePan(1, 0)}>Pan right</Button>
      <Button className="t98-map-control" variant="secondary" disabled={zoom === MIN_ZOOM} onClick={() => movePan(0, -1)}>Pan up</Button>
      <Button className="t98-map-control" variant="secondary" disabled={zoom === MIN_ZOOM} onClick={() => movePan(0, 1)}>Pan down</Button>
      <Button className="t98-map-control" variant="ghost" disabled={zoom === MIN_ZOOM && pan.x === 0 && pan.y === 0} onClick={() => { setZoom(MIN_ZOOM); setPan({ x: 0, y: 0 }); }}>Reset view</Button>
      <span className="t98-map-zoom">Zoom {zoom} of {MAX_ZOOM}</span>
    </div>
    <div className="t98-map-stage" role="group" aria-label={`${label} map. Arrow keys move between countries with data, Shift with arrow keys pans, plus and minus zoom.`}
      aria-describedby={`${id}-summary`} tabIndex={navigable.length === 0 ? 0 : undefined} onKeyDown={onKeyDown}>
      <svg className="t98-map-svg" viewBox={`${viewX} ${viewY} ${visibleWidth} ${visibleHeight}`} preserveAspectRatio="xMidYMid meet">
        <defs><pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse"><rect className="t98-map-pattern-base" width="6" height="6" /><path className="t98-map-pattern-line" d="M-1 7L7 -1" /></pattern></defs>
        {shapes.map((shape, index) => {
          const row = shape.code != null ? rows.get(shape.code) : undefined;
          const step = row ? stepOf(row.value) : null;
          const interactive = row != null && shape.code != null;
          const props = {
            d: shape.d, 'aria-label': describe(shape), 'data-code': shape.code ?? undefined,
            className: cx('t98-map-shape', step == null ? 't98-map-shape--nodata' : `t98-map-shape--step-${step}`, selectedCode != null && selectedCode === shape.code && 't98-map-shape--selected'),
            onMouseEnter: () => setActive(shape.code ?? shape.name), onMouseLeave: () => setActive(null),
          };
          if (!interactive) return <path key={`${shape.code ?? 'unmapped'}-${index}`} {...props} role="img" fill={step == null ? `url(#${patternId})` : undefined} data-nodata={step == null ? 'true' : undefined} />;
          return <path key={shape.code} {...props} fill={step == null ? `url(#${patternId})` : undefined} data-nodata={step == null ? 'true' : undefined}
            role={onSelect ? 'button' : 'img'} aria-pressed={onSelect && selectedCode !== undefined ? selectedCode === shape.code : undefined}
            tabIndex={shape.code === stop ? 0 : -1} onFocus={() => { setRovingCode(shape.code); setActive(shape.code); }} onBlur={() => setActive(null)}
            onClick={() => { setRovingCode(shape.code); onSelect?.(shape.code!); }}
            onKeyDown={event => { if (onSelect && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect(shape.code!); } }} />;
        })}
      </svg>
    </div>
    <StatusLine>{activeShape ? describe(activeShape) : 'Focus or hover a country to read its value.'}</StatusLine>
    <div className="t98-map-legend">
      <span className="t98-map-legend-title">{metricLabel}</span>
      <span className="t98-map-legend-scale" aria-hidden="true">{Array.from({ length: SCALE_STEPS }, (_, step) => <span key={step} className={`t98-map-swatch t98-map-swatch--step-${step}`} />)}</span>
      {numbers.length > 0 ? <span className="t98-map-legend-range">Lowest {lowRow?.valueText} · highest {highRow?.valueText}</span> : <span className="t98-map-legend-range">No values to scale</span>}
      {approximate && <span className="t98-map-note">Approximate map: boundaries are simplified and not authoritative.</span>}
      {overlapping && <span className="t98-map-note">Values are overlapping estimates, so they do not add up to a total.</span>}
      <span className="t98-map-legend-nodata"><svg className="t98-map-swatch-nodata" viewBox="0 0 6 6" aria-hidden="true"><rect className="t98-map-pattern-base" width="6" height="6" /><path className="t98-map-pattern-line" d="M-1 7L7 -1" /></svg> No data</span>
    </div>
    <div className="t98-map-details" role="region" tabIndex={0} aria-label={`${label} details`}>
      <table className="t98-map-table">
        <caption className="t98-map-caption">{label} details</caption>
        <thead><tr><th scope="col">Country</th><th scope="col" className="t98-map-table-value">{metricLabel}</th></tr></thead>
        <tbody>
          {[...shapes].filter(shape => shape.code != null).sort(compareNames).map(shape => {
            const row = rows.get(shape.code!);
            return <tr key={shape.code} data-nodata={row ? undefined : 'true'}><th scope="row">{shape.name}</th><td className="t98-map-table-value">{row ? row.valueText : 'No data'}</td></tr>;
          })}
          {rowOnly.sort().map(code => <tr key={code}><th scope="row">{code}</th><td className="t98-map-table-value">{rows.get(code)!.valueText}</td></tr>)}
        </tbody>
        <tfoot>
          <tr><th scope="row">Mapped total</th><td className="t98-map-table-value">{overlapping ? 'Not summed: estimates overlap' : text(unmappedSummary.mapped)}</td></tr>
          <tr><th scope="row">Unknown</th><td className="t98-map-table-value">{text(unmappedSummary.unknown)}</td></tr>
          <tr><th scope="row">Not recorded</th><td className="t98-map-table-value">{text(unmappedSummary.notRecorded)}</td></tr>
        </tfoot>
      </table>
    </div>
    <p className="t98-map-attribution">{attribution}</p>
  </section>;
}

export interface HeatmapPoint { x: number; y: number; count: number | null; label: string }
export interface HeatmapBand { from: number; to: number; /** Fraction 0-1; null renders as "Unavailable", never 0%. */ share: number | null; label: string }
export interface HeatmapPlaneProps {
  label: string;
  /** Coordinate space of the points and bands, in captured-viewport pixels. */
  geometry: { width: number; height: number };
  mode: 'click' | 'scroll';
  points?: readonly HeatmapPoint[];
  bands?: readonly HeatmapBand[];
  locale?: string;
  className?: string;
}

const percent = (value: number, locale = 'en') => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value);
const valid = (value: number | null): value is number => value != null && Number.isFinite(value);

/** An image-role overlay for VisualEvidenceFrame. Pair it with HeatmapRankedList in the frame's ranked slot. */
export function HeatmapPlane({ label, geometry, mode, points = [], bands = [], locale, className }: HeatmapPlaneProps) {
  const { width, height } = geometry;
  const sound = width > 0 && height > 0;
  const maximum = Math.max(0, ...points.map(point => point.count).filter(valid));
  return <div className={cx('t98-heatmap', className)} data-mode={mode} dir="ltr" role="img" aria-label={`${label}, ${mode === 'click' ? 'click density' : 'scroll depth'} overlay`} style={sound ? { aspectRatio: `${width} / ${height}` } : undefined}>
    {sound && mode === 'click' && points.filter(point => valid(point.count) && point.count > 0 && maximum > 0).map((point, index) =>
      <span key={`${point.x}-${point.y}-${index}`} className="t98-heatmap-point" title={`${point.label}: ${point.count}`} style={{ insetInlineStart: `${clamp(point.x / width, 0, 1) * 100}%`, insetBlockStart: `${clamp(point.y / height, 0, 1) * 100}%`, opacity: 0.15 + 0.85 * Math.sqrt(point.count! / maximum) }} />)}
    {sound && mode === 'scroll' && bands.map((band, index) => {
      const from = clamp(Math.min(band.from, band.to) / height, 0, 1);
      const to = clamp(Math.max(band.from, band.to) / height, 0, 1);
      return <span key={`${band.from}-${index}`} className={cx('t98-heatmap-band', !valid(band.share) && 't98-heatmap-band--unavailable')}
        style={{ insetBlockStart: `${from * 100}%`, blockSize: `${(to - from) * 100}%`, ['--t98-heat' as string]: valid(band.share) ? 0.12 + 0.55 * Math.sqrt(clamp(band.share, 0, 1)) : 0 }}>
        <span className="t98-heatmap-band-label">{band.label} · {valid(band.share) ? percent(band.share, locale) : 'Unavailable'}</span>
      </span>;
    })}
  </div>;
}

export interface HeatmapRankedListProps extends Pick<HeatmapPlaneProps, 'label' | 'mode' | 'points' | 'bands' | 'locale'> { className?: string }

/** Text equivalent of HeatmapPlane: points ranked by count, bands in page order. Missing values read "Unavailable". */
export function HeatmapRankedList({ label, mode, points = [], bands = [], locale, className }: HeatmapRankedListProps) {
  const ranked = [...points].sort((a, b) => (valid(b.count) ? b.count : -1) - (valid(a.count) ? a.count : -1));
  return <div className={cx('t98-heatmap-list', className)} role="region" tabIndex={0} aria-label={`${label} data`}>
    <table className="t98-heatmap-table">
      <caption className="t98-heatmap-caption">{label} {mode === 'click' ? 'click groups, most clicks first' : 'scroll bands, top to bottom'}</caption>
      {mode === 'click'
        ? <><thead><tr><th scope="col">Group</th><th scope="col">Position</th><th scope="col" className="t98-heatmap-number">Clicks</th></tr></thead>
          <tbody>{ranked.map((point, index) => <tr key={index}><th scope="row">{point.label}</th><td>x {point.x}, y {point.y}</td><td className="t98-heatmap-number">{valid(point.count) ? point.count : 'Unavailable'}</td></tr>)}</tbody></>
        : <><thead><tr><th scope="col">Band</th><th scope="col">Range</th><th scope="col" className="t98-heatmap-number">Share</th></tr></thead>
          <tbody>{bands.map((band, index) => <tr key={index}><th scope="row">{band.label}</th><td>{band.from}–{band.to}</td><td className="t98-heatmap-number">{valid(band.share) ? percent(band.share, locale) : 'Unavailable'}</td></tr>)}</tbody></>}
    </table>
  </div>;
}

export interface ReplayViewerProps {
  label: string;
  /** Visible session, scope, masking and capture context supplied by the app. */
  context: ReactNode;
  /** Accessible iframe title. */
  title: string;
  /** App-prepared, already authorized player document. Prefer this over `src`. */
  srcDoc?: string;
  src?: string;
  controls: ReplayControlsProps;
  /** Shown instead of the frame when the recording is unavailable, expired, loading or not authorized. */
  reason?: ReactNode;
  className?: string;
  /** CSP applied to a `srcDoc` document; defaults to `defaultReplayContentPolicy`, which runs no scripts and loads nothing from the
   * network. Passing a policy that allows scripts also enables `allow-scripts`: script in the document can then navigate its own
   * frame, which no CSP prevents, so only do that for a player you trust. Run scripted players on hostile data in `IsolatedPlayerFrame`. */
  contentPolicy?: string;
}

/** Content policy for srcDoc replay documents: no scripts run, styles and recorded media stay inline, nothing is fetched. Scripts are
 * blocked because a running script can navigate its own frame to any URL, which a content policy cannot stop. */
export const defaultReplayContentPolicy = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline' data: blob:; img-src data: blob:; media-src data: blob:; font-src data:; form-action 'none'; base-uri 'none'";
const allowsScripts = (policy: string) => !/(?:^|;)\s*script-src\s+'none'\s*(?:;|$)/i.test(policy);
/** Hosts an untrusted player document in a script-only sandbox with no same-origin access and no referrer; controls stay outside it.
 * A `srcDoc` player also gets a content policy so recorded pages cannot fetch, beacon or load remote assets while replaying. */
export function ReplayViewer({ label, context, title, srcDoc, src, controls, reason, className, contentPolicy = defaultReplayContentPolicy }: ReplayViewerProps) {
  const hasDocument = srcDoc !== undefined || src !== undefined;
  return <section className={cx('t98-replay-viewer', className)} aria-label={label}>
    <h3 className="t98-replay-viewer-title">{label}</h3>
    <div className="t98-replay-viewer-context">{context}</div>
    {reason != null || !hasDocument
      ? <div className="t98-replay-viewer-reason" role="status">{reason ?? 'No replay document was supplied.'}</div>
      : <iframe className="t98-replay-frame" title={title} sandbox={srcDoc === undefined || allowsScripts(contentPolicy) ? 'allow-scripts' : ''} referrerPolicy="no-referrer" srcDoc={srcDoc === undefined ? undefined : prefixDocument(srcDoc, contentPolicyMeta(contentPolicy))} src={srcDoc === undefined ? src : undefined} />}
    <ReplayControls {...controls} />
  </section>;
}

/** Commands the app may send once the player is ready. */
export type IsolatedPlayerCommand = Exclude<PlayerCommand, { type: 'init' } | { type: 'destroy' }>;
export interface IsolatedPlayerHandle {
  /** Sends a validated command; false when the player is not ready or the command is out of range. */
  send: (command: IsolatedPlayerCommand) => boolean;
}
export interface IsolatedPlayerFrameProps {
  /** The frame's accessible name. */
  title: string;
  /** The app's player script: an https URL or a root-relative path. It runs inside the isolated document with a per-mount nonce. */
  playerSrc: string;
  /** Subresource Integrity hash for the player script. */
  integrity?: string;
  /** Sent to the player over the channel only after it proves it is this mount's document. */
  payload: unknown;
  onReady?: (duration: number) => void;
  onTick?: (time: number, playing: boolean) => void;
  onEnded?: () => void;
  /** Called once when the player fails, times out or breaks the protocol; the frame is then destroyed. */
  onFail?: () => void;
  /** Upper bounds for position commands, for example page size minus viewport size. */
  positionMax?: { x: number; y: number };
  /** Milliseconds from load to a valid `ready` before failing closed. Default 8000. */
  timeoutMs?: number;
  /** Allows blob: workers inside the player (for example for decompression). Off by default. */
  workers?: boolean;
  failMessage?: ReactNode;
  retryLabel?: string;
  preparingMessage?: ReactNode;
  ref?: Ref<IsolatedPlayerHandle>;
  className?: string;
}

/**
 * Runs an app-owned player script on hostile data (for example rrweb session events) in an isolated frame.
 * The frame always loads a data: document, whose origin is opaque, so `allow-scripts allow-same-origin` (needed for the
 * player's own nested frames) can never reach the app; srcdoc, blob: and same-origin sources are refused. The document
 * starts with a CSP that blocks every connection. Handshake: on load the app transfers a MessagePort (the only message
 * sent to the window, and it carries no data); the player must answer over the port with this mount's token, which only
 * this document holds; only then is the payload sent. Anything late, malformed or out of order fails closed and destroys
 * the player; retry remounts with a new nonce and token. Threat model: issue #17 (U25).
 */
export function IsolatedPlayerFrame({ title, playerSrc, integrity, payload, onReady, onTick, onEnded, onFail, positionMax, timeoutMs = 8000, workers = false,
  failMessage = 'The player could not start safely. Nothing from it was trusted.', retryLabel = 'Retry', preparingMessage = 'Preparing the isolated player…', ref, className, ...rest }: IsolatedPlayerFrameProps) {
  // Only a data: document may host the player; a caller passing a frame source is refused rather than silently ignored.
  const refusedSource = 'src' in rest || 'srcDoc' in rest || 'srcdoc' in rest;
  const [attempt, setAttempt] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [status, setStatus] = useState<'preparing' | 'ready' | 'failed' | 'refused'>(refusedSource ? 'refused' : 'preparing');
  const frame = useRef<HTMLIFrameElement>(null);
  const live = useRef({ port: null as MessagePort | null, timer: null as ReturnType<typeof setTimeout> | null, token: '', greeted: false, loaded: false, done: false, duration: null as number | null });
  const latest = useRef({ payload, onReady, onTick, onEnded, onFail, positionMax });
  latest.current = { payload, onReady, onTick, onEnded, onFail, positionMax };

  function close() {
    const state = live.current;
    if (state.timer !== null) clearTimeout(state.timer);
    state.timer = null;
    if (state.port) { try { state.port.postMessage({ type: 'destroy' }); } catch { /* already closed */ } state.port.close(); }
    state.port = null;
  }
  function fail() {
    const state = live.current;
    if (state.done) return;
    state.done = true;
    close();
    setStatus('failed');
    latest.current.onFail?.();
  }

  // Built after mount only, so the nonce and token never appear in server-rendered HTML.
  useEffect(() => {
    if (refusedSource) return;
    const scriptUrl = playerScriptUrl(playerSrc, window.location.href);
    if (!scriptUrl) { setStatus('refused'); return; }
    const token = randomToken();
    live.current = { port: null, timer: null, token, greeted: false, loaded: false, done: false, duration: null };
    setStatus('preparing');
    setSource(playerFrameSource(playerDocument({ scriptUrl, nonce: randomToken(), token, integrity, workers })));
    return close;
  }, [attempt, playerSrc, integrity, workers, refusedSource]);

  function loaded() {
    const state = live.current;
    // A second load means the frame navigated away from the document this mount built.
    if (state.loaded) { fail(); return; }
    state.loaded = true;
    state.timer = setTimeout(fail, timeoutMs);
    const channel = new MessageChannel();
    state.port = channel.port1;
    channel.port1.onmessage = event => {
      if (state.done || live.current !== state) return;
      const message = parsePlayerMessage(event.data, state.duration);
      if (!message) { fail(); return; }
      if (!state.greeted) {
        if (message.type !== 'hello' || message.token !== state.token) { fail(); return; }
        state.greeted = true;
        channel.port1.postMessage({ type: 'init', protocol: PLAYER_PROTOCOL, payload: latest.current.payload });
        return;
      }
      switch (message.type) {
        case 'ready':
          if (state.duration !== null) { fail(); return; }
          if (state.timer !== null) clearTimeout(state.timer);
          state.timer = null; state.duration = message.duration;
          setStatus('ready'); latest.current.onReady?.(message.duration); return;
        case 'tick': latest.current.onTick?.(message.time, message.playing); return;
        case 'ended': latest.current.onEnded?.(); return;
        default: fail();
      }
    };
    channel.port1.start();
    // The one window message: an opaque origin cannot be named as a target, so it carries only the port, never data.
    frame.current?.contentWindow?.postMessage({ type: PLAYER_CONNECT, protocol: PLAYER_PROTOCOL }, '*', [channel.port2]);
  }

  useImperativeHandle(ref, () => ({
    send(command) {
      const state = live.current;
      if (status !== 'ready' || !state.port || state.done || !validCommand(command, state.duration, latest.current.positionMax)) return false;
      state.port.postMessage(command);
      return true;
    },
  }), [status]);

  if (status === 'refused') return <p className={cx('t98-player-frame-reason', className)} role="alert">The player was refused: it can only run from an https or root-relative script inside an isolated data: document.</p>;
  return <div className={cx('t98-player-frame', className)}>
    {status === 'failed' ? <Alert tone="danger" title="Player stopped">{failMessage}<div className="t98-player-frame-retry"><Button variant="secondary" onClick={() => setAttempt(value => value + 1)}>{retryLabel}</Button></div></Alert>
      : source && <iframe key={attempt} ref={frame} className="t98-player-frame-frame" title={title} sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" tabIndex={-1} src={source} onLoad={loaded} />}
    <p className="t98-player-frame-status" role="status">{status === 'preparing' ? preparingMessage : ''}</p>
  </div>;
}
