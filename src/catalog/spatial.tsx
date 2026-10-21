import { useState } from 'react';
import { CountryMap, HeatmapPlane, HeatmapRankedList, ReplayViewer } from '../lib/spatial.js';
import { CalendarMonth } from '../lib/calendar.js';
import { VisualEvidenceFrame } from '../lib/inspection.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

const prop = (name: string, type: string, description: string, required = false): ComponentProp => ({ name, type, description, required });
const surfaceTokens = ['--t98-font', '--t98-text', '--t98-muted', '--t98-surface', '--t98-subtle', '--t98-border', '--t98-radius', '--t98-space-2', '--t98-space-3', '--t98-space-4'];
const controlTokens = ['--t98-accent', '--t98-accent-soft', '--t98-focus', '--t98-control-touch'];

// Two rectangles stand in for app-supplied geometry; the library ships no country shapes.
const shapeCode = `const shapes = [
  { code: 'AA', name: 'Sample shape A', d: 'M5 5H55V55H5Z' },
  { code: 'BB', name: 'Sample shape B', d: 'M65 5H115V55H65Z' },
  { code: 'CC', name: 'Sample shape C (no row)', d: 'M35 65H85V95H35Z' },
];
const rows = new Map([
  ['AA', { value: 1200, valueText: '1,200 sessions' }],
  ['BB', { value: 300, valueText: '300 sessions' }],
]);`;
const mapProps = `label="Sessions by country · sample shapes"
  context="Synthetic demonstration · sessions · 1–18 October 2026 · UTC"
  summary="Sample shape A has the most sessions. Sample shape C has no data."
  shapes={shapes} viewBox="0 0 120 100" rows={rows} metricLabel="Sessions"
  attribution="Sample rectangles drawn for this demonstration; no real boundaries."
  unmappedSummary={{ mapped: '1,500 sessions', unknown: '40 sessions', notRecorded: null }}`;

function MapDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const shapes = [
    { code: 'AA', name: 'Sample shape A', d: 'M5 5H55V55H5Z' }, { code: 'BB', name: 'Sample shape B', d: 'M65 5H115V55H65Z' }, { code: 'CC', name: 'Sample shape C (no row)', d: 'M35 65H85V95H35Z' },
  ];
  const rows = new Map([['AA', { value: 1200, valueText: '1,200 sessions' }], ['BB', { value: 300, valueText: '300 sessions' }]]);
  return <CountryMap label="Sessions by country · sample shapes" context="Synthetic demonstration · sessions · 1–18 October 2026 · UTC"
    summary="Sample shape A has the most sessions. Sample shape C has no data." shapes={shapes} viewBox="0 0 120 100" rows={rows} metricLabel="Sessions"
    attribution="Sample rectangles drawn for this demonstration; no real boundaries." selectedCode={selected} onSelect={setSelected}
    unmappedSummary={{ mapped: '1,500 sessions', unknown: '40 sessions', notRecorded: null }} />;
}

const heatPoints = `const points = [
  { x: 480, y: 150, count: 12, label: 'Add to cart' },
  { x: 200, y: 160, count: 8, label: 'Product details' },
  { x: 320, y: 300, count: null, label: 'Footer link' },
];
const bands = [
  { from: 0, to: 180, share: 0.9, label: 'Top' },
  { from: 180, to: 360, share: null, label: 'Bottom' },
];`;
function HeatDemo({ mode }: { mode: 'click' | 'scroll' }) {
  const points = [{ x: 480, y: 150, count: 12, label: 'Add to cart' }, { x: 200, y: 160, count: 8, label: 'Product details' }, { x: 320, y: 300, count: null, label: 'Footer link' }];
  const bands = [{ from: 0, to: 180, share: 0.9, label: 'Top' }, { from: 180, to: 360, share: null, label: 'Bottom' }];
  return <VisualEvidenceFrame label={`${mode === 'click' ? 'Click' : 'Scroll'} evidence · synthetic page`} context="Synthetic demonstration · captured viewport 640 × 360 · UTC" alignment="aligned"
    background={<svg viewBox="0 0 640 360" role="img" aria-label="Synthetic page"><rect width="640" height="360" fill="var(--t98-subtle)" /></svg>}
    overlay={<HeatmapPlane label="Synthetic page" geometry={{ width: 640, height: 360 }} mode={mode} points={points} bands={bands} />}
    rankedListLabel={mode === 'click' ? 'Click groups' : 'Scroll bands'} rankedList={<HeatmapRankedList label="Synthetic page" mode={mode} points={points} bands={bands} />} />;
}
const heatExample = (mode: 'click' | 'scroll') => tsx(['VisualEvidenceFrame', 'HeatmapPlane', 'HeatmapRankedList'], `<VisualEvidenceFrame label="${mode === 'click' ? 'Click' : 'Scroll'} evidence" context="Synthetic demonstration · captured viewport 640 × 360 · UTC" alignment="aligned"
  background={<svg viewBox="0 0 640 360" role="img" aria-label="Synthetic page"><rect width="640" height="360" fill="var(--t98-subtle)" /></svg>}
  overlay={<HeatmapPlane label="Synthetic page" geometry={{ width: 640, height: 360 }} mode="${mode}" points={points} bands={bands} />}
  rankedListLabel="${mode === 'click' ? 'Click groups' : 'Scroll bands'}" rankedList={<HeatmapRankedList label="Synthetic page" mode="${mode}" points={points} bands={bands} />} />`, heatPoints);

