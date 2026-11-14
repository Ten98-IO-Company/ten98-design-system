import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarMonth, CountryMap, Heading, HeatmapPlane, HeatmapRankedList, ReplayViewer, Stack, Text, VisualEvidenceFrame, type CalendarEntry } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';

const shapes = [
  { code: 'AA', name: 'Alpha sample', d: 'M5 5H55V55H5Z' }, { code: 'BB', name: 'Beta sample', d: 'M65 5H115V55H65Z' },
  { code: 'CC', name: 'Gamma sample (no row)', d: 'M35 65H85V95H35Z' }, { code: 'DD', name: 'Delta sample', d: 'M95 65H115V95H95Z' },
];
const rows = new Map([['AA', { value: 1200, valueText: '1,200 sessions' }], ['BB', { value: 300, valueText: '300 sessions' }], ['DD', { value: null, valueText: 'Unavailable' }]]);
const points = [{ x: 480, y: 150, count: 12, label: 'Add to cart' }, { x: 200, y: 160, count: 8, label: 'Product details' }, { x: 320, y: 300, count: null, label: 'Footer link' }];
const bands = [{ from: 0, to: 180, share: 0.9, label: 'Top half' }, { from: 180, to: 360, share: null, label: 'Bottom half' }];
// The probe image must stay blocked: replayed pages may not reach the network from the viewer's browser.
const doc = '<!doctype html><body><p>Synthetic replay document with a deliberately long unbroken sentence to test wrapping inside the sandbox.</p><img alt="" src="/tests/replay-probe.png"></body>';
const days: Map<string, CalendarEntry[]> = new Map([
  ['2026-10-21', [{ id: 'launch', label: 'Launch the quarterly campaign post', time: '09:30', onSelect: () => {} }]],
  ['2026-10-23', [{ id: 'review', label: 'Review the draft announcement for the regional partner newsletter before Friday' }]],
  ['2026-10-25', [{ id: 'post', label: 'Publish the spring studio drop', time: '14:00', network: 'Instagram', status: 'Scheduled', tone: 'info', onSelect: () => {} }]],
]);

function Screen() {
  const [month, setMonth] = useState({ year: 2026, month: 10 });
  const [log, setLog] = useState('');
  const step = (delta: number) => { setLog(delta < 0 ? 'prev' : 'next'); setMonth(({ year, month: m }) => { const index = year * 12 + m - 1 + delta; return { year: Math.floor(index / 12), month: (index % 12) + 1 }; }); };
  const [time, setTime] = useState(12);
  return <Stack as="main" gap={6} id="spatial">
    <Heading level={1}>Spatial and calendar</Heading>
    <CountryMap label="Sessions by country" context="Synthetic demonstration · sessions · UTC" summary="Alpha has the most sessions; Gamma has no data."
      shapes={shapes} viewBox="0 0 120 100" rows={rows} metricLabel="Sessions" attribution="Sample rectangles only; no real boundaries."
      unmappedSummary={{ mapped: '1,500 sessions', unknown: '40 sessions', notRecorded: null }} onSelect={() => {}} />
    <VisualEvidenceFrame label="Scroll evidence" context="Synthetic demonstration · captured viewport 640 × 360 · UTC" alignment="aligned"
      background={<svg viewBox="0 0 640 360" role="img" aria-label="Synthetic page"><rect width="640" height="360" fill="var(--t98-subtle)" /></svg>}
      overlay={<HeatmapPlane label="Synthetic page" geometry={{ width: 640, height: 360 }} mode="scroll" points={points} bands={bands} />}
      rankedListLabel="Scroll bands" rankedList={<HeatmapRankedList label="Synthetic page" mode="scroll" points={points} bands={bands} />} />
    <VisualEvidenceFrame label="Click evidence" context="Synthetic demonstration · captured viewport 640 × 360 · UTC" alignment="aligned"
      background={<svg viewBox="0 0 640 360" role="img" aria-label="Synthetic page"><rect width="640" height="360" fill="var(--t98-subtle)" /></svg>}
      overlay={<HeatmapPlane label="Synthetic page" geometry={{ width: 640, height: 360 }} mode="click" points={points} bands={bands} />}
      rankedListLabel="Click groups" rankedList={<HeatmapRankedList label="Synthetic page" mode="click" points={points} bands={bands} />} />
    <ReplayViewer label="Session replay" context="Session demo-018 · captured 18 October 2026, 08:00 UTC" title="Synthetic session replay" srcDoc={doc}
      controls={{ playing: false, onPlayingChange: () => {}, currentTime: time, duration: 90, onSeek: setTime, playbackRate: 1, allowedRates: [1, 2, 4, 8], onRateChange: () => {}, skipInactive: true, onSkipInactiveChange: () => {} }} />
    <CalendarMonth month={month} weekStartsOn={1} locale="en-GB" today="2026-10-21" days={days} onPrev={() => step(-1)} onNext={() => step(1)}
      onToday={() => { setLog('today'); setMonth({ year: 2026, month: 10 }); }} onCreateDay={() => {}} isCreatable={iso => iso >= '2026-10-21'} createDisabledReason="Creating entries is disabled: read-only access." />
    <Text id="log">{log}</Text>
  </Stack>;
}

createRoot(document.getElementById('spatial-fixture')!).render(<Screen />);
