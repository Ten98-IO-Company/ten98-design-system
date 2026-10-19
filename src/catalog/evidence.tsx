'use client';

import { useId, useState } from 'react';
import { Button, Field, Input, Select } from '../lib/primitives.js';
import { EvidenceSummary, OperationResults, ReviewSummary, type EvidenceSummaryProps, type OperationTargetResult } from '../lib/evidence.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const tokens = ['--t98-surface', '--t98-text', '--t98-muted', '--t98-border', '--t98-space-3', '--t98-space-4', '--t98-font', '--t98-text-sm', '--t98-success', '--t98-warning', '--t98-info', '--t98-danger'];
type EvidenceMode = 'measured' | 'zero' | 'loading' | 'empty' | 'unavailable' | 'partial' | 'stale';
const commonEvidence: EvidenceSummaryProps = {
  title: 'Discover event evidence', source: 'Discover collector · website-demo-42', basis: 'Measured accepted events · UTC · selected website and date range',
  observedAt: { label: '19 October 2026, 09:30 UTC', dateTime: '2026-10-19T09:30:00Z' },
  freshness: { status: 'current', reason: 'Latest accepted receipt is within the app-defined freshness window.' },
  coverage: { status: 'complete', reason: 'All retained events in this selected scope were queried; collection coverage is not inferred.' },
};
const evidenceStates: Record<EvidenceMode, EvidenceSummaryProps> = {
  measured: { ...commonEvidence, value: '248 accepted events' },
  zero: { ...commonEvidence, value: '0 accepted events', reason: 'The query completed and measured zero events in this scope.' },
  loading: { ...commonEvidence, availability: 'loading', observedAt: undefined, freshness: { status: 'unknown', reason: 'No observation time has been returned.' }, coverage: { status: 'unavailable', reason: 'Coverage is not available until the query completes.' } },
  empty: { ...commonEvidence, availability: 'empty', reason: 'No sources match these filters. Change the filters to inspect another scope.' },
  unavailable: { ...commonEvidence, availability: 'unavailable', reason: 'The collector query failed. Missing data has no numeric value.', observedAt: undefined, freshness: { status: 'unknown', reason: 'The latest observation could not be read.' }, coverage: { status: 'unavailable', reason: 'The collector did not return a coverage statement.' } },
  partial: { ...commonEvidence, value: '192 accepted events', coverage: { status: 'partial', reason: 'One source is unavailable. This value includes only the two sources that responded.' } },
  stale: { ...commonEvidence, value: '248 accepted events', freshness: { status: 'stale', reason: 'The latest receipt is older than the app-defined freshness window. This is retained evidence.' } },
};
const evidenceOptions = <><option value="measured">Measured</option><option value="zero">Measured zero</option><option value="loading">Loading</option><option value="empty">Filtered empty</option><option value="unavailable">Unavailable / error</option><option value="partial">Partial coverage</option><option value="stale">Stale</option></>;
function EvidenceDemo({ initial = 'partial' }: { initial?: EvidenceMode }) {
  const id = useId(); const [mode, setMode] = useState<EvidenceMode>(initial);
  return <div className="t98-evidence-demo"><Field label="Local evidence scenario" htmlFor={id}><Select value={mode} onChange={event => setMode(event.target.value as EvidenceMode)}>{evidenceOptions}</Select></Field><EvidenceSummary {...evidenceStates[mode]} /></div>;
}
const evidenceSetup = `type Mode = 'measured' | 'zero' | 'loading' | 'empty' | 'unavailable' | 'partial' | 'stale';
const id = useId();
const common: EvidenceSummaryProps = {
  title: 'Discover event evidence', source: 'Discover collector · website-demo-42',
  basis: 'Measured accepted events · UTC · selected website and date range',
  observedAt: { label: '19 October 2026, 09:30 UTC', dateTime: '2026-10-19T09:30:00Z' },
  freshness: { status: 'current', reason: 'Latest accepted receipt is within the app-defined freshness window.' },
  coverage: { status: 'complete', reason: 'All retained events in this selected scope were queried; collection coverage is not inferred.' },
};
const states: Record<Mode, EvidenceSummaryProps> = {
  measured: { ...common, value: '248 accepted events' },
  zero: { ...common, value: '0 accepted events', reason: 'The query completed and measured zero events in this scope.' },
  loading: { ...common, availability: 'loading', observedAt: undefined, freshness: { status: 'unknown', reason: 'No observation time has been returned.' }, coverage: { status: 'unavailable', reason: 'Coverage is not available until the query completes.' } },
  empty: { ...common, availability: 'empty', reason: 'No sources match these filters. Change the filters to inspect another scope.' },
  unavailable: { ...common, availability: 'unavailable', reason: 'The collector query failed. Missing data has no numeric value.', observedAt: undefined, freshness: { status: 'unknown', reason: 'The latest observation could not be read.' }, coverage: { status: 'unavailable', reason: 'The collector did not return a coverage statement.' } },
  partial: { ...common, value: '192 accepted events', coverage: { status: 'partial', reason: 'One source is unavailable. This value includes only the two sources that responded.' } },
  stale: { ...common, value: '248 accepted events', freshness: { status: 'stale', reason: 'The latest receipt is older than the app-defined freshness window. This is retained evidence.' } },
};`;
const evidenceCode = (mode: EvidenceMode) => tsx(['EvidenceSummary', 'Field', 'Select', 'type EvidenceSummaryProps'], `<>
  <Field label="Local evidence scenario" htmlFor={id}>
    <Select value={mode} onChange={event => setMode(event.target.value as Mode)}>
      <option value="measured">Measured</option><option value="zero">Measured zero</option>
      <option value="loading">Loading</option><option value="empty">Filtered empty</option>
      <option value="unavailable">Unavailable / error</option><option value="partial">Partial coverage</option><option value="stale">Stale</option>
    </Select>
  </Field>
  <EvidenceSummary {...states[mode]} />
</>`, evidenceSetup + `\nconst [mode, setMode] = useState<Mode>('${mode}');`, ['useId', 'useState']);

