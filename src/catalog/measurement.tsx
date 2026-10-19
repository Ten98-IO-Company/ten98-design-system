import { useState } from 'react';
import { Button } from '../lib/primitives.js';
import { CopyButton } from '../lib/workspace.js';
import {
  AppliedFilters, ComparisonMetric, TrackerStatus,
  type AppliedFilter, type ComparisonChange, type ComparisonValue,
  type InstallationState, type ReceiptState, type TrackerObservation,
} from '../lib/measurement.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const surfaceTokens = ['--t98-surface', '--t98-text', '--t98-muted', '--t98-border', '--t98-radius', '--t98-font', '--t98-space-2', '--t98-space-3', '--t98-space-4'];
const qualityTokens = ['--t98-warning', '--t98-warning-soft', '--t98-success', '--t98-success-soft', '--t98-info', '--t98-info-soft'];
const sampleFilters: AppliedFilter[] = [{ id: 'country', label: 'Country', operator: 'is', value: 'United Arab Emirates' }, { id: 'device', label: 'Device', operator: 'is', value: 'Mobile' }];
type FilterMode = 'applied' | 'pending' | 'disabled' | 'empty' | 'readonly';

function AppliedDemo({ mode = 'applied' }: { mode?: FilterMode }) {
  const [filters, setFilters] = useState<AppliedFilter[]>(mode === 'empty' ? [] : sampleFilters);
  const [pending, setPending] = useState(mode === 'pending');
  return <div><AppliedFilters filters={filters} disabled={mode === 'disabled'} pendingDraft={pending ? 'Draft country: Canada.' : undefined}
    onRemove={mode === 'readonly' ? undefined : id => setFilters(current => current.filter(filter => filter.id !== id))}
    onClear={mode === 'readonly' ? undefined : () => setFilters([])} />
    {mode !== 'readonly' && <><Button variant="secondary" disabled={mode === 'disabled'} onClick={() => setPending(value => !value)}>Toggle draft edits</Button>{' '}
      <Button variant="ghost" disabled={mode === 'disabled'} onClick={() => { setFilters(sampleFilters); setPending(false); }}>Reset applied demo</Button></>}
  </div>;
}
function appliedCode(mode: FilterMode = 'applied') {
  return tsx(['AppliedFilters', 'Button', 'type AppliedFilter'], `<>
  <AppliedFilters filters={filters}${mode === 'disabled' ? ' disabled' : ''}
    pendingDraft={pending ? 'Draft country: Canada.' : undefined}${mode === 'readonly' ? '' : `
    onRemove={id => setFilters(current => current.filter(filter => filter.id !== id))}
    onClear={() => setFilters([])}`} />${mode === 'readonly' ? '' : `
  <Button variant="secondary"${mode === 'disabled' ? ' disabled' : ''} onClick={() => setPending(value => !value)}>Toggle draft edits</Button>
  <Button variant="ghost"${mode === 'disabled' ? ' disabled' : ''} onClick={() => { setFilters(sampleFilters); setPending(false); }}>Reset applied demo</Button>`}
</>`, `const sampleFilters: AppliedFilter[] = ${JSON.stringify(sampleFilters)};
const [filters, setFilters] = useState<AppliedFilter[]>(${mode === 'empty' ? '[]' : 'sampleFilters'});
const [pending, setPending] = useState(${mode === 'pending'});`, ['useState']);
}

