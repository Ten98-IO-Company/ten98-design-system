'use client';

import { useId, useState } from 'react';
import { Field, Select } from '../lib/primitives.js';
import { EvidenceDetail, ReportPanel, RunCostSummary, type EvidenceDetailProps, type ReportPanelProps, type RunCostSummaryProps } from '../lib/reporting.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const tokens = ['--t98-surface', '--t98-text', '--t98-muted', '--t98-border', '--t98-space-2', '--t98-space-3', '--t98-space-4', '--t98-font', '--t98-text-sm', '--t98-radius', '--t98-warning', '--t98-danger'];
const evidenceCases = {
  ready: { availability: 'ready', message: 'Synthetic retained answer and annotations. Retrieved sources and cited sources retain their app-supplied labels.' },
  loading: { availability: 'loading', message: 'Waiting for the authorized saved evidence read. No execution starts.' },
  empty: { availability: 'empty', message: 'No citations in this observed sample. No answer has been reconstructed.' },
  unavailable: { availability: 'unavailable', message: 'The saved answer payload is unavailable. Aggregate counts cannot reconstruct it.' },
  error: { availability: 'error', message: 'The saved evidence read failed. No automatic retry is requested.' },
  forbidden: { availability: 'forbidden', message: 'Current access does not permit this answer payload.' },
  expired: { availability: 'expired', message: 'The answer retention period ended. Older aggregate counts do not restore it.' },
} satisfies Record<string, Pick<EvidenceDetailProps, 'availability' | 'message'>>;
const reportCases = {
  ready: { status: 'ready', reason: '42 accepted events in the applied scope.', retainedContent: false },
  zero: { status: 'ready', reason: 'The completed query measured zero accepted events.', retainedContent: false },
  loading: { status: 'loading', reason: 'Refreshing this widget only.', retainedContent: true },
  empty: { status: 'empty', reason: 'No sources match the applied filters. This is not a measured zero.', retainedContent: false },
  partial: { status: 'partial', reason: 'Source A responded; source B is unavailable. Only source A is included.', retainedContent: false },
  stale: { status: 'stale', reason: 'The app marks this saved observation outside its freshness window.', retainedContent: false },
  error: { status: 'error', reason: 'This widget failed to refresh. Other widgets keep their own state.', retainedContent: true },
  forbidden: { status: 'forbidden', reason: 'Access to this widget was removed; no payload is displayed.', retainedContent: false },
  expired: { status: 'expired', reason: 'This widget evidence expired; no payload is displayed.', retainedContent: false },
} satisfies Record<string, Pick<ReportPanelProps, 'status' | 'reason' | 'retainedContent'>>;
const costCases = {
  quoted: { state: 'quoted', estimatedPrice: 'US$0.012500', reason: 'An estimate for review. No paid action is supplied.' },
  pending: { state: 'pending', estimatedPrice: 'US$0.012500', reason: 'Original request is queued or awaiting settlement; no final charge is confirmed.' },
  settled: { state: 'settled', estimatedPrice: 'US$0.012500', settledPrice: 'US$0.010000', reason: 'Synthetic receipt supplies this settled amount.' },
  zero: { state: 'settled', estimatedPrice: 'US$0.012500', settledPrice: 'US$0.000000', reason: 'Synthetic receipt explicitly supplies a settled zero.' },
  uncertain: { state: 'uncertain', estimatedPrice: 'US$0.012500', reason: 'Response lost after dispatch. Unknown is not a zero charge.' },
  expired: { state: 'expired', estimatedPrice: 'US$0.012500', reason: 'The app reports this quote expired. Prepare a new review before any execution.' },
  blocked: { state: 'blocked', reason: 'The app reports paid operations paused. No estimate or settlement is available.' },
} satisfies Record<string, Pick<RunCostSummaryProps, 'state' | 'estimatedPrice' | 'settledPrice' | 'reason'>>;

