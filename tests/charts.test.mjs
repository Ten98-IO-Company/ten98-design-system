import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BarList, MetricCard, ProportionBar, ShareChart, Sparkline, TimeSeriesChart, WeekdayHourGrid } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const rendered = [];
const render = element => { const html = renderToStaticMarkup(element); rendered.push(html); return html; };
const point = (x, y, state) => ({ x, xLabel: `Day ${x}`, y, ...(state ? { state } : {}) });
const series = [{ id: 'a', label: 'Visits', points: [point(1, 4), point(2, null), point(3, 6, 'partial'), point(4, 0)] }];
const chart = (kind, extra = {}) => render(h(TimeSeriesChart, { label: 'Visits', summary: 'Visits dipped on day 2.', kind, series, ...extra }));

test('a null point renders an unavailable mark and never a zero-height rectangle', () => {
  for (const kind of ['bars', 'grouped-bars', 'stacked-bars', 'line', 'area']) {
    const html = chart(kind);
    assert.match(html, /t98-chart-unavailable-column/, kind);
    assert.match(html, />Unavailable</, kind);
    assert.doesNotMatch(html, /<rect[^>]*class="t98-chart-bar[^"]*"[^>]*height="0"/, kind);
    assert.doesNotMatch(html, /NaN|Infinity/, kind);
  }
  assert.match(chart('bars', { series: [{ ...series[0], unavailable: true }] }), /t98-chart-unavailable-column/);
});

test('a real zero stays a visible mark and a partial point is marked', () => {
  const html = chart('bars');
  assert.match(html, /height="2"/);
  assert.match(html, /t98-chart-bar--partial/);
  assert.match(html, /t98-chart-partial-mark/);
  assert.match(html, /Day 3 · Visits: 6 \(partial\)/);
});

test('every point appears in the data table and the summary is referenced by the SVG', () => {
  const html = chart('line', { tableColumns: [{ header: 'Source', values: ['a', 'b', 'c', 'd'] }] });
  for (const label of ['Day 1', 'Day 2', 'Day 3', 'Day 4']) assert.match(html, new RegExp(`<th scope="row">${label}</th>`));
  assert.match(html, /<td[^>]*>Unavailable<\/td>/);
  assert.match(html, /6 \(partial\)/);
  assert.match(html, /<th scope="col">Source<\/th>/);
  const id = html.match(/<svg[^>]*aria-describedby="([^" ]+)/)[1];
  assert.match(html, new RegExp(`<p id="${id}"[^>]*>Visits dipped on day 2\.</p>`));
  assert.match(html, /4 points, minimum 0, maximum 6, 1 unavailable/);
  assert.match(html, /<details class="t98-chart-data">/);
  assert.match(html, /role="region" aria-label="Visits data table"/);
});

test('negative stacks extend below the baseline and loading, empty and notice states render', () => {
  const html = chart('stacked-bars', { series: [{ id: 'n', label: 'Net', points: [point(1, -5), point(2, 3)] }], baselineLabel: 'Zero' });
  assert.match(html, />Zero</);
  assert.match(html, /-5/);
  assert.match(chart('line', { loading: true }), /Loading chart/);
  assert.match(chart('line', { series: [], emptyMessage: 'Nothing yet' }), /Nothing yet/);
  assert.match(chart('line', { notice: 'Late data' }), /role="note">Late data/);
  assert.match(chart('line'), /dir="ltr"/);
});

test('axis labels are thinned, truncated with a title and can be shortened by formatXTick', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ x: i, xLabel: `Week number ${i + 1} of the launch`, y: i }));
  const html = render(h(TimeSeriesChart, { label: 'Long', summary: 's', kind: 'line', series: [{ id: 'a', label: 'A', points: many }] }));
  const ticks = [...html.matchAll(/<text[^>]*t98-chart-axis-text[^>]*>(?:<title>([^<]*)<\/title>)?([^<]*)<\/text>/g)].filter(m => /Week|…/.test(m[2]));
  assert.ok(ticks.length >= 2 && ticks.length < 12, 'thinned');
  assert.ok(ticks.some(m => m[1] && m[2].endsWith('…')), 'truncated with full text in a title');
  assert.ok(ticks[0][2].startsWith('Week'), 'first kept');
  assert.match(ticks.at(-1)[1] ?? ticks.at(-1)[2], /Week number 12 of the launch/, 'last kept');
  assert.match(html, /<th scope="row">Week number 7 of the launch<\/th>/, 'table keeps full text');
  const short = render(h(TimeSeriesChart, { label: 'Short', summary: 's', kind: 'line', series: [{ id: 'a', label: 'A', points: many }], formatXTick: (_, i) => `W${i + 1}` }));
  assert.match(short, />W12</);
  assert.doesNotMatch(short, /<title>Week number/);
});