type TrackerMode = 'not-checked' | 'not-installed' | 'checking' | 'installed-waiting' | 'unavailable-received' | 'disabled' | 'stale';
const trackerFixtures: Record<TrackerMode, { installation: TrackerObservation<InstallationState>; receipt: TrackerObservation<ReceiptState> }> = {
  'not-checked': { installation: { state: 'not-checked', reason: 'No scanner observation yet.' }, receipt: { state: 'not-checked', reason: 'No receipt lookup yet.' } },
  'not-installed': { installation: { state: 'not-installed', observedAt: '2026-10-19T08:00:00Z', observedAtLabel: '19 October, 08:00 UTC', reason: 'Snippet absent from the inspected page.' }, receipt: { state: 'waiting', reason: 'No accepted event observed.' } },
  checking: { installation: { state: 'checking', reason: 'Demo scanner request in progress.' }, receipt: { state: 'waiting', reason: 'Receipt evidence is independent of the scanner request.' } },
  'installed-waiting': { installation: { state: 'installed', observedAt: '2026-10-19T08:00:00Z', observedAtLabel: '19 October, 08:00 UTC', reason: 'Snippet found on the inspected page.' }, receipt: { state: 'waiting', reason: 'No accepted event yet; consent can affect collection.' } },
  'unavailable-received': { installation: { state: 'unavailable', observedAt: '2026-10-19T08:00:00Z', observedAtLabel: '19 October, 08:00 UTC', reason: 'Scanner blocked by the site. This does not invalidate accepted events.' }, receipt: { state: 'received', observedAt: '2026-10-19T08:03:00Z', observedAtLabel: '19 October, 08:03 UTC', reason: 'An accepted pageview was observed; this does not establish traffic coverage.' } },
  disabled: { installation: { state: 'disabled', reason: 'Collection is disabled in this demo configuration.' }, receipt: { state: 'disabled', reason: 'No new collection is expected while disabled.' } },
  stale: { installation: { state: 'installed', observedAt: '2026-10-18T08:00:00Z', observedAtLabel: '18 October, 08:00 UTC', reason: 'Last scanner evidence retained.' }, receipt: { state: 'stale', observedAt: '2026-10-17T08:03:00Z', observedAtLabel: '17 October, 08:03 UTC', reason: 'Last receipt is older than the app freshness threshold.' } },
};
const installedDemo: TrackerObservation<InstallationState> = { state: 'installed', observedAt: '2026-10-19T08:00:00Z', reason: 'Synthetic scanner observation.' };
const receivedDemo: TrackerObservation<ReceiptState> = { state: 'received', observedAt: '2026-10-19T08:03:00Z', reason: 'Synthetic accepted pageview.' };
const snippet = '<script data-website-id="demo" src="/demo-tracker.js"></script>';

function TrackerDemo({ mode = 'installed-waiting' }: { mode?: TrackerMode }) {
  const [installation, setInstallation] = useState(trackerFixtures[mode].installation);
  const [receipt, setReceipt] = useState(trackerFixtures[mode].receipt);
  return <div><TrackerStatus resource="example.test · synthetic evidence" installation={installation} receipt={receipt} actions={<>
    <CopyButton value={snippet} label="Copy demo snippet" />
    <Button variant="secondary" onClick={() => setInstallation(installedDemo)}>Set demo check: installed</Button>
    <Button variant="secondary" onClick={() => setReceipt(receivedDemo)}>Set demo receipt: received</Button>
    <Button variant="ghost" onClick={() => { setInstallation(trackerFixtures[mode].installation); setReceipt(trackerFixtures[mode].receipt); }}>Reset observations</Button>
  </>} /><p>Each button changes only its named local observation. No scanner or ingestion request runs.</p></div>;
}
function trackerCode(mode: TrackerMode = 'installed-waiting') {
  return tsx(['TrackerStatus', 'Button', 'CopyButton', 'type TrackerObservation', 'type InstallationState', 'type ReceiptState'], `<>
  <TrackerStatus resource="example.test · synthetic evidence" installation={installation} receipt={receipt} actions={<>
    <CopyButton value={snippet} label="Copy demo snippet" />
    <Button variant="secondary" onClick={() => setInstallation(installedDemo)}>Set demo check: installed</Button>
    <Button variant="secondary" onClick={() => setReceipt(receivedDemo)}>Set demo receipt: received</Button>
    <Button variant="ghost" onClick={() => { setInstallation(initialInstallation); setReceipt(initialReceipt); }}>Reset observations</Button>
  </>} />
  <p>Each button changes only its named local observation. No scanner or ingestion request runs.</p>
</>`, `const initialInstallation: TrackerObservation<InstallationState> = ${JSON.stringify(trackerFixtures[mode].installation)};
const initialReceipt: TrackerObservation<ReceiptState> = ${JSON.stringify(trackerFixtures[mode].receipt)};
const installedDemo: TrackerObservation<InstallationState> = ${JSON.stringify(installedDemo)};
const receivedDemo: TrackerObservation<ReceiptState> = ${JSON.stringify(receivedDemo)};
const snippet = ${JSON.stringify(snippet)};
const [installation, setInstallation] = useState(initialInstallation);
const [receipt, setReceipt] = useState(initialReceipt);`, ['useState']);
}

