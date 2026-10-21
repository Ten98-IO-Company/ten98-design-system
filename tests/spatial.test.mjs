import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CountryMap, HeatmapPlane, HeatmapRankedList, ReplayViewer } from '../dist/spatial.js';
import { CalendarMonth } from '../dist/calendar.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const render = (component, props) => renderToStaticMarkup(h(component, props));

const controls = { playing: false, onPlayingChange() {}, currentTime: 12, duration: 90, onSeek() {}, playbackRate: 1, allowedRates: [1], onRateChange() {} };
const replay = { label: 'Replay', context: 'Session demo', title: 'Synthetic replay', srcDoc: '<p>player</p>', controls };
const map = {
  label: 'Sessions', context: 'Sample', summary: 'Summary', viewBox: '0 0 100 60', metricLabel: 'Sessions', attribution: 'Sample shapes only',
  shapes: [{ code: 'AA', name: 'Alpha', d: 'M0 0H40V40H0Z' }, { code: 'BB', name: 'Beta', d: 'M50 0H90V40H50Z' }, { code: 'CC', name: 'Gamma', d: 'M0 45H40V60H0Z' }],
  rows: new Map([['AA', { value: 10, valueText: '10 sessions' }], ['BB', { value: 0, valueText: '0 sessions' }]]),
  unmappedSummary: { mapped: '10 sessions', unknown: '4 sessions', notRecorded: null },
};
const calendar = { month: { year: 2026, month: 10 }, weekStartsOn: 1, locale: 'en-GB', today: '2026-10-21', days: new Map([['2026-10-21', [{ id: 'a', label: 'Launch', time: '09:30', onSelect() {} }]]]), onPrev() {}, onNext() {}, onToday() {} };

const emitted = [];
const capture = html => { emitted.push(html); return html; };

test('the replay iframe is script-only sandboxed, never same-origin, and controls stay outside it', () => {
  const html = capture(render(ReplayViewer, replay));
  assert.match(html, /<iframe[^>]*sandbox="allow-scripts"/);
  assert.doesNotMatch(html, /allow-same-origin/);
  assert.match(html, /referrerPolicy="no-referrer"|referrerpolicy="no-referrer"/);
  assert.match(html, /title="Synthetic replay"/);
  assert.ok(html.indexOf('</iframe>') < html.indexOf('t98-replay-controls'));
});

test('a srcDoc replay starts with a no-network content policy, after any doctype', () => {
  const head = render(ReplayViewer, { ...replay, srcDoc: '<!doctype html><html><head><title>p</title></head><body></body></html>' });
  // The policy goes after the doctype, before the document's own head, so nothing in the document can precede it.
  assert.match(head, /srcDoc="&lt;!doctype html&gt;&lt;meta http-equiv=&quot;Content-Security-Policy&quot; content=&quot;default-src &#x27;none&#x27;;[^"]*&gt;&lt;html&gt;&lt;head&gt;&lt;title&gt;/);
  const commented = render(ReplayViewer, { ...replay, srcDoc: '<!--<head>--><p>x</p>' });
  assert.match(commented, /srcDoc="&lt;meta http-equiv=&quot;Content-Security-Policy&quot;[^"]*&gt;&lt;!--&lt;head&gt;--&gt;/);
  const bare = render(ReplayViewer, { ...replay, srcDoc: '<!DOCTYPE html><p>x</p>' });
  assert.match(bare, /srcDoc="&lt;!DOCTYPE html&gt;&lt;meta http-equiv=&quot;Content-Security-Policy&quot;/);
  assert.match(render(ReplayViewer, replay), /srcDoc="&lt;meta http-equiv=&quot;Content-Security-Policy&quot;[^"]*&gt;&lt;p&gt;player/);
  assert.match(render(ReplayViewer, { ...replay, contentPolicy: "default-src 'self'" }), /content=&quot;default-src/);
  assert.doesNotMatch(render(ReplayViewer, { ...replay, srcDoc: undefined, src: '/player.html' }), /Content-Security-Policy/);
});

test('an unavailable replay shows the reason and no iframe', () => {
  const html = capture(render(ReplayViewer, { ...replay, reason: 'The recording expired.' }));
  assert.match(html, /The recording expired\./);
  assert.doesNotMatch(html, /<iframe/);
  assert.doesNotMatch(render(ReplayViewer, { ...replay, srcDoc: undefined }), /<iframe/);
});

test('the map details table lists Unknown and Not recorded, marks no-data countries and has one tab stop', () => {
  const html = capture(render(CountryMap, map));
  assert.match(html, /<th[^>]*>Unknown<\/th><td[^>]*>4 sessions/);
  assert.match(html, /<th[^>]*>Not recorded<\/th><td[^>]*>Unavailable/);
  assert.match(html, /Mapped total/);
  assert.match(html, /<tr data-nodata="true"><th[^>]*>Gamma<\/th><td[^>]*>No data/);
  assert.match(html, /data-code="CC"[^>]*data-nodata="true"|data-nodata="true"[^>]*data-code="CC"/);
  assert.equal([...html.matchAll(/class="t98-map-shape[^"]*"[^>]*tabindex="0"|tabindex="0"[^>]*class="t98-map-shape/g)].length, 1);
  assert.equal([...html.matchAll(/tabindex="0"/g)].length - 1, 1, 'one shape stop plus the labelled details scroller');
  assert.doesNotMatch(html, /Gamma: Sessions/);
  assert.match(html, /Sample shapes only/);
  // A real zero is a value, a missing row is not.
  assert.match(html, /Beta: Sessions 0 sessions/);
});