test('the SVG fills a deterministic fallback width and keeps a per-point minimum', () => {
  assert.match(chart('line'), /<svg[^>]*class="t98-chart-svg" width="640" height="240" viewBox="0 0 640 240"/);
  const dense = Array.from({ length: 60 }, (_, i) => ({ x: i, xLabel: `D${i}`, y: i }));
  assert.match(render(h(TimeSeriesChart, { label: 'D', summary: 's', kind: 'line', series: [{ id: 'a', label: 'A', points: dense }] })), /width="2952"/);
});

test('ShareChart and ProportionBar state Unavailable, empty and totals', () => {
  const parts = [{ id: 'a', label: 'Opened', count: 30, tone: 1 }, { id: 'b', label: 'Unopened', count: 10, tone: 2 }];
  const share = render(h(ShareChart, { label: 'Opens', segments: parts, total: 40 }));
  assert.match(share, /aria-hidden="true"[^>]*focusable="false"/);
  assert.match(share, /Opened: <strong>75%<\/strong> \(30\)/);
  assert.match(share, /<tfoot><tr><th scope="row">Total<\/th><td[^>]*>40<\/td>/);
  // An unknown total keeps each segment's count and says only the shares are unavailable.
  const unknownTotal = render(h(ShareChart, { label: 'Opens', segments: parts, total: null }));
  assert.match(unknownTotal, />Total unavailable, so shares cannot be shown\.</);
  assert.match(unknownTotal, /Opened: <strong>30<\/strong>/);
  assert.doesNotMatch(unknownTotal, /%/);
  const none = render(h(ShareChart, { label: 'Opens', segments: parts, total: 0 }));
  assert.match(none, />No samples</);
  assert.doesNotMatch(none, /<svg/);
  const full = render(h(ShareChart, { label: 'One', segments: [{ id: 'a', label: 'All', count: 5, tone: 1 }], total: 5 }));
  assert.match(full, /100%/);
  assert.match(render(h(ProportionBar, { label: 'Split', segments: parts, total: 0, emptyMessage: 'No recipients' })), />No recipients</);
  assert.match(render(h(ProportionBar, { label: 'Split', segments: parts, total: null })), />Unavailable</);
  const bar = render(h(ProportionBar, { label: 'Split', segments: parts, total: 40 }));
  assert.match(bar, /Opened: <strong>30<\/strong> \(75%\)/);
});

test('BarList shows value text, selection buttons, links, secondary values and unavailable items', () => {
  const html = render(h(BarList, { label: 'Spend', items: [
    { id: 'a', label: 'Search', value: 90, valueText: 'AED 90', share: 0.9, secondary: { label: 'Remaining', valueText: 'AED 10', share: 0.1 }, onSelect() {}, selected: true },
    { id: 'b', label: 'Social', value: 5, valueText: 'AED 5', share: 0.05, href: '/social' },
    { id: 'c', label: 'Email', value: null, valueText: '', reason: 'No spend report yet' },
  ] }));
  assert.match(html, /<ol class="t98-bar-list" aria-label="Spend">/);
  assert.match(html, /<button type="button" class="[^"]*" aria-pressed="true">Search<\/button>/);
  assert.match(html, /<a class="t98-bar-list-name" href="\/social">Social<\/a>/);
  assert.match(html, />AED 90</);
  assert.match(html, /Remaining/);
  assert.match(html, /Unavailable/);
  assert.match(html, /No spend report yet/);
  assert.doesNotMatch(html, /NaN/);
});

test('Sparkline keeps gaps and MetricCard accepts nulls', () => {
  const html = render(h(Sparkline, { values: [1, 2, null, 4, 5], label: 'Traffic' }));
  assert.equal((html.match(/<polyline/g) ?? []).length, 2);
  assert.match(html, /2 unavailable|1 unavailable/);
  assert.match(render(h(Sparkline, { values: [1, null, 3], label: 'Traffic' })), /<circle[\s\S]*<circle/);
  assert.match(render(h(MetricCard, { label: 'Visits', value: '9', chart: [1, null, 3, 4] })), /t98-sparkline/);
});

