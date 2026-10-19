import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AssetDetails, AudienceSummary } from '../dist/assets-audience.js';

const render = (Component, props) => renderToStaticMarkup(h(Component, props));

test('asset details keep original and delivery evidence distinct without promoting unknown approval', () => {
  const props = { assetId: 'asset-42', name: 'Original studio photograph.png', kind: 'Image', source: 'Drive · original folder',
    original: h('a', { href: 'https://example.invalid/original' }, 'Original file'), delivery: 'Delivery derivative',
    metadata: [{ label: 'Original dimensions', value: 'Unverified' }, { label: 'Delivery dimensions', value: '1080 × 1080 px' }],
    deliveryStatus: 'Expired', deliveryExpiry: '18 October 2026', issue: 'Original remains available; delivery must be refreshed.' };
  const html = render(AssetDetails, props);
  assert.match(html, /<dt>Original<\/dt><dd><a href="https:\/\/example.invalid\/original">Original file<\/a>/);
  assert.match(html, /<dt>Delivery file<\/dt><dd>Delivery derivative<\/dd>/);
  assert.match(html, /<dt>Original dimensions<\/dt><dd>Unverified<\/dd>/);
  assert.match(html, /<dt>Delivery dimensions<\/dt><dd>1080 × 1080 px<\/dd>/);
  assert.match(html, /<dt>Approval<\/dt><dd>Approval status unknown<\/dd>/);
  assert.match(html, /<dt>Delivery status<\/dt><dd>Expired<\/dd>/);
  assert.doesNotMatch(html, /<button|Approved|Delivery ready/);
  const processing = render(AssetDetails, { ...props, processing: true, deliveryStatus: undefined, deliveryExpiry: undefined,
    approvalStatus: 'Pending review after replacement', readOnlyReason: 'Inspection permission only.' });
  assert.match(processing, /aria-busy="true"/);
  assert.match(processing, /role="status"/);
  assert.match(processing, /Pending review after replacement/);
  assert.match(processing, /Delivery status unknown/);
  assert.match(processing, /Delivery expiry unverified/);
  assert.match(processing, /Read-only asset/);
  assert.doesNotMatch(processing, /<button|Approved/);
});

test('audience counts preserve zero and unavailable, without calculating eligibility or hiding import errors', () => {
  const props = { scope: 'Order update · exact draft', channel: 'Email', purpose: 'Transactional',
    counts: { total: 10, eligible: 0, excluded: '3 supplied by app', unverified: null },
    exclusions: [{ reason: 'Suppressed', count: 0 }, { reason: 'Unverified address', count: null }],
    sample: h('p', null, 'No eligible recipients.'), importResult: h('p', null, 'Row 7: conflicting identity. Row 12: invalid address.'),
    stale: true, staleReason: 'Preview signature no longer matches the draft.' };
  const html = render(AudienceSummary, props);
  assert.match(html, /<dt>Total<\/dt><dd>10<\/dd>/);
  assert.match(html, /<dt>Eligible<\/dt><dd>0<\/dd>/);
  assert.match(html, /<dt>Excluded<\/dt><dd>3 supplied by app<\/dd>/);
  assert.match(html, /<dt>Unverified<\/dt><dd>Unavailable<\/dd>/);
  assert.match(html, /<dt>Suppressed<\/dt><dd>0<\/dd>/);
  assert.match(html, /<dt>Unverified address<\/dt><dd>Unavailable<\/dd>/);
  assert.match(html, /Preview signature no longer matches the draft/);
  assert.match(html, /Row 7: conflicting identity. Row 12: invalid address/);
  assert.doesNotMatch(html, /<button|Ready to send|Send now/);
  const pending = render(AudienceSummary, { ...props, pending: true, counts: { total: null, eligible: null, excluded: null, unverified: null }, error: 'Preview unavailable.' });
  assert.match(pending, /aria-busy="true"/);
  assert.match(pending, /Audience preview pending/);
  assert.match(pending, /<dt>Eligible<\/dt><dd>Unavailable<\/dd>/);
  assert.match(pending, /Preview unavailable/);
});
