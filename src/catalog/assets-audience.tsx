'use client';

import { useState } from 'react';
import { Badge, Button } from '../lib/primitives.js';
import { AssetDetails, AudienceSummary, type AssetDetailsProps, type AudienceSummaryProps } from '../lib/assets-audience.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const tokens = ['--t98-surface', '--t98-text', '--t98-muted', '--t98-border', '--t98-space-3', '--t98-space-4', '--t98-space-6', '--t98-font', '--t98-text-sm', '--t98-radius', '--t98-warning', '--t98-info', '--t98-danger'];
type AssetMode = 'allowed' | 'read-only' | 'expired' | 'processing' | 'unknown-delivery';
const assetBase: AssetDetailsProps = {
  assetId: 'asset-demo-42', name: 'Autumn studio creative.png', kind: 'Image', source: 'Google Drive · Studio shared folder',
  original: 'Drive original · original-demo-42', delivery: 'Public delivery derivative · delivery-demo-17',
  preview: <p>Synthetic media placeholder. The app supplies the accessible image, video or document preview.</p>,
  metadata: [{ label: 'Original dimensions', value: 'Unverified · original has not been inspected' }, { label: 'Delivery dimensions', value: '1080 × 1080 px · app-supplied inspection' }],
  approvalStatus: <Badge tone="success">Approved for the app-selected destination</Badge>, deliveryStatus: 'App verification passed', deliveryExpiry: '20 October 2026, 09:00 UTC · app-supplied expiry',
};
function assetProps(mode: AssetMode): AssetDetailsProps {
  if (mode === 'read-only') return { ...assetBase, readOnlyReason: 'Your app-supplied role permits inspection only.' };
  if (mode === 'expired') return { ...assetBase, deliveryStatus: 'Expired', deliveryExpiry: '18 October 2026, 09:00 UTC', issue: 'The original remains available. Refresh the delivery file in the app before attaching it.' };
  if (mode === 'processing') return { ...assetBase, processing: true, approvalStatus: 'Pending review after delivery replacement', deliveryStatus: 'Processing · not ready to attach', deliveryExpiry: undefined, metadata: [{ label: 'Original dimensions', value: 'Unverified · original has not been inspected' }, { label: 'Delivery dimensions', value: 'Unverified · processing is pending' }] };
  if (mode === 'unknown-delivery') return { ...assetBase, approvalStatus: undefined, delivery: undefined, deliveryStatus: undefined, deliveryExpiry: undefined, metadata: [{ label: 'Dimensions', value: 'Unverified · no inspection evidence' }], error: 'Delivery verification could not be read. The app must reconcile the saved upload before retrying.' };
  return assetBase;
}
function AssetDemo({ mode }: { mode: AssetMode }) {
  const [notice, setNotice] = useState('');
  return <><AssetDetails {...assetProps(mode)} actions={mode === 'allowed' ? <Button onClick={() => setNotice('Local attachment review opened. No asset or approval was changed.')}>Review attachment locally</Button> : undefined} /><p role="status">{notice}</p></>;
}
const assetCode = (mode: AssetMode) => tsx(['AssetDetails', 'Badge', 'Button', 'type AssetDetailsProps'], `<>
  <AssetDetails {...asset}${mode === 'allowed' ? ' actions={<Button onClick={() => setNotice(\'Local attachment review opened. No asset or approval was changed.\')}>Review attachment locally</Button>}' : ''} />
  <p role="status">{notice}</p>
</>`, `const [notice, setNotice] = useState('');
const asset: AssetDetailsProps = {
  assetId: 'asset-demo-42', name: 'Autumn studio creative.png', kind: 'Image',
  source: 'Google Drive · Studio shared folder', original: 'Drive original · original-demo-42',
  preview: <p>Synthetic media placeholder. Supply an accessible image, video or document preview.</p>,
  delivery: ${mode === 'unknown-delivery' ? 'undefined' : "'Public delivery derivative · delivery-demo-17'"},
  metadata: ${mode === 'unknown-delivery' ? "[{ label: 'Dimensions', value: 'Unverified · no inspection evidence' }]" : `[{ label: 'Original dimensions', value: 'Unverified · original has not been inspected' }, { label: 'Delivery dimensions', value: '${mode === 'processing' ? 'Unverified · processing is pending' : '1080 × 1080 px · app-supplied inspection'}' }]`},
  approvalStatus: ${mode === 'unknown-delivery' ? 'undefined' : mode === 'processing' ? "'Pending review after delivery replacement'" : '<Badge tone="success">Approved for the app-selected destination</Badge>'},
  deliveryStatus: ${mode === 'unknown-delivery' ? 'undefined' : `'${mode === 'expired' ? 'Expired' : mode === 'processing' ? 'Processing · not ready to attach' : 'App verification passed'}'`},
  deliveryExpiry: ${mode === 'processing' || mode === 'unknown-delivery' ? 'undefined' : `'${mode === 'expired' ? '18' : '20'} October 2026, 09:00 UTC'`},${mode === 'processing' ? '\n  processing: true,' : ''}${mode === 'read-only' ? "\n  readOnlyReason: 'Your app-supplied role permits inspection only.'," : ''}${mode === 'expired' ? "\n  issue: 'The original remains available. Refresh the delivery file in the app before attaching it.'," : ''}${mode === 'unknown-delivery' ? "\n  error: 'Delivery verification could not be read. The app must reconcile the saved upload before retrying.'," : ''}
};`, ['useState']);