type OperationMode = 'partial' | 'submitted' | 'accepted' | 'delivered' | 'observed' | 'pending' | 'unknown' | 'confirmed' | 'error' | 'loading' | 'empty' | 'read-only';
function OperationDemo({ initial = 'partial' }: { initial?: OperationMode }) {
  const id = useId(); const [mode, setMode] = useState<OperationMode>(initial); const [checked, setChecked] = useState(false);
  const unknown: OperationTargetResult = { id: 'studio', target: 'Campaign · Instagram · Studio', status: checked ? 'confirmed' : 'unknown', receipt: <code>demo-publish-002</code>, detail: checked ? 'Local simulation: a receipt check confirmed publication.' : 'Response lost. Publication may already have completed.', actions: !checked && mode !== 'read-only' ? <Button variant="secondary" onClick={() => setChecked(true)}>Simulate confirmed receipt</Button> : undefined };
  const items: OperationTargetResult[] = mode === 'loading' || mode === 'empty' ? [] : mode === 'partial' ? [
    { id: 'news', target: 'Campaign · LinkedIn · News', status: 'confirmed', receipt: <code>demo-publish-001</code>, detail: 'Local simulation: provider publication is confirmed.' }, unknown,
    { id: 'video', target: 'Campaign · YouTube · Studio', status: 'error', error: 'Local simulation: unsupported video format. Review the media before requesting a new attempt.' },
  ] : mode === 'unknown' ? [unknown] : [{ id: 'news', target: 'Campaign · LinkedIn · News', status: mode === 'read-only' ? 'confirmed' : mode, receipt: <code>demo-publish-001</code>, error: mode === 'error' ? 'Local simulation: provider rejected the media. No retry was requested.' : undefined }];
  return <div className="t98-operation-demo"><Field label="Local operation scenario" htmlFor={id}><Select value={mode} onChange={event => { setMode(event.target.value as OperationMode); setChecked(false); }}><option value="partial">Mixed destination results</option><option value="pending">Pending</option><option value="unknown">Unknown</option><option value="confirmed">Confirmed</option><option value="error">Error</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="read-only">Read-only receipts</option></Select></Field><OperationResults title="Campaign publication results" description={mode === 'read-only' ? 'Read-only local receipts. No write actions are provided.' : 'Synthetic local results. No provider request or automatic retry is made.'} items={items} loading={mode === 'loading'} /></div>;
}
const operationCode = (mode: OperationMode) => tsx(['Button', 'Field', 'Select', 'OperationResults', 'type OperationTargetResult'], `<>
  <Field label="Local operation scenario" htmlFor={id}>
    <Select value={mode} onChange={event => { setMode(event.target.value as Mode); setChecked(false); }}>
      <option value="partial">Mixed destination results</option><option value="pending">Pending</option>
      <option value="unknown">Unknown</option><option value="confirmed">Confirmed</option><option value="error">Error</option>
      <option value="loading">Loading</option><option value="empty">Empty</option><option value="read-only">Read-only receipts</option>
    </Select>
  </Field>
  <OperationResults title="Campaign publication results" description={mode === 'read-only' ? 'Read-only local receipts. No write actions are provided.' : 'Synthetic local results. No provider request or automatic retry is made.'} items={items} loading={mode === 'loading'} />
</>`, `type Mode = 'partial' | 'submitted' | 'accepted' | 'delivered' | 'observed' | 'pending' | 'unknown' | 'confirmed' | 'error' | 'loading' | 'empty' | 'read-only';
const id = useId();
const [mode, setMode] = useState<Mode>('${mode}');
const [checked, setChecked] = useState(false);
const unknown: OperationTargetResult = {
  id: 'studio', target: 'Campaign · Instagram · Studio', status: checked ? 'confirmed' : 'unknown',
  receipt: <code>demo-publish-002</code>,
  detail: checked ? 'Local simulation: a receipt check confirmed publication.' : 'Response lost. Publication may already have completed.',
  actions: !checked && mode !== 'read-only' ? <Button variant="secondary" onClick={() => setChecked(true)}>Simulate confirmed receipt</Button> : undefined,
};
const items: OperationTargetResult[] = mode === 'loading' || mode === 'empty' ? [] : mode === 'partial' ? [
  { id: 'news', target: 'Campaign · LinkedIn · News', status: 'confirmed', receipt: <code>demo-publish-001</code>, detail: 'Local simulation: provider publication is confirmed.' },
  unknown,
  { id: 'video', target: 'Campaign · YouTube · Studio', status: 'error', error: 'Local simulation: unsupported video format. Review the media before requesting a new attempt.' },
] : mode === 'unknown' ? [unknown] : [{
  id: 'news', target: 'Campaign · LinkedIn · News', status: mode === 'read-only' ? 'confirmed' : mode,
  receipt: <code>demo-publish-001</code>, error: mode === 'error' ? 'Local simulation: provider rejected the media. No retry was requested.' : undefined,
}];`, ['useId', 'useState']);