type ComparisonMode = 'measured' | 'zero' | 'unavailable' | 'partial' | 'stale' | 'updating' | 'zero-baseline' | 'incompatible' | 'rank';
const currentValue: ComparisonValue = { label: 'Current period', range: '1–19 October 2026 · UTC', value: '1,240', source: 'Accepted website events', sourceStatus: 'Measured', asOf: '19 October 2026, 08:00 UTC' };
const baselineValue: ComparisonValue = { label: 'Previous period', range: '12–30 September 2026 · UTC', value: '1,000', source: 'Accepted website events', sourceStatus: 'Measured' };
const comparisonFixtures: Record<ComparisonMode, { label: string; current: ComparisonValue; baseline: ComparisonValue; change: ComparisonChange }> = {
  measured: { label: 'Visits', current: currentValue, baseline: baselineValue, change: { label: 'Change from previous period', value: '+24%', tone: 'success' } },
  zero: { label: 'Visits', current: { ...currentValue, value: 0 }, baseline: baselineValue, change: { label: 'Change from previous period', value: '−100%', tone: 'neutral' } },
  unavailable: { label: 'Visits', current: { ...currentValue, value: null, sourceStatus: 'Access revoked', unavailableReason: 'Current observations cannot be read.' }, baseline: baselineValue, change: { label: 'Change', value: null, reason: 'Current period is unavailable.' } },
  partial: { label: 'Visits', current: { ...currentValue, partial: true, sourceStatus: '18 of 19 daily partitions available', detail: 'Coverage excludes the missing partition. The missing traffic denominator is unknown.' }, baseline: baselineValue, change: { label: 'Change', value: null, reason: 'Collection scope is incomplete.' } },
  stale: { label: 'Visits', current: { ...currentValue, stale: true, asOf: '17 October 2026, 08:00 UTC', sourceStatus: 'Last sync failed', detail: 'Previous successful observations retain their original period.' }, baseline: baselineValue, change: { label: 'Change', value: '+24% in retained snapshot', tone: 'neutral' } },
  updating: { label: 'Visits', current: { ...currentValue, updating: true, sourceStatus: 'Refresh in progress', detail: 'This value remains the previous successful observation until the app supplies a replacement.' }, baseline: baselineValue, change: { label: 'Change in retained snapshot', value: '+24%' } },
  'zero-baseline': { label: 'Visits', current: { ...currentValue, value: 12 }, baseline: { ...baselineValue, value: 0 }, change: { label: 'Relative change', value: null, reason: 'The baseline is measured zero; no relative percentage is supplied.' } },
  incompatible: { label: 'Visits', current: { ...currentValue, detail: 'Scope: mobile devices.' }, baseline: { ...baselineValue, detail: 'Scope: all devices.' }, change: { label: 'Change', value: null, reason: 'Device scopes are incompatible.' } },
  rank: { label: 'Keyword position', current: { ...currentValue, value: 4, source: 'Rank observation · mobile · UAE', sourceStatus: 'Observed within top 100', detail: 'Lower position numbers rank higher.' }, baseline: { ...baselineValue, value: 6, source: 'Rank observation · mobile · UAE', sourceStatus: 'Observed within top 100' }, change: { label: 'Position change', value: '2 positions higher', tone: 'success' } },
};
function ComparisonDemo({ mode = 'measured' }: { mode?: ComparisonMode }) {
  const fixture = comparisonFixtures[mode];
  const [hidden, setHidden] = useState(false);
  return <div><ComparisonMetric label={fixture.label} current={hidden ? { ...fixture.current, value: null, unavailableReason: 'Demo observation hidden.' } : fixture.current}
    baseline={fixture.baseline} change={hidden ? { label: 'Change', value: null, reason: 'Current observation hidden.' } : fixture.change} />
    <Button variant="secondary" onClick={() => setHidden(value => !value)}>{hidden ? 'Restore supplied observation' : 'Hide current observation'}</Button>
    <p>Values and change text are synthetic app inputs. The component performs no comparison calculation.</p></div>;
}
function comparisonCode(mode: ComparisonMode = 'measured') {
  const fixture = comparisonFixtures[mode];
  return tsx(['ComparisonMetric', 'Button', 'type ComparisonValue', 'type ComparisonChange'], `<>
  <ComparisonMetric label=${JSON.stringify(fixture.label)}
    current={hidden ? { ...current, value: null, unavailableReason: 'Demo observation hidden.' } : current}
    baseline={baseline}
    change={hidden ? { label: 'Change', value: null, reason: 'Current observation hidden.' } : change} />
  <Button variant="secondary" onClick={() => setHidden(value => !value)}>{hidden ? 'Restore supplied observation' : 'Hide current observation'}</Button>
  <p>Values and change text are synthetic app inputs. The component performs no comparison calculation.</p>
</>`, `const current: ComparisonValue = ${JSON.stringify(fixture.current)};
const baseline: ComparisonValue = ${JSON.stringify(fixture.baseline)};
const change: ComparisonChange = ${JSON.stringify(fixture.change)};
const [hidden, setHidden] = useState(false);`, ['useState']);
}