function EvidenceDemo({ initial }: { initial: keyof typeof evidenceCases }) {
  const id = useId(); const [mode, setMode] = useState(initial);
  return <><Field label="Local evidence scenario" htmlFor={id}><Select id={id} value={mode} onChange={event => setMode(event.target.value as typeof mode)}>{Object.keys(evidenceCases).map(key => <option key={key} value={key}>{key}</option>)}</Select></Field><EvidenceDetail label="Discover answer evidence" scope="Project demo-42 · execution demo-run-17 · English / United Arab Emirates" provenance="Synthetic saved API execution · immutable prompt version 3" {...evidenceCases[mode]} answer={<p>Illustrative synthetic answer from the saved execution.</p>} evidence={<p>Annotation 1 · retained-fragment-v1 · ownership ambiguous.</p>} sources={<ul><li>Cited source: <bdi dir="ltr">https://example.org/cited</bdi></li><li>Retrieved source: <bdi dir="ltr">https://example.org/retrieved</bdi> · no explicit citation supplied</li></ul>} /></>;
}
function ReportDemo({ initial }: { initial: keyof typeof reportCases }) {
  const id = useId(); const [mode, setMode] = useState(initial);
  return <><Field label="Local widget scenario" htmlFor={id}><Select id={id} value={mode} onChange={event => setMode(event.target.value as typeof mode)}>{Object.keys(reportCases).map(key => <option key={key} value={key}>{key}</option>)}</Select></Field><ReportPanel title="Accepted events" scope="Project demo-42 · 18 October 2026 · UTC" source="Synthetic collector A" asOf="19 October 2026, 09:30 UTC" {...reportCases[mode]}><p>{mode === 'zero' ? '0' : '42'} accepted events</p></ReportPanel><ReportPanel title="Unaffected sibling widget" scope="Project demo-42 · 18 October 2026 · UTC" source="Synthetic collector C" asOf="19 October 2026, 09:30 UTC" status="ready"><p>12 accepted events</p></ReportPanel></>;
}
function CostDemo({ initial }: { initial: keyof typeof costCases }) {
  const id = useId(); const [mode, setMode] = useState(initial);
  return <><Field label="Local cost scenario" htmlFor={id}><Select id={id} value={mode} onChange={event => setMode(event.target.value as typeof mode)}>{Object.keys(costCases).map(key => <option key={key} value={key}>{key}</option>)}</Select></Field><RunCostSummary scope="Project demo-42 · seed: analytics · UAE / English · DataForSEO Labs / Google" units="Up to 25 keyword ideas · 1 task · bounded result, not all results" quoteExpiryLabel="19 October 2026, 09:35 UTC (app-supplied label)" receipt={<bdi dir="ltr">demo-request-17 / demo-quote-3</bdi>} warnings="Retrieval does not establish index freshness. Estimate covers only this app request." {...costCases[mode]} /></>;
}
const selector = (label: string) => `<Field label="${label}" htmlFor={id}>
  <Select id={id} value={mode} onChange={event => setMode(event.target.value as typeof mode)}>
    {Object.keys(scenarios).map(key => <option key={key} value={key}>{key}</option>)}
  </Select>
</Field>`;
const setup = (cases: unknown, type: string, initial: string) => `const scenarios = ${JSON.stringify(cases, null, 2)} satisfies Record<string, ${type}>;
const id = useId();
const [mode, setMode] = useState<keyof typeof scenarios>('${initial}');`;
const evidenceCode = (initial: keyof typeof evidenceCases) => tsx(['EvidenceDetail', 'Field', 'Select', 'type EvidenceDetailProps'], `<>
  ${selector('Local evidence scenario')}
  <EvidenceDetail label="Discover answer evidence"
    scope="Project demo-42 · execution demo-run-17 · English / United Arab Emirates"
    provenance="Synthetic saved API execution · immutable prompt version 3" {...scenarios[mode]}
    answer={<p>Illustrative synthetic answer from the saved execution.</p>}
    evidence={<p>Annotation 1 · retained-fragment-v1 · ownership ambiguous.</p>}
    sources={<ul><li>Cited source: <bdi dir="ltr">https://example.org/cited</bdi></li><li>Retrieved source: <bdi dir="ltr">https://example.org/retrieved</bdi> · no explicit citation supplied</li></ul>} />
</>`, setup(evidenceCases, "Pick<EvidenceDetailProps, 'availability' | 'message'>", initial), ['useId', 'useState']);
const reportCode = (initial: keyof typeof reportCases) => tsx(['ReportPanel', 'Field', 'Select', 'type ReportPanelProps'], `<>
  ${selector('Local widget scenario')}
  <ReportPanel title="Accepted events" scope="Project demo-42 · 18 October 2026 · UTC"
    source="Synthetic collector A" asOf="19 October 2026, 09:30 UTC" {...scenarios[mode]}>
    <p>{mode === 'zero' ? '0' : '42'} accepted events</p>
  </ReportPanel>
  <ReportPanel title="Unaffected sibling widget" scope="Project demo-42 · 18 October 2026 · UTC"
    source="Synthetic collector C" asOf="19 October 2026, 09:30 UTC" status="ready">
    <p>12 accepted events</p>
  </ReportPanel>
</>`, setup(reportCases, "Pick<ReportPanelProps, 'status' | 'reason' | 'retainedContent'>", initial), ['useId', 'useState']);
const costCode = (initial: keyof typeof costCases) => tsx(['RunCostSummary', 'Field', 'Select', 'type RunCostSummaryProps'], `<>
  ${selector('Local cost scenario')}
  <RunCostSummary scope="Project demo-42 · seed: analytics · UAE / English · DataForSEO Labs / Google"
    units="Up to 25 keyword ideas · 1 task · bounded result, not all results"
    quoteExpiryLabel="19 October 2026, 09:35 UTC (app-supplied label)"
    receipt={<bdi dir="ltr">demo-request-17 / demo-quote-3</bdi>}
    warnings="Retrieval does not establish index freshness. Estimate covers only this app request." {...scenarios[mode]} />
</>`, setup(costCases, "Pick<RunCostSummaryProps, 'state' | 'estimatedPrice' | 'settledPrice' | 'reason'>", initial), ['useId', 'useState']);

export const reportingEntries: ComponentEntry[] = [
  {
    name: 'EvidenceDetail', category: 'Data display', description: 'A scoped answer, evidence and source detail with explicit availability and app-owned Back navigation.',
    usage: 'Use for Discover D11/D12 research evidence and D16/D17 answer inspection. EvidenceSummary remains the compact measurement-quality component. Supply retained provenance and exact source labels; this component does not classify cited versus retrieved sources, reconstruct missing answers, fetch payloads or parse HTML. Payload slots render only when availability is ready. The app owns permission checks, redaction, safe links, retention and navigation/focus restoration.',
    props: [prop('label', 'string', 'Accessible region name and default visible heading.', true), prop('title', 'ReactNode', 'Optional visible heading.', false, 'label'), prop('scope', 'ReactNode', 'Exact project, execution, prompt/version, market and applied scope.', true), prop('provenance', 'ReactNode', 'App-supplied evidence method, source identity and observation context.', true), prop('availability', 'EvidenceAvailability', 'ready/loading/empty/unavailable/expired/forbidden/error; only ready displays payload slots.', true), prop('message', 'ReactNode', 'Visible availability or evidence limitation explanation.'), prop('answer', 'ReactNode', 'Original answer rendered as safe React content; never reconstructed.'), prop('evidence', 'ReactNode', 'App-owned annotations or evidence display.'), prop('sources', 'ReactNode', 'App-labelled source content preserving cited versus retrieved distinctions.'), prop('children', 'ReactNode', 'Additional authorized detail content, displayed only when ready.'), prop('actions', 'ReactNode', 'Explicit app-owned authorized inspection/recovery controls.'), prop('onBack', '() => void', 'Optional app-controlled navigation and focus restoration.'), prop('backLabel', 'string', 'Visible native Back button label.', false, 'Back to results'), prop('className', 'string', 'Additional root classes.')],
    tokens, accessibility: ['Named region, visible scope and provenance, and headings for answer/evidence/sources.', 'Availability is readable text in a polite status; loading marks the region busy.', 'Optional Back is a native keyboard button; the app restores the originating list focus.', 'URLs and answer text wrap at narrow widths; supply safe React nodes and labelled external links.'], related: ['EvidenceSummary', 'ReportPanel', 'DetailWorkspace'], example: evidenceCode('ready'),
    states: (Object.keys(evidenceCases) as (keyof typeof evidenceCases)[]).map(mode => ({ name: mode, description: evidenceCases[mode].message, preview: <EvidenceDemo initial={mode} />, code: evidenceCode(mode) })),
  },
  {
    name: 'ReportPanel', category: 'Data display', description: 'An individual widget frame with scope, source, as-of, local status and controlled retained content.',
    usage: 'Use for D9 report widgets and D10 measurement context. Supply each widget independently so a failed widget does not erase its siblings. The app renders accessible charts/tables through children, owns revisions/sharing/export/query math, and permits any retained payload. Partial/stale content remains visibly qualified. Forbidden/expired/empty states hide children; loading/error show children only when retainedContent is true. No board, chart or retry engine is included.',
    props: [prop('title', 'ReactNode', 'Widget heading and accessible region name.', true), prop('scope', 'ReactNode', 'Applied query, filters, period, timezone and counting scope.', true), prop('source', 'ReactNode', 'Exact source/provenance label.', true), prop('asOf', 'ReactNode', 'Preformatted observation time or explicit unavailable label.', true), prop('status', 'ReportPanelStatus', 'loading/ready/empty/partial/stale/error/forbidden/expired.', true), prop('reason', 'ReactNode', 'Visible reason for partial, stale, empty or unavailable states.'), prop('retainedContent', 'boolean', 'App explicitly permits supplied children during loading/error. Never exposes forbidden/expired payload.', false, 'false'), prop('retainedContentLabel', 'ReactNode', 'App-controlled label identifying retained data; no freshness is inferred.', false, 'Previously supplied content is shown; this refresh has not confirmed new data.'), prop('children', 'ReactNode', 'App-rendered authorized metric, table or chart with accessible equivalent.'), prop('actions', 'ReactNode', 'Caller-owned widget controls.'), prop('retry', 'ReactNode', 'Optional caller-owned explicit recovery control; never invoked automatically.'), prop('className', 'string', 'Additional root classes.')],
    tokens, accessibility: ['Named region with visible scope, source and as-of context.', 'An error uses one alert with its reason; other states use a polite status. Avoid a second alert for the same error.', 'Textual status and retained-content notice supplement color.', 'Loading exposes aria-busy; content does not trigger requests or move focus.', 'App-supplied visualizations require textual values or table equivalents; controls and long context wrap.'], related: ['Card', 'EvidenceSummary', 'EvidenceDetail', 'DataTable'], example: reportCode('partial'),
    states: (Object.keys(reportCases) as (keyof typeof reportCases)[]).map(mode => ({ name: mode === 'error' ? 'retained error' : mode, description: reportCases[mode].reason, preview: <ReportDemo initial={mode} />, code: reportCode(mode) })),
  },
  {
    name: 'RunCostSummary', category: 'Data display', description: 'Exact request scope, usage bound, quote and settled charge without calculating or authorizing paid work.',
    usage: 'Use beside D11/D12 charged research and D16 execution review or receipt inspection. ReviewSummary remains the before/after change review. Supply preformatted provider/currency/unit labels, quote expiry and original receipt. Missing settlement is unknown, distinct from an explicit settled zero. The app owns current quotes, approval, permission checks, spending controls, request identity and reconciliation. State never creates or enables an action; supply only authorized controls.',
    props: [prop('title', 'ReactNode', 'Region heading.', false, 'Run cost summary'), prop('scope', 'ReactNode', 'Exact quoted or original request, provider, market, filters and bounds.', true), prop('units', 'ReactNode', 'Preformatted provider usage units and result/page bound.', true), prop('estimatedPrice', 'ReactNode', 'Exact preformatted currency/estimate; omitted means unavailable.'), prop('settledPrice', 'ReactNode', 'Exact settled value; omitted means unknown, while zero stays zero.'), prop('quoteExpiryLabel', 'ReactNode', 'App-formatted expiry label; no clock or expiry computation runs.'), prop('receipt', 'ReactNode', 'Original receipt or request reference for reconciliation.'), prop('state', 'RunCostState', 'quoted/pending/settled/uncertain/expired/blocked, entirely app-controlled.', true), prop('reason', 'ReactNode', 'Visible state reason or execution limitation.'), prop('warnings', 'ReactNode', 'Visible estimate/provider/coverage limitations.'), prop('actions', 'ReactNode', 'Only app-authorized controls. No action is created, enabled or retried by state.'), prop('className', 'string', 'Additional root classes.')],
    tokens, accessibility: ['Named region and definition list attach prices to exact units, scope and receipt.', 'Unknown settled amount and explicit zero have distinct readable content.', 'Uncertain charge has visible reconciliation guidance, with no automatic action.', 'App supplies keyboard controls; long references and prices wrap and may use bdi for direction.'], related: ['ReviewSummary', 'OperationResults', 'EvidenceSummary'], example: costCode('uncertain'),
    states: (Object.keys(costCases) as (keyof typeof costCases)[]).map(mode => ({ name: mode === 'uncertain' ? 'unknown / uncertain' : mode === 'zero' ? 'settled zero' : mode, description: costCases[mode].reason, preview: <CostDemo initial={mode} />, code: costCode(mode) })),
  },
];