type ReviewMode = 'default' | 'empty' | 'read-only';
function ReviewDemo({ mode = 'default' }: { mode?: ReviewMode }) {
  const id = useId(); const [budget, setBudget] = useState('AED 150 / day'); const [reviewed, setReviewed] = useState(false);
  return <div className="t98-review-demo">{mode !== 'empty' && <Field label="Proposed daily budget (including currency and period)" htmlFor={id}><Input value={budget} readOnly={mode === 'read-only'} onChange={event => { setBudget(event.target.value); setReviewed(false); }} /></Field>}<ReviewSummary title="Review Campaign budget change" scope="Workspace: Studio · Google Ads account demo-42" resource={<span>Autumn campaign · <code>campaign-demo-17</code></span>} changes={mode === 'empty' ? [] : [{ id: 'budget', label: 'Daily budget', before: <span>AED <strong>120</strong> / day</span>, after: budget }]} readOnlyReason={mode === 'read-only' ? 'Your app-supplied role allows inspection only. Request changes from an account editor.' : undefined} consequences={<p>This synthetic review changes a daily budget. The app must refresh the quote, verify revision and permissions, and request explicit confirmation before submitting.</p>} actions={mode === 'default' ? <Button disabled={!budget.trim()} onClick={() => setReviewed(true)}>Record local review</Button> : undefined} /><p role="status">{reviewed ? 'Local review recorded. Nothing was submitted.' : 'No local review recorded.'}</p></div>;
}
const reviewCode = (mode: ReviewMode) => tsx(['ReviewSummary', 'Button', 'Field', 'Input'], `<>
  ${mode !== 'empty' ? `<Field label="Proposed daily budget (including currency and period)" htmlFor={id}>
    <Input value={budget}${mode === 'read-only' ? ' readOnly' : ''} onChange={event => { setBudget(event.target.value); setReviewed(false); }} />
  </Field>` : ''}
  <ReviewSummary title="Review Campaign budget change"
    scope="Workspace: Studio · Google Ads account demo-42"
    resource={<span>Autumn campaign · <code>campaign-demo-17</code></span>}
    changes={${mode === 'empty' ? '[]' : "[{ id: 'budget', label: 'Daily budget', before: <span>AED <strong>120</strong> / day</span>, after: budget }]"}}
    ${mode === 'read-only' ? 'readOnlyReason="Your app-supplied role allows inspection only. Request changes from an account editor."\n    ' : ''}consequences={<p>This synthetic review changes a daily budget. The app must refresh the quote, verify revision and permissions, and request explicit confirmation before submitting.</p>}${mode === 'default' ? '\n    actions={<Button disabled={!budget.trim()} onClick={() => setReviewed(true)}>Record local review</Button>}' : ''} />
  <p role="status">{reviewed ? 'Local review recorded. Nothing was submitted.' : 'No local review recorded.'}</p>
</>`, "const id = useId();\nconst [budget, setBudget] = useState('AED 150 / day');\nconst [reviewed, setReviewed] = useState(false);", ['useId', 'useState']);