type AudienceMode = 'eligible' | 'zero-eligible' | 'unavailable-counts' | 'stale-preview' | 'pending' | 'import-partial-errors' | 'read-only';
const audienceBase: AudienceSummaryProps = {
  scope: 'Studio · order-update campaign · app-selected contacts', channel: 'Email', purpose: 'Transactional order update',
  counts: { total: 12, eligible: 8, excluded: 3, unverified: 1 },
  exclusions: [{ reason: 'Suppressed by app policy', count: 2 }, { reason: 'Invalid destination address', count: 1 }],
  sample: <ul><li>Demo recipient A · masked address supplied by app</li><li>Demo recipient B · masked address supplied by app</li></ul>,
};
function audienceProps(mode: AudienceMode): AudienceSummaryProps {
  if (mode === 'zero-eligible') return { ...audienceBase, counts: { total: 4, eligible: 0, excluded: 3, unverified: 1 }, sample: <p>No eligible recipients in the app-supplied preview.</p> };
  if (mode === 'unavailable-counts') return { ...audienceBase, counts: { total: null, eligible: null, excluded: null, unverified: null }, exclusions: [], sample: undefined, error: 'Audience preview could not be loaded. No recipient count is confirmed.' };
  if (mode === 'stale-preview') return { ...audienceBase, stale: true, staleReason: 'The draft changed after the preview signature was issued. Refresh before reviewing a send.' };
  if (mode === 'pending') return { ...audienceBase, pending: true, counts: { total: null, eligible: null, excluded: null, unverified: null }, exclusions: [], sample: undefined };
  if (mode === 'import-partial-errors') return { ...audienceBase, importResult: <><p>App import preview: 8 added · 1 updated · 2 skipped · 1 error. No identities were merged by this component.</p><ul><li>Row 7: conflicting identity. Review in the app.</li><li>Row 12: invalid email address. Correct the source row.</li></ul></> };
  if (mode === 'read-only') return { ...audienceBase, readOnlyReason: 'Your app-supplied role permits inspection only.' };
  return audienceBase;
}
function AudienceDemo({ mode }: { mode: AudienceMode }) {
  const [notice, setNotice] = useState('');
  return <><AudienceSummary {...audienceProps(mode)} actions={mode === 'eligible' ? <Button onClick={() => setNotice('Local audience review opened. No message was sent.')}>Review audience locally</Button> : undefined} /><p role="status">{notice}</p></>;
}
const audienceCode = (mode: AudienceMode) => tsx(['AudienceSummary', 'Button', 'type AudienceSummaryProps'], `<>
  <AudienceSummary {...audience}${mode === 'eligible' ? ' actions={<Button onClick={() => setNotice(\'Local audience review opened. No message was sent.\')}>Review audience locally</Button>}' : ''} />
  <p role="status">{notice}</p>
</>`, `const [notice, setNotice] = useState('');
const audience: AudienceSummaryProps = {
  scope: 'Studio · order-update campaign · app-selected contacts', channel: 'Email', purpose: 'Transactional order update',
  counts: ${mode === 'pending' || mode === 'unavailable-counts' ? '{ total: null, eligible: null, excluded: null, unverified: null }' : mode === 'zero-eligible' ? '{ total: 4, eligible: 0, excluded: 3, unverified: 1 }' : '{ total: 12, eligible: 8, excluded: 3, unverified: 1 }'},
  exclusions: ${mode === 'pending' || mode === 'unavailable-counts' ? '[]' : "[{ reason: 'Suppressed by app policy', count: 2 }, { reason: 'Invalid destination address', count: 1 }]"},
  sample: ${mode === 'pending' || mode === 'unavailable-counts' ? 'undefined' : mode === 'zero-eligible' ? '<p>No eligible recipients in the app-supplied preview.</p>' : '<ul><li>Demo recipient A · masked address supplied by app</li><li>Demo recipient B · masked address supplied by app</li></ul>'},${mode === 'stale-preview' ? "\n  stale: true, staleReason: 'The draft changed after the preview signature was issued. Refresh before reviewing a send.'," : ''}${mode === 'pending' ? '\n  pending: true,' : ''}${mode === 'unavailable-counts' ? "\n  error: 'Audience preview could not be loaded. No recipient count is confirmed.'," : ''}${mode === 'read-only' ? "\n  readOnlyReason: 'Your app-supplied role permits inspection only.'," : ''}${mode === 'import-partial-errors' ? '\n  importResult: <><p>App import preview: 8 added · 1 updated · 2 skipped · 1 error. No identities were merged by this component.</p><ul><li>Row 7: conflicting identity. Review in the app.</li><li>Row 12: invalid email address. Correct the source row.</li></ul></>,' : ''}
};`, ['useState']);

