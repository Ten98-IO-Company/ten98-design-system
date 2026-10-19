import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppliedFilters, TrackerStatus, ComparisonMetric } from '../dist/measurement.js';

const render = (component, props) => renderToStaticMarkup(h(component, props));
const observation = (value, other = {}) => ({ label: 'Measured visits', range: '1–19 October · UTC', value, ...other });

test('applied scope remains visible when draft edits are pending and controls can be disabled', () => {
  const filters = Object.freeze([Object.freeze({ id: 'country', label: 'Country', operator: 'is', value: 'United Arab Emirates' })]);
  const html = render(AppliedFilters, { filters, pendingDraft: 'Country draft: Canada.', disabled: true, onRemove() {}, onClear() {} });
  assert.match(html, /Applied scope/);
  assert.match(html, /United Arab Emirates/);
  assert.match(html, /Country draft: Canada\. Results still use the applied scope above/);
  assert.match(html, /aria-label="Remove filter: Country is United Arab Emirates"/);
  assert.equal([...html.matchAll(/disabled=""/g)].length, 2);
  const empty = render(AppliedFilters, { filters: [], onClear() {} });
  assert.match(empty, /No filters applied/);
  assert.doesNotMatch(empty, /<button/);
  assert.equal(filters.length, 1);
});

test('scanner success does not imply event receipt and event receipt does not imply scanner success', () => {
  const installed = render(TrackerStatus, {
    resource: 'example.test', installation: { state: 'installed', observedAt: '2026-10-19T08:00:00Z', reason: 'Snippet found.' },
    receipt: { state: 'waiting', reason: 'No accepted event yet.' }, actions: h('button', null, 'Copy snippet'),
  });
  assert.match(installed, /Installation check/);
  assert.match(installed, /Accepted event receipt/);
  assert.match(installed, /data-state="installed"/);
  assert.match(installed, /data-state="waiting"/);
  assert.doesNotMatch(installed, />Events received</);
  assert.match(installed, /Copying a snippet confirms neither/);
  const unavailable = render(TrackerStatus, {
    resource: 'example.test', installation: { state: 'unavailable', reason: 'Scanner blocked.' },
    receipt: { state: 'received', observedAt: '2026-10-19T08:01:00Z', reason: 'Pageview accepted.' },
  });
  assert.match(unavailable, /Check unavailable/);
  assert.match(unavailable, /Events received/);
  assert.match(unavailable, /Scanner blocked/);
  assert.match(unavailable, /datetime="2026-10-19T08:01:00Z"/i);
  assert.doesNotMatch(unavailable, />Installed</);
});

test('metric zero, unavailable evidence and consumer-provided comparison remain independent', () => {
  const html = render(ComparisonMetric, { label: 'Visits', current: observation(0, { partial: true, stale: true, source: 'Provider A', sourceStatus: 'Delayed import' }), baseline: observation(null, { unavailableReason: 'Outside retained interval.' }), change: { label: 'Change', value: null, reason: 'Baseline unavailable.' } });
  assert.match(html, /class="t98-comparison-value">0</);
  assert.match(html, /class="t98-comparison-value">Unavailable</);
  assert.match(html, /Outside retained interval/);
  assert.match(html, />Partial</);
  assert.match(html, />Stale</);
  assert.match(html, /Source status: Delayed import/);
  assert.match(html, /Baseline unavailable/);
  assert.doesNotMatch(html, /Infinity|NaN|%/);
  const supplied = render(ComparisonMetric, { label: 'Rank', current: observation(2), baseline: observation(0), change: { label: 'Position change', value: 'Consumer supplied: two positions lower', tone: 'warning' } });
  assert.match(supplied, /Consumer supplied: two positions lower/);
  assert.doesNotMatch(supplied, /Infinity|NaN|%/);
  const omitted = render(ComparisonMetric, { label: 'Visits', current: observation(5), baseline: observation(10) });
  assert.match(omitted, /Comparison not supplied/);
  assert.doesNotMatch(omitted, /50%/);
});
