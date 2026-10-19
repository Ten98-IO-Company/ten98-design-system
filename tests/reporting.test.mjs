import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EvidenceDetail, ReportPanel, RunCostSummary } from '../dist/reporting.js';

const render = (Component, props) => renderToStaticMarkup(h(Component, props));

test('evidence preserves cited/retrieved labels, renders text safely and suppresses unavailable payloads', () => {
  const props = { label: 'Answer detail', scope: 'Project A · execution 17', provenance: 'Retained API execution',
    answer: '<script>untrusted()</script>', evidence: 'Annotation 1', sources: h('ul', null, h('li', null, 'Cited source: A'), h('li', null, 'Retrieved source: B')) };
  const ready = render(EvidenceDetail, { ...props, availability: 'ready' });
  assert.match(ready, /&lt;script&gt;untrusted\(\)&lt;\/script&gt;/);
  assert.match(ready, /Cited source: A/); assert.match(ready, /Retrieved source: B/);
  assert.doesNotMatch(ready, /<script|<button/);
  for (const availability of ['loading', 'empty', 'unavailable', 'error', 'forbidden', 'expired']) {
    const html = render(EvidenceDetail, { ...props, availability, message: 'Original answer unavailable.' });
    assert.match(html, /Project A · execution 17/); assert.match(html, /Retained API execution/);
    assert.doesNotMatch(html, /Annotation 1|Cited source: A|Retrieved source: B|untrusted/);
    assert.equal(html.includes('aria-busy="true"'), availability === 'loading');
  }
});

test('failed report keeps explicitly retained content and leaves sibling widgets useful without retry', () => {
  const base = { scope: 'Project A · UTC', source: 'Collector A', asOf: '19 October, 09:30 UTC' };
  const html = renderToStaticMarkup(h('div', null,
    h(ReportPanel, { ...base, title: 'Failed widget', status: 'error', retainedContent: true, retainedContentLabel: 'Retained snapshot from original query.', reason: 'Refresh failed.' }, '42 accepted events'),
    h(ReportPanel, { ...base, title: 'Useful sibling', status: 'ready' }, '12 accepted events')));
  assert.match(html, /Retained snapshot from original query/); assert.match(html, /42 accepted events/);
  assert.match(html, /Useful sibling/); assert.match(html, /12 accepted events/);
  assert.doesNotMatch(html, /<button|Retrying|All reports failed/);
  for (const status of ['error', 'loading', 'forbidden', 'expired', 'empty']) {
    const hidden = render(ReportPanel, { ...base, title: 'Hidden payload', status, retainedContent: status === 'forbidden' || status === 'expired', children: 'Sensitive payload' });
    assert.doesNotMatch(hidden, /Sensitive payload/);
  }
  for (const status of ['partial', 'stale']) {
    assert.match(render(ReportPanel, { ...base, title: 'Qualified data', status, reason: 'Coverage limitation', children: 0 }), /t98-report-content">0<\/div>/);
  }
});

test('cost preserves exact units and prices and keeps unknown settlement distinct from explicit zero', () => {
  const props = { scope: 'Domain example.org · exact host · UAE / English', units: '25 ideas · 1 task · maximum 1 paid page',
    estimatedPrice: 'US$0.012500', quoteExpiryLabel: '19 October 2026, 09:35 UTC', receipt: 'original-request-17', state: 'uncertain' };
  const unknown = render(RunCostSummary, props);
  assert.match(unknown, /US\$0\.012500/); assert.match(unknown, /25 ideas · 1 task · maximum 1 paid page/);
  assert.match(unknown, /Settled amount unknown/); assert.match(unknown, /original-request-17/);
  assert.match(unknown, /Reconcile the original request before another charged attempt/);
  assert.doesNotMatch(unknown, /US\$0\.000000|<button|Approved|Retrying/);
  const zero = render(RunCostSummary, { ...props, state: 'settled', settledPrice: 'US$0.000000' });
  assert.match(zero, /US\$0\.000000/); assert.doesNotMatch(zero, /Settled amount unknown/);
  assert.match(render(RunCostSummary, { ...props, settledPrice: 0 }), /<dt>Settled price<\/dt><dd>0<\/dd>/);
  for (const state of ['quoted', 'pending', 'settled', 'expired', 'blocked']) {
    assert.doesNotMatch(render(RunCostSummary, { ...props, state }), /<button/);
  }
});