const replayControls = `const controls = {
  playing: false, onPlayingChange: () => {}, currentTime: 12, duration: 90, onSeek: () => {},
  playbackRate: 1, allowedRates: [0.5, 1, 2], onRateChange: () => {},
};`;
const replayDoc = '<!doctype html><body style="font-family:sans-serif"><p>Synthetic replay document. The app supplies the real, authorized player.</p></body>';
function ReplayDemo({ unavailable }: { unavailable?: boolean }) {
  const [time, setTime] = useState(12);
  return <ReplayViewer label="Session replay · synthetic" context="Session demo-018 · captured 18 October 2026, 08:00 UTC" title="Synthetic session replay" srcDoc={replayDoc}
    reason={unavailable ? 'The recording has expired. The application owns retention and retry.' : undefined}
    controls={{ playing: false, onPlayingChange: () => {}, currentTime: unavailable ? null : time, duration: unavailable ? null : 90, onSeek: setTime, playbackRate: 1, allowedRates: [0.5, 1, 2], onRateChange: () => {}, disabled: unavailable }} />;
}

const calendarSetup = `const [month, setMonth] = useState({ year: 2026, month: 10 });
const step = (delta: number) => setMonth(({ year, month }) => { const index = year * 12 + month - 1 + delta; return { year: Math.floor(index / 12), month: (index % 12) + 1 }; });
const days = new Map([
  ['2026-10-21', [{ id: 'launch', label: 'Launch post', time: '09:30', onSelect: () => {} }]],
  ['2026-10-23', [{ id: 'review', label: 'Review draft' }]],
]);`;
function CalendarDemo({ locked }: { locked?: boolean }) {
  const [month, setMonth] = useState({ year: 2026, month: 10 });
  const step = (delta: number) => setMonth(({ year, month: m }) => { const index = year * 12 + m - 1 + delta; return { year: Math.floor(index / 12), month: (index % 12) + 1 }; });
  const days = new Map([['2026-10-21', [{ id: 'launch', label: 'Launch post', time: '09:30', onSelect: () => {} }]], ['2026-10-23', [{ id: 'review', label: 'Review draft' }]]]);
  return <CalendarMonth month={month} weekStartsOn={1} locale="en-GB" today="2026-10-21" days={days} onPrev={() => step(-1)} onNext={() => step(1)} onToday={() => setMonth({ year: 2026, month: 10 })}
    onCreateDay={() => {}} createDisabledReason={locked ? 'Creating entries is disabled: you have read-only access.' : undefined} />;
}
const mapCode = tsx(['CountryMap'], `<CountryMap
  ${mapProps} />`, shapeCode);
const replayCode = (reason: boolean) => tsx(['ReplayViewer'], `<ReplayViewer label="Session replay" context="Session demo-018 · captured 18 October 2026, 08:00 UTC" title="Synthetic session replay"
  ${reason ? 'reason="The recording has expired." ' : 'srcDoc={doc} '}controls={controls} />`, `const doc = ${JSON.stringify(replayDoc)};
${replayControls}`);
const calendarCode = (locked: boolean) => tsx(['CalendarMonth'], `<CalendarMonth month={month} weekStartsOn={1} locale="en-GB" today="2026-10-21" days={days}
  onPrev={() => step(-1)} onNext={() => step(1)} onToday={() => setMonth({ year: 2026, month: 10 })}
  onCreateDay={() => {}}${locked ? "\n  createDisabledReason=\"Creating entries is disabled: you have read-only access.\"" : ''} />`, calendarSetup, ['useState']);

