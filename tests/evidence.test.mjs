import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EvidenceSummary, OperationResults, ReviewSummary } from '../dist/evidence.js';

const render = (Component, props) => renderToStaticMarkup(h(Component, props));

test('mixed operation receipts never promote unknown or pending targets to confirmed', () => {
  const html = render(OperationResults, { items: [
    { id: 'one', target: 'Confirmed destination', status: 'confirmed', receipt: 'receipt-one' },
    { id: 'two', target: 'Unknown destination', status: 'unknown', receipt: 'request-two' },
    { id: 'three', target: 'Pending destination', status: 'pending', receipt: 'request-three' },
    { id: 'four', target: 'Failed destination', status: 'error', error: 'Unsupported media' },
  ] });
  assert.equal((html.match(/t98-operation-item--confirmed/g) ?? []).length, 1);
  assert.match(html, /t98-operation-item--unknown[\s\S]*?Outcome unknown[\s\S]*?request-two/);
  assert.match(html, /t98-operation-item--pending[\s\S]*?Pending confirmation[\s\S]*?request-three/);
  assert.match(html, /Check its receipt before repeating it/);
  assert.match(html, /Unsupported media/);
  assert.doesNotMatch(html, /<button|All operations successful|All targets confirmed/);
});

test('evidence retains measured zero and suppresses a value when unavailable', () => {
  const props = { source: 'Collector A', basis: 'Measured events · UTC', value: 0,
    freshness: { status: 'unknown', reason: 'No current receipt.' }, coverage: { status: 'partial', reason: 'Only source A responded.' } };
  assert.match(render(EvidenceSummary, props), /t98-evidence-value">0<\/div>/);
  const unavailable = render(EvidenceSummary, { ...props, availability: 'unavailable', reason: 'Collector timed out.' });
  assert.doesNotMatch(unavailable, /t98-evidence-value/);
  assert.match(unavailable, /Evidence unavailable/);
  assert.match(unavailable, /Collector timed out/);
  assert.match(unavailable, /Only source A responded/);
});

test('review preserves caller units and exposes semantic before/after values', () => {
  const html = render(ReviewSummary, { scope: 'Workspace Studio · account-42', resource: 'campaign-17',
    changes: [{ id: 'budget', label: 'Daily budget', before: h('span', null, 'AED 120 / day'), after: h('strong', null, 'AED 150 / day') }],
    consequences: h('p', null, 'Review required before submission.'), readOnlyReason: 'View permission only.' });
  assert.match(html, /<caption>Proposed changes<\/caption>/);
  assert.match(html, /<th scope="row">Daily budget<\/th><td><span>AED 120 \/ day<\/span><\/td><td><strong>AED 150 \/ day<\/strong>/);
  assert.match(html, /Read-only review/);
  assert.match(html, /tabindex="0"/);
  assert.doesNotMatch(html, /<button/);
});

test('compact evidence avoids invented freshness and keeps essential quality reasons visible', () => {
  const plain = renderToStaticMarkup(h(EvidenceSummary, { variant: 'compact', source: 'Observed source' }));
  assert.doesNotMatch(plain, /Freshness unknown|Observation time unavailable|Coverage unavailable/);
  const partial = renderToStaticMarkup(h(EvidenceSummary, { variant: 'compact', source: 'Observed source', coverage: { status: 'partial', reason: 'Retained interval only' }, basis: 'Events', details: h('p', null, 'Definitions') }));
  assert.ok(partial.indexOf('Retained interval only') < partial.indexOf('<details'));
  assert.match(partial, /<summary>Measurement details<\/summary>/);
});
test('operation stages preserve submitted accepted delivery and observed distinctions', () => {
  const html = renderToStaticMarkup(h(OperationResults, { items: ['submitted', 'accepted', 'delivered', 'observed'].map(status => ({ id: status, target: status, status })) }));
  for (const label of ['Submitted', 'Accepted', 'Delivered', 'Observed']) assert.ok(html.includes('>'+label+'<'));
  assert.match(html, /does not establish delivery/);
});