export const assetsAudienceEntries: ComponentEntry[] = [
  {
    name: 'AssetDetails', category: 'Data display', description: 'Asset preview, provenance, original and delivery metadata with app-supplied approval and delivery evidence.',
    usage: 'Use in the Campaign media library or chooser. Keep original and delivery references distinct and explicitly label unverified dimensions in metadata. The app owns upload, public URL validation, expiry, approval, permissions and reconciliation; this surface never infers readiness from a preview or approval. Gate action slots in the app, including read-only, expired and processing states.',
    props: [prop('assetId', 'string', 'Stable app asset identifier.', true), prop('name', 'ReactNode', 'Full asset name and region heading.', true), prop('kind', 'ReactNode', 'App-supplied media type.', true), prop('preview', 'ReactNode', 'App-owned accessible media preview; use alt text or native media controls.'), prop('metadata', 'readonly AssetMetadata[]', 'Label/value pairs; preserve unknown original and delivery dimensions explicitly.', true), prop('source', 'ReactNode', 'Source identity and provenance.', true), prop('original', 'ReactNode', 'Original reference, separate from the delivery derivative.'), prop('delivery', 'ReactNode', 'Public delivery reference or app description.'), prop('approvalStatus', 'ReactNode', 'Exact app approval; omitted status remains unknown.'), prop('deliveryStatus', 'ReactNode', 'Exact app delivery verification state; omitted status remains unknown.'), prop('deliveryExpiry', 'ReactNode', 'App-resolved expiry; no date calculations occur.'), prop('processing', 'boolean', 'Marks pending media processing without changing approval.', false, 'false'), prop('readOnlyReason', 'ReactNode', 'Explains app permissions; app must omit or disable write actions.'), prop('issue', 'ReactNode', 'Recoverable app-supplied issue, such as expired delivery.'), prop('error', 'ReactNode', 'App-owned transfer or verification error.'), prop('actions', 'ReactNode', 'App-controlled actions preserving native controllers and request guards.'), prop('className', 'string', 'Additional root classes.')],
    tokens, accessibility: ['Named region and semantic definition lists preserve metadata labels.', 'Preview follows the heading and precedes metadata on narrow screens. The app supplies alt text, captions and native media controls.', 'Pending processing has readable status and aria-busy. Warnings use text alongside tone.', 'Native action buttons retain keyboard behavior. This surface never moves focus or starts an upload.'], related: ['Card', 'Badge', 'Alert', 'OperationResults'], example: assetCode('allowed'),
    states: (['allowed', 'read-only', 'expired', 'processing', 'unknown-delivery'] as const).map(mode => ({ name: mode === 'allowed' ? 'Allowed / app-approved' : mode === 'unknown-delivery' ? 'Unknown delivery / error' : mode[0].toUpperCase() + mode.slice(1), description: 'Synthetic app-supplied evidence. The allowed action records only local review feedback; no upload, attachment or approval request occurs.', preview: <AssetDemo mode={mode} />, code: assetCode(mode) })),
  },
  {
    name: 'AudienceSummary', category: 'Data display', description: 'App-resolved audience scope, eligible/excluded/unverified counts, exclusions, samples and import results.',
    usage: 'Use before exact send review in Campaign. Pass null for unavailable counts and 0 only for measured zero. Supply exclusion reasons, safe sample content and readable import errors from the app. The app retains identity, consent, suppression, preview signatures, permissions, native confirmation and send controllers; counts never enable sending here. Cloudflare purpose remains app-restricted to transactional messages.',
    props: [prop('title', 'ReactNode', 'Region heading.', false, 'Audience summary'), prop('scope', 'ReactNode', 'Exact selected campaign, contacts or tags.', true), prop('channel', 'ReactNode', 'App-selected channel.', true), prop('purpose', 'ReactNode', 'App-permitted communication purpose.', true), prop('counts', 'AudienceCounts', 'Required total/eligible/excluded/unverified values: string | number | null. Zero remains zero; null displays Unavailable.', true), prop('exclusions', 'readonly AudienceExclusion[]', 'Reason/count pairs supplied by the app; count may be null.', false, '[]'), prop('sample', 'ReactNode', 'App-owned accessible and appropriately masked recipient sample.'), prop('importResult', 'ReactNode', 'App-owned import counts and row-level errors; no silent identity merging.'), prop('pending', 'boolean', 'Announces pending preview without recalculating supplied counts.', false, 'false'), prop('stale', 'boolean', 'Marks a preview invalidated by app rules.', false, 'false'), prop('staleReason', 'ReactNode', 'Explains why the supplied preview is stale.'), prop('readOnlyReason', 'ReactNode', 'App permission explanation; app gates write actions.'), prop('error', 'ReactNode', 'App-supplied preview error.'), prop('actions', 'ReactNode', 'App-controlled preview/review actions; this component never sends.'), prop('className', 'string', 'Additional root classes.')],
    tokens, accessibility: ['Named region and definition lists associate each count with its meaning.', 'Exclusion, sample and import sections have unique labelled headings, including multiple summaries on a page.', 'Pending is announced with status and aria-busy. Stale and error states remain readable alongside any retained app values.', 'Counts and sample text wrap on narrow screens; native app actions retain keyboard access. No recipient identity or send decision is inferred.'], related: ['ReviewSummary', 'OperationResults', 'Alert', 'DataTable'], example: audienceCode('eligible'),
    states: (['eligible', 'zero-eligible', 'unavailable-counts', 'stale-preview', 'pending', 'import-partial-errors', 'read-only'] as const).map(mode => ({ name: mode === 'eligible' ? 'Eligible / local review' : mode === 'zero-eligible' ? 'Zero eligible' : mode === 'unavailable-counts' ? 'Unavailable counts / error' : mode === 'stale-preview' ? 'Stale preview' : mode === 'import-partial-errors' ? 'Import partial errors' : mode[0].toUpperCase() + mode.slice(1), description: 'Synthetic audience evidence supplied by the app. Only local feedback changes; no identity, consent, suppression or send operation runs.', preview: <AudienceDemo mode={mode} />, code: audienceCode(mode) })),
  },
];