test('heatmap band share null reads Unavailable, never 0, and the plane is left-to-right', () => {
  const bands = [{ from: 0, to: 100, share: 0.5, label: 'Top' }, { from: 100, to: 200, share: null, label: 'Bottom' }];
  const plane = capture(render(HeatmapPlane, { label: 'Page', geometry: { width: 400, height: 200 }, mode: 'scroll', bands }));
  assert.match(plane, /dir="ltr"/);
  assert.match(plane, /role="img"/);
  assert.match(plane, /Bottom · Unavailable/);
  assert.match(plane, /Top · 50%/);
  const list = capture(render(HeatmapRankedList, { label: 'Page', mode: 'scroll', bands }));
  assert.match(list, /Unavailable/);
  assert.doesNotMatch(list, /Bottom<\/th><td>100–200<\/td><td[^>]*>0%/);
  const clicks = [{ x: 10, y: 10, count: 4, label: 'A' }, { x: 20, y: 20, count: 16, label: 'B' }, { x: 30, y: 30, count: null, label: 'C' }];
  const points = capture(render(HeatmapPlane, { label: 'Page', geometry: { width: 400, height: 200 }, mode: 'click', points: clicks }));
  assert.equal([...points.matchAll(/t98-heatmap-point/g)].length, 2, 'unavailable counts are not drawn');
  assert.match(points, /opacity:1/);
  assert.match(points, /opacity:0\.575/);
  const ranked = render(HeatmapRankedList, { label: 'Page', mode: 'click', points: clicks });
  assert.ok(ranked.indexOf('>B<') < ranked.indexOf('>A<') && ranked.indexOf('>A<') < ranked.indexOf('>C<'));
});

test('the calendar is a grid with weekday headers, today and outside states and a visible disabled-create reason', () => {
  const html = capture(render(CalendarMonth, { ...calendar, onCreateDay() {}, createDisabledReason: 'Read-only access.' }));
  assert.match(html, /role="grid"/);
  assert.equal([...html.matchAll(/role="columnheader"/g)].length, 7);
  assert.match(html, /abbr="Monday"[^>]*>Mon<\/th>/);
  assert.match(html, /aria-current="date"/);
  assert.match(html, /Wednesday, 21 October 2026, today/);
  assert.match(html, /t98-calendar-cell--outside/);
  assert.match(html, /Read-only access\./);
  assert.match(html, /<button[^>]*disabled=""[^>]*aria-describedby="[^"]*-reason"/);
  assert.equal([...html.matchAll(/<td[^>]*tabindex="0"/g)].length, 1);
  assert.match(html, /Launch/);
  // Sunday start shifts the headers; an invalid month still renders without throwing.
  assert.match(render(CalendarMonth, { ...calendar, weekStartsOn: 0 }), /abbr="Sunday"[^>]*>Sun<\/th>/);
  assert.match(render(CalendarMonth, { ...calendar, month: { year: 2026, month: 13 } }), /Month unavailable/);
  assert.doesNotMatch(render(CalendarMonth, calendar), /t98-calendar-create/);
});

test('a calendar day name states its entry count so the grid cell is not announced as just a date', () => {
  const html = render(CalendarMonth, calendar);
  assert.match(html, /aria-label="[^"]*21 October 2026, today, 1 entry"/);
  const two = render(CalendarMonth, { ...calendar, days: new Map([['2026-10-22', [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]]]) });
  assert.match(two, /aria-label="[^"]*22 October 2026, 2 entries"/);
  assert.doesNotMatch(two, /21 October 2026, today, \d/);
});

test('an approximate map says so, and overlapping estimates never show a mapped total', () => {
  const plain = capture(render(CountryMap, map));
  assert.doesNotMatch(plain, /Approximate map|overlapping estimates/);
  const html = capture(render(CountryMap, { ...map, approximate: true, overlapping: true, unmappedSummary: { ...map.unmappedSummary, mapped: '999 sessions' } }));
  assert.match(html, /Approximate map: boundaries are simplified and not authoritative\./);
  assert.match(html, /Values are overlapping estimates, so they do not add up to a total\./);
  assert.match(html, /Mapped total<\/th><td class="t98-map-table-value">Not summed: estimates overlap</);
  assert.doesNotMatch(html, /999 sessions/);
});

test('every t98 class emitted by the spatial components is styled', () => {
  for (const html of emitted) for (const name of new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' '))))
    // ReplayControls and Button classes belong to their own components and tests.
    if (/^t98-(map|heatmap|calendar|replay-viewer|replay-frame)/.test(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});
