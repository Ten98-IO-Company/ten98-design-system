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

test('suppressed and skipped targets are labelled as deliberately not sent, never as failures', async () => {
  const { OperationResults } = await import('../dist/evidence.js');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createElement } = await import('react');
  const html = renderToStaticMarkup(createElement(OperationResults, { items: [{ id: 's', target: 'a', status: 'suppressed' }, { id: 'k', target: 'b', status: 'skipped' }] }));
  assert.match(html, /t98-operation-item--suppressed[\s\S]*>Suppressed<[\s\S]*Not sent: the target is suppressed/);
  assert.match(html, /t98-operation-item--skipped[\s\S]*>Skipped<[\s\S]*Not attempted\./);
  assert.doesNotMatch(html, /Failed|t98-tone--danger/);
  assert.equal((html.match(/t98-badge t98-tone--neutral/g) ?? []).length, 2);
});

test('ValidationSummary counts problems as a status, links each message to its fix, and marks stale results', async () => {
  const { ValidationSummary } = await import('../dist/evidence.js');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createElement } = await import('react');
  const items = [
    { id: 'ig', target: 'Instagram · Studio', status: 'error', messages: [{ id: 'm1', text: 'Caption is longer than 2,200 characters.', href: '#caption' }] },
    { id: 'li', target: 'LinkedIn · Studio', status: 'warning', messages: [{ id: 'm2', text: 'The link preview image is missing.' }] },
    { id: 'fb', target: 'Facebook · Studio', status: 'ok' },
  ];
  const html = renderToStaticMarkup(createElement(ValidationSummary, { title: 'Before publishing', items, checkedAt: '10:42', onRecheck() {} }));
  assert.match(html, /role="status">1 destination needs a fix, 1 destination to check\.</);
  assert.match(html, /Checked 10:42/);
  assert.match(html, /<a href="#caption" class="t98-link t98-link--inline">Caption is longer than 2,200 characters\.<\/a>/);
  assert.match(html, />Needs a fix<[\s\S]*>Check this<[\s\S]*>Ready</);
  assert.match(html, />Check again</);
  const ready = renderToStaticMarkup(createElement(ValidationSummary, { items: [items[2]] }));
  assert.match(ready, />All 1 destination is ready\.</);
  const stale = renderToStaticMarkup(createElement(ValidationSummary, { items, stale: true, onRecheck() {} }));
  assert.match(stale, /class="t98-validation t98-validation--stale"/);
  assert.match(stale, /Changed since the last check[\s\S]*Check again before publishing\./);
  assert.equal((stale.match(/>Check again</g) ?? []).length, 1);
  const busy = renderToStaticMarkup(createElement(ValidationSummary, { items: [], busy: true }));
  assert.match(busy, /role="status">Checking…</);
  assert.doesNotMatch(busy, /Nothing has been checked yet/);
  assert.match(renderToStaticMarkup(createElement(ValidationSummary, { items: [] })), /Nothing has been checked yet\./);
});
