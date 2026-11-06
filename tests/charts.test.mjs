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

test('stack statistics describe known signed extent and distinct unavailable x positions', () => {
  const makeSeries = rows => rows.map((values, index) => ({ id: String(index), label: `Series ${index}`, points: values.map((y, x) => point(x, y)) }));
  for (const [name, supplied, expectedExtent, unavailable, unavailableCells] of [
    ['positive and zero', makeSeries([[3, 0], [6, 0]]), '0 to 9', 0, 0],
    ['one skipped date', makeSeries([[3, null], [6, null]]), '0 to 9', 1, 2],
    ['signed, not net', makeSeries([[3, -4, null], [6, -2, null]]), '-6 to 9', 1, 2],
    ['all unavailable', makeSeries([[null], [null]]), 'unavailable', 1, 2],
    ['zero is observed', makeSeries([[0], [0]]), '0 to 0', 0, 0],
    ['unequal lengths', makeSeries([[3, 5, 2], [6]]), '0 to 9', 2, 2],
    ['nonfinite cells', makeSeries([[3, NaN], [6, Infinity]]), '0 to 9', 1, 2],
    ['series unavailable', [{ ...makeSeries([[100, 100]])[0], unavailable: true }, { id: 'known', label: 'Known', points: [point(0, 3), point(1, 0)] }], '0 to 3', 2, 2],
  ]) {
    const html = chart('stacked-bars', { series: supplied });
    assert.ok(html.includes(`known stacked extent ${expectedExtent}`), name);
    assert.ok(html.includes(`${unavailable} ${unavailable === 1 ? 'point' : 'points'} with unavailable values`), name);
    assert.equal([...html.matchAll(/<td[^>]*>Unavailable<\/td>/g)].length, unavailableCells, name);
    assert.doesNotMatch(html, /NaN|Infinity/, name);
  }
  const partial = chart('stacked-bars', { series: [{ id: 'a', label: 'A', points: [point(0, 3, 'partial')] }, { id: 'b', label: 'B', points: [point(0, 6)] }] });
  assert.match(partial, /known stacked extent 0 to 9/);
  assert.match(partial, /3 \(partial\)/);
  assert.match(partial, /t98-chart-partial-mark/);
  assert.match(chart('stacked-bars', { series: makeSeries([[3], [6]]), formatY: value => `n${value}` }), /known stacked extent n0 to n9/);
});

test('nonstacked statistics retain individual values and count missing positions once', () => {
  const supplied = [
    { id: 'a', label: 'A', points: [point(0, 3), point(1, -4, 'partial'), point(2, null)] },
    { id: 'b', label: 'B', points: [point(0, 6), point(1, 0), point(2, null)] },
  ];
  for (const kind of ['bars', 'grouped-bars', 'line', 'area']) {
    const html = chart(kind, { series: supplied });
    assert.match(html, /3 points, series-value minimum -4, maximum 6, 1 point with unavailable values/);
    assert.match(html, /-4 \(partial\)/);
    assert.doesNotMatch(html, /known stacked extent/);
  }
});

test('a null point renders an unavailable mark and never a zero-height rectangle', () => {
  for (const kind of ['bars', 'grouped-bars', 'stacked-bars', 'line', 'area']) {
    const html = chart(kind);
    assert.match(html, /t98-chart-unavailable-column/, kind);
    assert.match(html, />Unavailable</, kind);
    assert.doesNotMatch(html, /<rect[^>]*class="t98-chart-bar[^"]*"[^>]*height="0"/, kind);
    assert.doesNotMatch(html, /NaN|Infinity/, kind);
  }
  assert.match(chart('bars', { series: [{ ...series[0], unavailable: true }] }), /Visits — unavailable for all 4 points/);
});