export const measurementEntries: ComponentEntry[] = [
  {
    name: 'AppliedFilters', category: 'Controls', description: 'Readable applied dimension/operator/value chips, with controlled remove and clear actions and a separate draft indicator.',
    usage: 'Use next to measured Discover or Campaign results. Pass the scope of the rendered result, retaining it while pending edits or requests differ. The consumer owns filters, result updates, URL history and server queries; this component never searches or applies draft edits.',
    props: [prop('filters', 'readonly AppliedFilter[]', 'Applied items: stable id, readable dimension label, optional operator, value and optional custom removeLabel for familiar accessible actions.', true), prop('label', 'string', 'Accessible region name and visible heading.', false, 'Applied scope'), prop('onRemove', '(id: string) => void', 'Requests removal of an applied item; absent means read-only chips.'), prop('onClear', '() => void', 'Requests clearing all applied filters; hidden when empty or absent.'), prop('disabled', 'boolean', 'Disables remove and clear actions.', false, 'false'), prop('pendingDraft', 'string', 'Visible unapplied-edit description; never relabels the applied chips.'), prop('className', 'string', 'Additional class on the scope section.')],
    tokens: [...surfaceTokens, '--t98-subtle', '--t98-focus', '--t98-control-touch'],
    accessibility: ['A labelled section and semantic list expose applied scope. Removal buttons name the dimension, operator and value.', 'Native buttons support Tab, Enter and Space. Disabled buttons remain visible and cannot activate.', 'Draft changes use a polite status message; applied chips stay visible. App owns focus recovery after removal or clearing.', 'Chip text and action rows wrap on narrow screens; do not truncate essential scope.'], related: ['Button', 'DateRangeField', 'ComparisonMetric'], example: appliedCode(),
    states: ([['Applied with remove / clear', 'applied', 'Remove a chip, clear all, or reset the controlled local applied scope.'], ['Pending draft', 'pending', 'Draft country differs; rendered results retain the visible applied country until the consumer replaces it.'], ['Disabled', 'disabled', 'Remove, clear and demonstration controls use native disabled buttons.'], ['Cleared', 'empty', 'No applied filters; clear action is absent. Reset restores the demonstration scope.'], ['Read-only scope', 'readonly', 'Without callbacks, chips present scope without removal controls.']] as const).map(([name, mode, description]) => ({ name, description, preview: <AppliedDemo mode={mode} />, code: appliedCode(mode) })),
  },
  {
    name: 'TrackerStatus', category: 'Feedback', description: 'Independent scanner/installation and accepted-event observations, each with its own status, timestamp and explanation.',
    usage: 'Use during website installation and later collection diagnostics. Supply scanner evidence separately from ingestion evidence; copying code and successful checks never manufacture receipt evidence. The app owns scanning, consent, policy, collection, retries and freshness thresholds. Actions are an arbitrary slot.',
    props: [prop('resource', 'string', 'Visible website/configuration scope and accessible tracking section name.', true), prop('installation', 'TrackerObservation<InstallationState>', 'state: not-checked | not-installed | checking | installed | unavailable | disabled; optional independent observedAt ISO timestamp, observedAtLabel and reason.', true), prop('receipt', 'TrackerObservation<ReceiptState>', 'state: not-checked | waiting | received | stale | unavailable | disabled; optional independent observedAt ISO timestamp, observedAtLabel and reason.', true), prop('actions', 'ReactNode', 'Consumer-owned copy, retry or navigation actions; no action implies verification.'), prop('className', 'string', 'Additional class on the tracking section.')],
    tokens: [...surfaceTokens, ...qualityTokens], accessibility: ['Separately labelled installation-check and accepted-event sections expose status as visible text, independent of color.', 'Each observation has a distinct time element when supplied, or explicit missing-time text. Reasons remain visible.', 'Consumer-supplied actions use their own native keyboard semantics; timestamps/statuses never change from copy activity.', 'Observation columns and long labels wrap into a vertical flow on narrow screens.'], related: ['Badge', 'CopyButton', 'Button', 'ResourceCard'], example: trackerCode(),
    states: ([['Not checked', 'not-checked', 'No scanner or receipt evidence has been supplied.'], ['Not installed', 'not-installed', 'The scanner did not find the snippet; event evidence still has its own status.'], ['Checking', 'checking', 'An installation check can run while receipt evidence remains unchanged.'], ['Installed, no event', 'installed-waiting', 'Installation was observed, but no accepted event is confirmed.'], ['Check unavailable, event received', 'unavailable-received', 'An inconclusive scanner result coexists with an accepted event and separate timestamps.'], ['Collection disabled', 'disabled', 'Policy disables collection; the visible reason explains the supplied state.'], ['Stale receipt', 'stale', 'An older receipt retains its timestamp and explanation; installation evidence is independent.']] as const).map(([name, mode, description]) => ({ name, description, preview: <TrackerDemo mode={mode} />, code: trackerCode(mode) })),
  },
  {
    name: 'ComparisonMetric', category: 'Data display', description: 'Explicit current and baseline observations with named ranges, source/quality context and consumer-supplied comparison text.',
    usage: 'Use for measured reports or compatible rank observations. Supply already formatted values and independently calculated change text. Null means unavailable; zero remains measured zero. The app owns units, timezone, retention, scope compatibility, calculations and whether a change is meaningful. Visible quality detail can disclose sampling, retained intervals and limitations without launching collection.',
    props: [prop('label', 'string', 'Metric title and accessible article name.', true), prop('current', 'ComparisonValue', 'label, range and value:string | number | null; optional unavailableReason, partial, stale, updating, source, sourceStatus, asOf and detail.', true), prop('baseline', 'ComparisonValue', 'Named baseline with its own range, value, source, time and quality; never inferred from current data.', true), prop('change', 'ComparisonChange', 'Independent label/value:string | null with optional reason and tone. Omit for explicit “Comparison not supplied”.'), prop('className', 'string', 'Additional class on the metric article.')],
    tokens: [...surfaceTokens, ...qualityTokens, '--t98-text-metric', '--t98-weight-semibold'], accessibility: ['Current and baseline observations are separately labelled sections; values, ranges, source status and limitations are visible text.', 'Unavailable values and reasons are exposed as text; zero is not replaced by an empty-state label.', 'Partial, stale and updating badges use words rather than color alone. Essential limitations belong in detail or reason, not tooltip-only content.', 'The layout wraps on narrow screens and preserves current/baseline reading order. No computed trend or improvement meaning is inferred.'], related: ['MetricCard', 'AppliedFilters', 'Badge', 'DateRangeField'], example: comparisonCode(),
    states: ([['Measured comparison', 'measured', 'Current and baseline have named periods, source context and separately supplied change.'], ['Measured zero', 'zero', 'Current value is numeric zero and remains visible.'], ['Unavailable', 'unavailable', 'Unavailable current observation and comparison carry distinct reasons; baseline remains visible.'], ['Partial coverage', 'partial', 'Visible coverage limitations explain why the supplied comparison is unavailable.'], ['Stale observation', 'stale', 'Retained values show their original as-of time and stale source status.'], ['Updating', 'updating', 'The previous successful observation remains under its original period during refresh.'], ['Zero baseline', 'zero-baseline', 'Baseline zero is rendered as zero, with an explicit unavailable relative comparison.'], ['Incompatible scope', 'incompatible', 'Mobile and all-device observations remain visible with a comparison incompatibility reason.'], ['Rank position meaning', 'rank', 'A lower position number and text change retain the app-defined meaning and observed coverage.']] as const).map(([name, mode, description]) => ({ name, description, preview: <ComparisonDemo mode={mode} />, code: comparisonCode(mode) })),
  },
];