export const spatialEntries: ComponentEntry[] = [
  {
    name: 'CountryMap', category: 'Data display', description: 'Choropleth over app-supplied shapes with a roving single tab stop, zoom and pan controls, a polite status line and a mandatory details table.',
    usage: 'Use for country breakdowns. The app supplies the geometry, its attribution, the values and every total; the library ships no boundaries. Countries without a row use a hatched no-data pattern and are never drawn as zero. Unknown and Not recorded totals stay in the details table; a null total reads Unavailable.',
    props: [prop('label / context / summary', 'string / ReactNode / ReactNode', 'Heading, visible scope and plain-language reading.', true), prop('shapes / viewBox', 'CountryShape[] / string', 'App paths ({ code | null, name, d }) and the SVG viewBox they use.', true), prop('rows / metricLabel', 'Map<string, { value: number | null; valueText: string }> / string', 'Values by country code and the metric name.', true), prop('attribution', 'ReactNode', 'Required geometry and data attribution.', true), prop('unmappedSummary', '{ mapped; unknown; notRecorded } (string | null)', 'App-formatted totals shown in the details table.', true), prop('selectedCode / onSelect', 'string | null / (code) => void', 'Optional activation of countries that have rows.')],
    tokens: [...surfaceTokens, ...controlTokens],
    accessibility: ['Countries with rows share one tab stop; arrow keys move between them in name order, Home and End jump, Shift with arrows pans, plus and minus zoom.', 'Zoom and pan also have labelled buttons. A polite status line reads the focused or hovered country.', 'The details table carries every value, no-data label and total, so the map is never the only source.'],
    related: ['HeatmapPlane', 'DataTable', 'StatusLine'], example: tsx(['CountryMap'], `<CountryMap\n  ${mapProps} />`, shapeCode),
    states: [{ name: 'Choropleth with no-data shape', description: 'Two valued shapes and one without a row.', preview: <MapDemo />, code: mapCode }],
  },
  {
    name: 'HeatmapPlane', category: 'Data display', description: 'An image-role click-density or scroll-band overlay for VisualEvidenceFrame, with a companion HeatmapRankedList table.',
    usage: 'Pass as the frame overlay and pair HeatmapRankedList in the ranked slot. Click density uses a square-root opacity scale; scroll bands show a share label. A null share or count reads Unavailable and is never drawn or listed as zero. The plane is forced left-to-right so x positions match the capture.',
    props: [prop('label / geometry / mode', 'string / { width; height } / "click" | "scroll"', 'Name, captured-viewport size and rendering mode.', true), prop('points', '{ x; y; count: number | null; label }[]', 'Click groups in captured-viewport pixels.'), prop('bands', '{ from; to; share: number | null; label }[]', 'Scroll bands with a 0-1 share.'), prop('locale', 'string', 'Percent formatting locale; defaults to en.')],
    tokens: [...surfaceTokens, '--t98-danger'],
    accessibility: ['The plane has role img and an accessible name; HeatmapRankedList is the keyboard-reachable table equivalent.', 'Density never relies on colour alone: every value is also in the table, and band labels print the share.'],
    related: ['VisualEvidenceFrame', 'HeatmapRankedList'], example: heatExample('click'),
    states: [{ name: 'Click density', description: 'Dots with sqrt opacity and an unavailable count.', preview: <HeatDemo mode="click" />, code: heatExample('click') }, { name: 'Scroll bands', description: 'Shaded rows; a null share is Unavailable.', preview: <HeatDemo mode="scroll" />, code: heatExample('scroll') }],
  },
  {
    name: 'HeatmapRankedList', category: 'Data display', description: 'Accessible table of HeatmapPlane data: click groups ranked by count, or scroll bands in page order.',
    usage: 'Place in VisualEvidenceFrame rankedList. Takes the same label, mode, points, bands and locale as HeatmapPlane so the data is available without the image.',
    props: [prop('label / mode', 'string / "click" | "scroll"', 'Table name and which data to list.', true), prop('points / bands / locale', 'HeatmapPoint[] / HeatmapBand[] / string', 'Same data as HeatmapPlane.')],
    tokens: surfaceTokens,
    accessibility: ['Scrollable region is focusable and labelled; table has a caption and row headers.', 'Missing counts and shares read Unavailable.'],
    related: ['HeatmapPlane', 'VisualEvidenceFrame'], example: heatExample('scroll'),
    states: [{ name: 'Alongside the plane', description: 'See the HeatmapPlane specimens: the table is the ranked slot.', preview: <HeatmapRankedList label="Synthetic page" mode="click" points={[{ x: 480, y: 150, count: 12, label: 'Add to cart' }]} />, code: heatExample('click') }],
  },
  {
    name: 'ReplayViewer', category: 'Data display', description: 'Sandboxed iframe host for an app-supplied replay document, with ReplayControls rendered outside the frame.',
    usage: 'Supply an authorized srcDoc (preferred) or src. The frame is sandbox="allow-scripts" only, never allow-same-origin, with no referrer. When the recording is unavailable pass a reason; it replaces the frame. The app owns loading, masking, expiry and playback.',
    props: [prop('label / context / title', 'string / ReactNode / string', 'Heading, visible scope and iframe title.', true), prop('srcDoc / src', 'string', 'Player document; srcDoc wins.'), prop('controls', 'ReplayControlsProps', 'Controlled playback requests rendered below the frame.', true), prop('reason', 'ReactNode', 'Shown instead of the frame when unavailable.')],
    tokens: [...surfaceTokens, ...controlTokens],
    accessibility: ['The iframe has a title; the unavailable reason is a status region.', 'Controls are native and outside the frame, so keyboard users never get trapped by player content.'],
    related: ['ReplayControls', 'VisualEvidenceFrame'], example: tsx(['ReplayViewer'], `<ReplayViewer label="Session replay" context="Session demo-018 · captured 18 October 2026, 08:00 UTC" title="Synthetic session replay"\n  srcDoc={doc} controls={controls} />`, `const doc = ${JSON.stringify(replayDoc)};\n${replayControls}`),
    states: [{ name: 'Player document', description: 'Sandboxed synthetic document.', preview: <ReplayDemo />, code: replayCode(false) }, { name: 'Unavailable', description: 'Reason replaces the frame.', preview: <ReplayDemo unavailable />, code: replayCode(true) }],
  },
  {
    name: 'CalendarMonth', category: 'Data display', description: 'Month grid with APG date-picker keyboard navigation, outside-month and today states, entry buttons and a visible create-disabled reason.',
    usage: 'Controlled month grid only; use PublishingAgenda for a list. The app supplies the month, today, entries and navigation callbacks. Dates are UTC and names use the explicit locale. PageUp and PageDown call onPrev and onNext.',
    props: [prop('month / weekStartsOn / locale / today', '{ year; month (1-12) } / 0 | 1 / string / YYYY-MM-DD', 'Displayed month, first weekday, locale and the app date.', true), prop('days', 'Map<YYYY-MM-DD, { id; label; time?; onSelect? }[]>', 'Entries per day.', true), prop('onPrev / onNext / onToday', '() => void', 'Month navigation requests.', true), prop('onCreateDay / createDisabledReason', '(iso) => void / ReactNode', 'Per-day create; the reason stays visible and disables the buttons.')],
    tokens: [...surfaceTokens, ...controlTokens, '--t98-warning'],
    accessibility: ['role grid with column headers; one roving tab stop. Arrows move by day or week, Home and End move within the week, PageUp and PageDown change month.', 'Today and outside-month days are named in the cell label and marked without relying on colour.', 'Entries and create are buttons; the grid scrolls horizontally on very narrow screens.'],
    related: ['PublishingAgenda', 'DateTimeField', 'Button'], example: calendarCode(false),
    states: [{ name: 'Month grid', description: 'Entries, today and outside days.', preview: <CalendarDemo />, code: calendarCode(false) }, { name: 'Create disabled', description: 'The reason is shown, not hidden.', preview: <CalendarDemo locked />, code: calendarCode(true) }],
  },
];
