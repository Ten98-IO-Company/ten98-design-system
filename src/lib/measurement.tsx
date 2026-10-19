'use client';

import { type ReactNode } from 'react';
import { Badge, Button, Icon, cx, type Tone } from './primitives.js';

export interface AppliedFilter {
  id: string;
  label: string;
  operator?: string;
  value: string;
  removeLabel?: string;
}

export interface AppliedFiltersProps {
  filters: readonly AppliedFilter[];
  label?: string;
  onRemove?: (id: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  /** Describes unapplied edits; never replaces the visible applied scope. */
  pendingDraft?: string;
  className?: string;
}

/** App owns applying filters, result scope, query serialization and history. */
export function AppliedFilters({ filters, label = 'Applied scope', onRemove, onClear, disabled = false, pendingDraft, className }: AppliedFiltersProps) {
  return <section className={cx('t98-applied-filters', className)} aria-label={label}>
    <div className="t98-applied-header"><h3 className="t98-applied-title">{label}</h3>
      {onClear && filters.length > 0 && <Button variant="ghost" size="sm" disabled={disabled} onClick={onClear}>Clear all filters</Button>}
    </div>
    {filters.length > 0 ? <ul className="t98-applied-list">{filters.map(filter => <li className="t98-applied-chip" key={filter.id}>
      <span className="t98-applied-label">{filter.label}</span>{' '}
      {filter.operator && <><span className="t98-applied-operator">{filter.operator}</span>{' '}</>}
      <span className="t98-applied-value">{filter.value}</span>
      {onRemove && <Button className="t98-applied-remove" variant="ghost" size="sm" disabled={disabled}
        aria-label={filter.removeLabel ?? `Remove filter: ${filter.label}${filter.operator ? ` ${filter.operator}` : ''} ${filter.value}`}
        onClick={() => onRemove(filter.id)} icon={<Icon name="x" size={14} />} />}
    </li>)}</ul> : <p className="t98-applied-empty">No filters applied.</p>}
    {pendingDraft && <p className="t98-applied-pending" role="status">{pendingDraft} Results still use the applied scope above.</p>}
  </section>;
}

export type InstallationState = 'not-checked' | 'not-installed' | 'checking' | 'installed' | 'unavailable' | 'disabled';
export type ReceiptState = 'not-checked' | 'waiting' | 'received' | 'stale' | 'unavailable' | 'disabled';
export interface TrackerObservation<State> {
  state: State;
  /** ISO timestamp of this observation, independent of the other observation. */
  observedAt?: string;
  observedAtLabel?: string;
  reason?: string;
}
export interface TrackerStatusProps {
  resource: string;
  installation: TrackerObservation<InstallationState>;
  receipt: TrackerObservation<ReceiptState>;
  actions?: ReactNode;
  className?: string;
}

const installationLabels: Record<InstallationState, string> = {
  'not-checked': 'Not checked', 'not-installed': 'Not installed', checking: 'Checking', installed: 'Installed', unavailable: 'Check unavailable', disabled: 'Collection disabled',
};
const receiptLabels: Record<ReceiptState, string> = {
  'not-checked': 'Not checked', waiting: 'Waiting for events', received: 'Events received', stale: 'Stale receipt', unavailable: 'Receipt unavailable', disabled: 'Collection disabled',
};
function observationTone(state: InstallationState | ReceiptState): Tone {
  return state === 'installed' || state === 'received' ? 'success' : state === 'unavailable' || state === 'stale' || state === 'not-installed' ? 'warning' : 'neutral';
}

/** Scanner evidence and ingestion evidence are supplied separately by the app. */
export function TrackerStatus({ resource, installation, receipt, actions, className }: TrackerStatusProps) {
  return <section className={cx('t98-tracker-status', className)} aria-label={`Tracking status: ${resource}`}>
    <h3 className="t98-tracker-title">{resource}</h3>
    <div className="t98-tracker-observations">{([
      ['Installation check', installation, installationLabels[installation.state]],
      ['Accepted event receipt', receipt, receiptLabels[receipt.state]],
    ] as const).map(([label, observation, status]) => <section className="t98-tracker-observation" aria-label={label} data-state={observation.state} key={label}>
      <h4 className="t98-tracker-label">{label}</h4><Badge tone={observationTone(observation.state)}>{status}</Badge>
      <p className="t98-tracker-time">Observed: {observation.observedAt ? <time dateTime={observation.observedAt}>{observation.observedAtLabel ?? observation.observedAt}</time> : 'No observation time available'}</p>
      {observation.reason && <p className="t98-tracker-reason">{observation.reason}</p>}
    </section>)}</div>
    <p className="t98-tracker-note">Installation checks and accepted event receipts are separate observations. Copying a snippet confirms neither.</p>
    {actions && <div className="t98-tracker-actions">{actions}</div>}
  </section>;
}

export interface ComparisonValue {
  label: string;
  range: string;
  /** Already formatted by the consumer. Null is unavailable; numeric zero stays zero. */
  value: string | number | null;
  unavailableReason?: string;
  partial?: boolean;
  stale?: boolean;
  updating?: boolean;
  source?: string;
  sourceStatus?: string;
  asOf?: string;
  detail?: ReactNode;
}
export interface ComparisonChange {
  label: string;
  /** Consumer-calculated text, or null with a reason when comparison is unavailable. */
  value: string | null;
  reason?: string;
  tone?: Tone;
}
export interface ComparisonMetricProps {
  label: string;
  current: ComparisonValue;
  baseline: ComparisonValue;
  change?: ComparisonChange;
  className?: string;
}

/** Presentation only: compatibility, units, formatting and change math belong to the app. */
export function ComparisonMetric({ label, current, baseline, change, className }: ComparisonMetricProps) {
  return <article className={cx('t98-comparison-metric', className)} aria-label={label}>
    <h3 className="t98-comparison-title">{label}</h3>
    <div className="t98-comparison-values">{([['current', current], ['baseline', baseline]] as const).map(([kind, observation]) => <section className="t98-comparison-observation" aria-label={`${kind === 'current' ? 'Current' : 'Baseline'}: ${observation.label}`} data-observation={kind} key={kind}>
      <h4 className="t98-comparison-label">{observation.label}</h4><p className="t98-comparison-range">{observation.range}</p>
      <p className="t98-comparison-value" data-unavailable={observation.value === null || undefined}>{observation.value === null ? 'Unavailable' : observation.value}</p>
      <div className="t98-comparison-quality">
        {observation.partial && <Badge tone="warning">Partial</Badge>}{observation.stale && <Badge tone="warning">Stale</Badge>}{observation.updating && <Badge tone="info">Updating</Badge>}
      </div>
      {observation.value === null && <p className="t98-comparison-reason">{observation.unavailableReason ?? 'No observation available.'}</p>}
      {observation.source && <p className="t98-comparison-source">Source: {observation.source}</p>}
      {observation.sourceStatus && <p className="t98-comparison-source-status">Source status: {observation.sourceStatus}</p>}
      {observation.asOf && <p className="t98-comparison-time">As of: {observation.asOf}</p>}
      {observation.detail && <div className="t98-comparison-detail">{observation.detail}</div>}
    </section>)}</div>
    {change ? <div className="t98-comparison-change"><span className="t98-comparison-change-label">{change.label}: </span><Badge tone={change.tone}>{change.value === null ? 'Unavailable' : change.value}</Badge>
      {change.value === null && <p className="t98-comparison-reason">{change.reason ?? 'No comparison available.'}</p>}
    </div> : <p className="t98-comparison-reason">Comparison not supplied.</p>}
  </article>;
}