export const evidenceEntries: ComponentEntry[] = [
  {
    name: 'EvidenceSummary', category: 'Data display', description: 'Source, observation time, measurement basis, freshness and coverage beside an app-supplied result.',
    usage: 'Use for Discover investigations and Campaign delivery evidence. Supply quality reasons from the app; measured zero, filtered empty, unavailable and stale evidence have different meanings. Use compact evidence beside filters/results and full evidence in investigation detail. This component does not evaluate freshness or calculate metrics.',
    props: [prop('variant', "'full' | 'compact'", 'Full investigation card or compact report-header evidence. Essential quality warnings remain visible.', false, 'full'), prop('details', 'ReactNode', 'Optional app-owned definitions and limitations; compact renders these in Measurement details disclosure.'), prop('title', 'ReactNode', 'Region heading.', false, 'Evidence summary'), prop('source', 'ReactNode', 'Source identity, provenance text or permitted source link.', true), prop('observedAt', 'EvidenceTimestamp', 'Visible timestamp label and optional machine-readable dateTime; omitted time is explicitly unavailable.'), prop('basis', 'ReactNode', 'Optional supplied basis, counting unit, scope and limits; never inferred.'), prop('availability', "'ready' | 'loading' | 'empty' | 'unavailable'", 'Controls the result state; non-ready states never display value.', false, 'ready'), prop('reason', 'ReactNode', 'Text explaining availability or result limitations.'), prop('value', 'ReactNode', 'Preformatted measured value. Numeric zero is retained; missing values are never converted to zero.'), prop('freshness', 'EvidenceFreshness', 'Optional app-supplied current/stale/unknown status and reason; omitted means no freshness claim.'), prop('coverage', 'EvidenceCoverage', 'Optional complete/partial/unavailable status with reason for the stated scope.'), prop('actions', 'ReactNode', 'App-owned inspection or refresh actions.'), prop('className', 'string', 'Additional root classes.')],
    tokens, accessibility: ['Named region and semantic definition list keep evidence attached to its context.', 'Quality is expressed with text and reasons as well as tone.', 'Loading has a busy state and readable status. Source links/actions use native keyboard behavior.', 'Labels, values and reasons must wrap at narrow widths; use the product stylesheet.'], related: ['Badge', 'Alert', 'OperationResults', 'MetricCard'], example: evidenceCode('partial'),
    states: [{ name: 'Compact report evidence', description: 'Source/time and essential partial/stale warning stay visible; detailed definitions use a labelled disclosure.', preview: <EvidenceSummary variant="compact" source="Synthetic analytics" observedAt={{ label: 'Calculated 09:00 UTC', dateTime: '2026-10-19T09:00:00Z' }} coverage={{ status: 'partial', reason: 'Only accepted events in the retained interval are included.' }} basis="Observed page-view events; identities are estimated." details={<p>No missing-traffic denominator is inferred.</p>} />, code: tsx(['EvidenceSummary'], '<EvidenceSummary variant="compact" source="Synthetic analytics" observedAt={{ label: "Calculated 09:00 UTC", dateTime: "2026-10-19T09:00:00Z" }} coverage={{ status: "partial", reason: "Only accepted events in the retained interval are included." }} basis="Observed page-view events; identities are estimated." details={<p>No missing-traffic denominator is inferred.</p>} />') }, ...(['measured', 'zero', 'loading', 'empty', 'unavailable', 'partial', 'stale'] as const).map(mode => ({ name: mode === 'zero' ? 'Measured zero' : mode === 'unavailable' ? 'Unavailable / error' : mode === 'empty' ? 'Filtered empty' : mode[0].toUpperCase() + mode.slice(1), description: 'Use the labelled native selector to compare local evidence states. No query is executed.', preview: <EvidenceDemo initial={mode} />, code: evidenceCode(mode) }))], 
  },
  {
    name: 'OperationResults', category: 'Feedback', description: 'Per-target outcomes with receipt references, error details and explicit app-owned recovery actions.',
    usage: 'Use after publication, booking, uploads or other consequential operations. Supply the exact provider-supported outcome in detail. Confirmed means the supplied operation result is confirmed; it does not imply delivered, read, billed or globally successful. Unknown outcomes require app reconciliation; this component never retries.',
    props: [prop('title', 'ReactNode', 'Region heading.', false, 'Operation results'), prop('description', 'ReactNode', 'Operation and scope context.'), prop('items', 'readonly OperationTargetResult[]', 'Stable id, target, submitted/accepted/delivered/observed/pending/unknown/confirmed/error status, optional detail/receipt/error/actions for every target.', true), prop('loading', 'boolean', 'Shows loading text while preserving any previously supplied items.', false, 'false'), prop('emptyMessage', 'ReactNode', 'Message for an empty, non-loading result set.', false, 'No operation results yet.'), prop('className', 'string', 'Additional root classes.')],
    tokens, accessibility: ['Named region with a semantic list of individually labelled targets.', 'Status labels distinguish pending, unknown, confirmed and failed without relying on color.', 'Polite list updates announce changed outcomes. App-supplied buttons and links retain native keyboard behavior.', 'Long target names and receipts must wrap on narrow screens. No automatic retry or focus movement occurs.'], related: ['ReviewSummary', 'EvidenceSummary', 'ActivityFeed', 'Alert'], example: operationCode('partial'),
    states: [{ name: 'Submitted, accepted, delivered and observed', description: 'Each provider-supported stage retains its own meaning; accepted is not delivery.', preview: <OperationResults items={(['submitted', 'accepted', 'delivered', 'observed'] as const).map(status => ({ id: status, target: status, status, receipt: 'demo-receipt-' + status }))} />, code: tsx(['OperationResults'], '<OperationResults items={(["submitted", "accepted", "delivered", "observed"] as const).map(status => ({ id: status, target: status, status, receipt: "demo-receipt-" + status }))} />') }, ...(['partial', 'pending', 'unknown', 'confirmed', 'error', 'loading', 'empty', 'read-only'] as const).map(mode => ({ name: mode === 'partial' ? 'Partial / mixed outcomes' : mode === 'read-only' ? 'Read-only receipts' : mode[0].toUpperCase() + mode.slice(1), description: 'Local simulation only. Unknown receipts expose an explicit simulated check; no request or retry occurs automatically.', preview: <OperationDemo initial={mode} />, code: operationCode(mode) }))], 
  },
  {
    name: 'ReviewSummary', category: 'Data display', description: 'Scope and resource identity with before/after values and consequences for an explicit review.',
    usage: 'Place in an app-owned Dialog or page before a consequential change. Values are ReactNode so currencies, budget periods, counts and provider units remain intact. The app owns authorization, validation, quote expiry, revision checks and confirmation. readOnlyReason explains context and does not enforce permissions on supplied action slots.',
    props: [prop('title', 'ReactNode', 'Region heading.', false, 'Review change'), prop('description', 'ReactNode', 'Review context.'), prop('scope', 'ReactNode', 'Workspace, project, account and other applicable scope.', true), prop('resource', 'ReactNode', 'Exact resource name and stable identity.', true), prop('changes', 'readonly ReviewChange[]', 'Stable id, field label, before and after ReactNode values; no formatting, parsing or unit conversion is performed.', true), prop('consequences', 'ReactNode', 'Effect, limits, cost, expiry or other app-defined consequences.'), prop('actions', 'ReactNode', 'Caller-owned review/confirmation controls.'), prop('readOnlyReason', 'ReactNode', 'Explanatory read-only notice. The app supplies only authorized actions.'), prop('className', 'string', 'Additional root classes.')],
    tokens, accessibility: ['Named region with explicit scope/resource labels.', 'Native table has a caption and row/column headings for before/after comparison.', 'The labelled table region is keyboard focusable for horizontal scrolling on narrow screens.', 'Consequences are a distinct heading; action buttons and permission enforcement remain app-owned.'], related: ['OperationResults', 'ConfirmDialog', 'Dialog', 'Alert'], example: reviewCode('default'),
    states: [{ name: 'Editable review', description: 'Edit the preformatted value and record a local review. Nothing is submitted.', preview: <ReviewDemo />, code: reviewCode('default') }, { name: 'Empty', description: 'Scope remains visible when there are no proposed changes.', preview: <ReviewDemo mode="empty" />, code: reviewCode('empty') }, { name: 'Read-only', description: 'The app supplies a read-only field and reason with no write action.', preview: <ReviewDemo mode="read-only" />, code: reviewCode('read-only') }],
  },
];