test('dense wholly unavailable series are summarized once while observed zero and every table value remain', () => {
  const supplied = [
    { id: 'views', label: 'Recorded pageviews', points: Array.from({ length: 31 }, (_, x) => point(x, 0)) },
    { id: 'visitors', label: 'Estimated visitors', role: 'comparison', points: Array.from({ length: 31 }, (_, x) => point(x, null)) },
  ];
  const html = chart('grouped-bars', { series: supplied, fit: 'compress', bare: true, yDomain: [0, 1] });
  assert.match(html, /Estimated visitors \(comparison, outlined\) — unavailable for all 31 points/);
  assert.doesNotMatch(html, /class="t98-chart-unavailable"|t98-chart-unavailable-text/);
  assert.equal([...html.matchAll(/class="t98-chart-bar"/g)].length, 31);
  assert.equal([...html.matchAll(/<td[^>]*>0<\/td>/g)].length, 31);
  assert.equal([...html.matchAll(/<td[^>]*>Unavailable<\/td>/g)].length, 31);
  assert.match(html, /31 points, series-value minimum 0, maximum 0, 31 points with unavailable values/);
  const gaps = chart('grouped-bars');
  assert.match(gaps, /<g class="t98-chart-unavailable">/);
  assert.match(gaps, /Hatched: unavailable, not zero/);
  assert.doesNotMatch(gaps, /t98-chart-unavailable-text/);
});

test('all-unavailable charts state that condition without drawing data or hiding point inspection and tables', () => {
  const supplied = ['A', 'B'].map(label => ({ id: label, label, points: Array.from({ length: 31 }, (_, x) => point(x, null)) }));
  const html = chart('grouped-bars', { series: supplied, fit: 'compress', bare: true });
  assert.match(html, /role="note">All series are unavailable for this period\./);
  assert.doesNotMatch(html, /class="t98-chart-bar|class="t98-chart-unavailable"|class="t98-chart-grid"|class="t98-chart-baseline"/);
  assert.equal([...html.matchAll(/<td[^>]*>Unavailable<\/td>/g)].length, 62);
  assert.match(html, /31 points, series-value minimum unavailable, maximum unavailable, 31 points with unavailable values/);
  assert.match(html, /Arrow keys move between points and series/);
  assert.match(html, /role="region" aria-label="Visits data table"/);
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
  assert.match(html, /4 points, series-value minimum 0, maximum 6, 1 point with unavailable values/);
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

test('chart height keeps its default, accepts explicit pixels and sanitizes unusable values', () => {
  for (const height of [undefined, 0, -1, NaN, Infinity]) assert.match(chart('line', { height }), /height="240" viewBox="0 0 640 240"/);
  assert.match(chart('line', { height: 320 }), /height="320" viewBox="0 0 640 320"/);
  assert.match(chart('line', { height: 1 }), /height="120" viewBox="0 0 640 120"/);
  assert.doesNotMatch(chart('stacked-bars', { height: 120, series: [{ id: 'net', label: 'Net', points: [point(1, -5), point(2, 3)] }] }), /NaN|Infinity/);
});

test('bare charts retain their semantic name, descriptions, notices and complete data table', () => {
  const html = chart('line', { bare: true, notice: 'Partial report' });
  assert.match(html, /class="t98-chart t98-chart--bare"/);
  assert.match(html, /<figcaption class="t98-chart-caption t98-visually-hidden"><strong>Visits<\/strong>/);
  assert.match(html, /class="t98-chart-summary t98-visually-hidden">Visits dipped on day 2\./);
  assert.match(html, /class="t98-chart-stats t98-visually-hidden"/);
  assert.match(html, /role="img" aria-label="Visits" aria-describedby="[^"]+"/);
  assert.match(html, /role="note">Partial report/);
  assert.match(html, /View data table/);
  assert.match(html, /<th scope="row">Day 4<\/th>/);
  assert.match(html, /<td[^>]*>Unavailable<\/td>/);
  assert.doesNotMatch(html, /role="tooltip"/);
  assert.ok(styles.includes('.t98-chart--bare'));
  assert.ok(styles.includes('.t98-chart-tooltip'));
});

test('a clean single series omits its redundant legend while comparison and data-state keys remain', () => {
  const clean = [{ id: 'v', label: 'Visits', points: [point(1, 0), point(2, 12)] }];
  assert.doesNotMatch(chart('line', { series: clean }), /class="t98-chart-legend"/);
  assert.match(chart('line', { series: [...clean, { ...clean[0], id: 'previous', label: 'Previous', role: 'comparison' }] }), /Previous \(comparison, outlined\)/);
  assert.match(chart('line'), /Dashed ring: partial data/);
  assert.match(chart('line'), /Hatched: unavailable, not zero/);
});