test('every emitted chart class is styled in the shipped stylesheet', () => {
  const classes = html => [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' '));
  for (const name of new Set(rendered.flatMap(classes))) if (!/^t98-button--(md|secondary)$/.test(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('a segment with an unavailable count reads Unavailable and is never drawn or counted as 0', () => {
  const parts = [{ id: 'a', label: 'Opened', count: 30, tone: 1 }, { id: 'b', label: 'Bounced', count: null, tone: 2 }, { id: 'c', label: 'Ignored', count: 10, tone: 3 }];
  const share = render(h(ShareChart, { label: 'Outcomes', segments: parts, total: 40 }));
  assert.match(share, /Opened: <strong>75%<\/strong> \(30\)/);
  assert.match(share, /Bounced: <strong>Unavailable<\/strong>/);
  assert.equal((share.match(/t98-share-slice/g) ?? []).length, 2);
  assert.match(share, /<th scope="row">Bounced<\/th><td class="t98-table-cell--numeric">Unavailable<\/td><td class="t98-table-cell--numeric">Unavailable<\/td>/);
  assert.match(share, /role="note">Unavailable: Bounced\. The graphic shows only segments with a known count\./);
  assert.doesNotMatch(share, /Bounced: <strong>0|>0%</);
  const bar = render(h(ProportionBar, { label: 'Split', segments: parts, total: 40 }));
  assert.equal((bar.match(/t98-proportion-segment /g) ?? []).length, 2);
  assert.match(bar, /Bounced: <strong>Unavailable<\/strong>/);
  const list = render(h(BarList, { label: 'Pages', items: [{ id: 'p', label: '/home', value: 5, valueText: '5', share: 1, secondary: { label: 'Exits', valueText: '0', value: null, share: 0.4 } }] }));
  assert.match(list, /t98-bar-list-secondary"><span>Exits<\/span><span class="t98-bar-list-value">Unavailable</);
  assert.match(list, /t98-bar-track t98-bar-track--secondary t98-bar-track--unavailable" style="--t98-bar-share:0%"/);
});

test('ShareChart slices use the tone pattern fills, and a busy BarList keeps rows focusable but inert', () => {
  const share = render(h(ShareChart, { label: 'Outcomes', segments: [{ id: 'a', label: 'A', count: 2, tone: 2 }, { id: 'b', label: 'B', count: 1, tone: 3 }], total: 3 }));
  const ids = [...share.matchAll(/class="t98-share-slice" fill="url\(#([^)]+)\)"/g)].map(match => match[1]);
  assert.equal(ids.length, 2);
  for (const id of ids) assert.match(share, new RegExp(`<pattern id="${id}"[^>]*>.*?(<path|<circle)`));
  assert.doesNotMatch(share, /t98-share-slice t98-chart-fill/);
  let calls = 0;
  const items = [{ id: 'p', label: '/home', value: 5, valueText: '5', onSelect: () => { calls++; } }];
  const busy = render(h(BarList, { label: 'Pages', items, busy: true }));
  assert.match(busy, /<ol class="t98-bar-list" aria-label="Pages" aria-busy="true">/);
  assert.match(busy, /<button type="button" class="t98-bar-list-name t98-bar-list-button" aria-pressed="false" aria-disabled="true">/);
  assert.doesNotMatch(busy, / disabled=""/);
  assert.doesNotMatch(render(h(BarList, { label: 'Pages', items })), /aria-disabled|aria-busy/);
  assert.equal(calls, 0);
});

test('WeekdayHourGrid is a table with every value as text, square-root shading and hatched unavailable cells', () => {
  const values = [Array.from({ length: 24 }, (_, hour) => hour === 9 ? 100 : hour === 10 ? 25 : hour === 3 ? null : 0), [5]];
  const html = render(h(WeekdayHourGrid, { label: 'Sessions by hour', summary: 'Busiest Monday 09:00.', values, weekdays: ['Monday', 'Tuesday'] }));
  assert.match(html, /<th scope="row">Monday<\/th>/);
  assert.equal((html.match(/<th scope="col"/g) ?? []).length, 25);
  assert.equal((html.match(/<td class="t98-hour-cell/g) ?? []).length, 48);
  assert.match(html, /t98-hour-cell--4">100</);
  // sqrt(25/100) = 0.5 -> step 2, where a linear scale would give step 1.
  assert.match(html, /t98-hour-cell--2">25</);
  assert.match(html, /t98-hour-cell--0">0</);
  // Monday 03:00 is null and every Tuesday hour after the first is missing: Unavailable, never 0.
  assert.equal((html.match(/t98-hour-cell t98-hour-cell--unavailable"><span aria-hidden="true">–<\/span><span class="t98-visually-hidden">Unavailable/g) ?? []).length, 1 + 23);
  assert.match(html, /role="region" aria-label="Sessions by hour table"/);
  assert.match(html, /Hatched: unavailable, not zero/);
  for (const name of ['t98-hour-grid', 't98-hour-grid-table', 't98-hour-cell', 't98-hour-cell--4', 't98-hour-cell--unavailable']) assert.ok(styles.includes(`.${name}`), name);
});

test('fit compress keeps 90 daily points inside the figure, while scroll keeps 48px per point', () => {
  const points = Array.from({ length: 90 }, (_, i) => ({ x: i, xLabel: `Day ${i + 1}`, y: i % 7 === 0 ? null : i, ...(i === 3 ? { title: 'Day 4: launch email sent' } : {}) }));
  const series = [{ id: 'v', label: 'Visits', points }];
  const width = html => Number(html.match(/<svg[^>]*class="t98-chart-svg"[^>]*width="(\d+(?:\.\d+)?)"/)?.[1] ?? html.match(/<svg[^>]*width="(\d+(?:\.\d+)?)"[^>]*class="t98-chart-svg"/)?.[1]);
  const scroll = render(h(TimeSeriesChart, { label: 'Visits', summary: 's', kind: 'bars', series }));
  const compress = render(h(TimeSeriesChart, { label: 'Visits', summary: 's', kind: 'bars', series, fit: 'compress' }));
  assert.ok(width(scroll) >= 90 * 48, `scroll width ${width(scroll)}`);
  assert.equal(width(compress), 640);
  // Thinned labels: far fewer ticks than points, first and last kept.
  const ticks = (compress.match(/t98-chart-x-tick/g) ?? []).length;
  assert.ok(ticks > 2 && ticks < 30, `ticks ${ticks}`);
  assert.match(compress, />Day 1</);
  assert.match(compress, />Day 90</);
  // Nulls stay Unavailable, the table keeps every point, and a point title replaces only its hover text.
  assert.match(compress, /<title>Day 4: launch email sent<\/title>/);
  assert.equal((compress.match(/<th scope="row">Day \d+<\/th>/g) ?? []).length, 90);
  assert.match(compress, /Day 8 · Visits: unavailable/);
  assert.equal(width(render(h(TimeSeriesChart, { label: 'V', summary: 's', kind: 'bars', series, fit: 'compress', minStep: 10 }))), 58 + 14 + 900);
});

test('large inputs neither throw nor build a huge table until it is opened', () => {
  const points = n => Array.from({ length: n }, (_, i) => ({ x: i, xLabel: `P${i}`, y: i % 50 }));
  const big = render(h(TimeSeriesChart, { label: 'Big', summary: 's', kind: 'line', fit: 'compress', series: [{ id: 's', label: 'S', points: points(600) }] }));
  assert.match(big, /View data table \(600 rows\)/);
  assert.doesNotMatch(big, /<th scope="row">P0<\/th>/);
  const small = render(h(TimeSeriesChart, { label: 'Small', summary: 's', kind: 'line', series: [{ id: 's', label: 'S', points: points(50) }] }));
  assert.match(small, /<th scope="row">P0<\/th>/);
  assert.doesNotMatch(small, /rows\)/);
  // 200k values exceed the spread-argument limit of Math.min/Math.max.
  assert.doesNotThrow(() => render(h(Sparkline, { label: 'Spark', values: Array.from({ length: 200_000 }, (_, i) => i % 97) })));
});

test('series beyond five keep distinct line styles, and foldChartSeries folds the rest into Other without inventing zeros', async () => {
  const { foldChartSeries } = await import('../dist/index.js');
  const mk = (id, ys) => ({ id, label: id, points: ys.map((y, i) => ({ x: i, xLabel: `D${i}`, y })) });
  const six = Array.from({ length: 6 }, (_, i) => mk(`s${i}`, [i, i + 1]));
  const html = render(h(TimeSeriesChart, { label: 'L', summary: 's', kind: 'line', series: six }));
  const dashes = (html.match(/<path class="t98-chart-line"[^>]*>/g) ?? []).map(tag => `${tag.match(/--t98-chart-(\d)/)[1]}:${tag.match(/stroke-dasharray="([^"]*)"/)?.[1] ?? 'solid'}`);
  assert.equal(new Set(dashes).size, 6, dashes.join(' '));
  const folded = foldChartSeries([mk('a', [1, 1]), mk('b', [2, 2]), mk('c', [3, null]), mk('d', [null, null]), mk('e', [5, 6]), mk('f', [7, null])], 3);
  assert.deepEqual(folded.map(item => item.id), ['a', 'b', 'c', 'other']);
  assert.deepEqual(folded[3].points.map(point => [point.y, point.state ?? 'observed']), [[12, 'partial'], [6, 'partial']]);
  assert.deepEqual(foldChartSeries([mk('a', [null]), mk('b', [null]), mk('c', [null])], 1)[1].points[0], { x: 0, xLabel: 'D0', y: null, state: 'unavailable' });
  assert.equal(foldChartSeries(six.slice(0, 5), 4).length, 5);
});
