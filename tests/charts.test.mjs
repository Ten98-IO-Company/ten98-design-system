import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BarList, MetricCard, ProportionBar, ShareChart, Sparkline, TimeSeriesChart } from '../dist/index.js';

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

test('ShareChart and ProportionBar state Unavailable, empty and totals', () => {
  const parts = [{ id: 'a', label: 'Opened', count: 30, tone: 1 }, { id: 'b', label: 'Unopened', count: 10, tone: 2 }];
  const share = render(h(ShareChart, { label: 'Opens', segments: parts, total: 40 }));
  assert.match(share, /aria-hidden="true"[^>]*focusable="false"/);
  assert.match(share, /Opened: <strong>75%<\/strong> \(30\)/);
  assert.match(share, /<tfoot><tr><th scope="row">Total<\/th><td[^>]*>40<\/td>/);
  assert.match(render(h(ShareChart, { label: 'Opens', segments: parts, total: null })), />Unavailable</);
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
