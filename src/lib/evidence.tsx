'use client';

import { useId, type ReactNode } from 'react';
import { Alert, Badge, Card, cx, type Tone } from './primitives.js';

export interface EvidenceTimestamp { label: ReactNode; dateTime?: string }
export interface EvidenceFreshness { status: 'current' | 'stale' | 'unknown'; reason: ReactNode }
export interface EvidenceCoverage { status: 'complete' | 'partial' | 'unavailable'; reason: ReactNode }
export interface EvidenceSummaryProps {
  title?: ReactNode;
  source: ReactNode;
  observedAt?: EvidenceTimestamp;
  basis?: ReactNode;
  variant?: 'full' | 'compact';
  details?: ReactNode;
  availability?: 'ready' | 'loading' | 'empty' | 'unavailable';
  reason?: ReactNode;
  value?: ReactNode;
  freshness?: EvidenceFreshness;
  coverage?: EvidenceCoverage;
  actions?: ReactNode;
  className?: string;
}

/** App-supplied evidence and quality; never calculates freshness, coverage or metric values. */
export function EvidenceSummary({
  title = 'Evidence summary', source, observedAt, basis, availability = 'ready', reason,
  value, freshness, coverage, actions, className, variant = 'full', details,
}: EvidenceSummaryProps) {
  const id = useId();
  if (variant === 'compact') return <section className={cx('t98-evidence-summary', 't98-evidence-summary--compact', className)} aria-label={typeof title === 'string' ? title : 'Evidence summary'} aria-busy={availability === 'loading' || undefined}>
    <div className="t98-evidence-compact-line"><strong>{source}</strong>{observedAt && <time dateTime={observedAt.dateTime}>{observedAt.label}</time>}{availability !== 'ready' && <Badge tone={availability === 'unavailable' ? 'warning' : 'info'}>{availability === 'loading' ? 'Updating' : availability === 'empty' ? 'No matching evidence' : 'Unavailable'}</Badge>}{actions}</div>
    {availability === 'ready' && value != null && <div className="t98-evidence-value">{value}</div>}
    {reason != null && <p className="t98-evidence-reason">{reason}</p>}
    {freshness && freshness.status !== 'current' && <p className="t98-evidence-quality-reason"><strong>{freshness.status === 'stale' ? 'Stale' : 'Freshness unknown'}: </strong>{freshness.reason}</p>}
    {coverage && coverage.status !== 'complete' && <p className="t98-evidence-quality-reason"><strong>{coverage.status === 'partial' ? 'Partial coverage' : 'Coverage unavailable'}: </strong>{coverage.reason}</p>}
    {(basis != null || details != null) && <details className="t98-evidence-disclosure"><summary>Measurement details</summary>{basis != null && <div>{basis}</div>}{details}</details>}
  </section>;
  return <Card className={cx('t98-evidence-summary', className)} title={<span id={id}>{title}</span>}
    role="region" aria-labelledby={id} aria-busy={availability === 'loading' || undefined} actions={actions}>
    {availability === 'ready' && value != null && <div className="t98-evidence-value">{value}</div>}
    {availability !== 'ready' && <Alert className="t98-evidence-state" tone={availability === 'unavailable' ? 'warning' : 'info'}
      title={availability === 'loading' ? 'Loading evidence' : availability === 'empty' ? 'No matching evidence' : 'Evidence unavailable'}>
      {reason ?? (availability === 'loading' ? 'Waiting for evidence. No new measurement is confirmed.' : availability === 'empty' ? 'No evidence matches this scope. This is not a measured zero.' : 'No measured value is available.')}
    </Alert>}
    {availability === 'ready' && reason != null && <p className="t98-evidence-reason">{reason}</p>}
    <dl className="t98-evidence-details">
      <div><dt>Source / provenance</dt><dd>{source}</dd></div>
      <div><dt>Observed at</dt><dd>{observedAt ? <time dateTime={observedAt.dateTime}>{observedAt.label}</time> : 'Observation time unavailable'}</dd></div>
      {basis != null && <div><dt>Measurement basis</dt><dd>{basis}</dd></div>}
      {freshness && <div><dt>Freshness</dt><dd><Badge tone={freshness.status === 'current' ? 'success' : 'warning'}>{freshness.status === 'current' ? 'Current' : freshness.status === 'stale' ? 'Stale' : 'Freshness unknown'}</Badge><div className="t98-evidence-quality-reason">{freshness.reason}</div></dd></div>}
      {coverage && <div><dt>Coverage</dt><dd><Badge tone={coverage.status === 'complete' ? 'neutral' : 'warning'}>{coverage.status === 'complete' ? 'Complete for stated scope' : coverage.status === 'partial' ? 'Partial coverage' : 'Coverage unavailable'}</Badge><div className="t98-evidence-quality-reason">{coverage.reason}</div></dd></div>}
    </dl>
    {details != null && <div className="t98-evidence-extra">{details}</div>}
  </Card>;
}

export type OperationStatus = 'submitted' | 'accepted' | 'delivered' | 'observed' | 'pending' | 'unknown' | 'confirmed' | 'error' | 'suppressed' | 'skipped';
export interface OperationTargetResult {
  id: string;
  target: ReactNode;
  status: OperationStatus;
  detail?: ReactNode;
  receipt?: ReactNode;
  error?: ReactNode;
  actions?: ReactNode;
}
export interface OperationResultsProps {
  title?: ReactNode;
  description?: ReactNode;
  items: readonly OperationTargetResult[];
  loading?: boolean;
  emptyMessage?: ReactNode;
  className?: string;
}
const operationStatus: Record<OperationStatus, { label: string; tone: Tone; description: string }> = {
  submitted: { label: 'Submitted', tone: 'info', description: 'The request was submitted; acceptance or delivery is not confirmed.' },
  accepted: { label: 'Accepted', tone: 'info', description: 'The provider accepted the request. This does not establish delivery.' },
  delivered: { label: 'Delivered', tone: 'success', description: 'The application supplied a delivery receipt; later observation remains separate.' },
  observed: { label: 'Observed', tone: 'success', description: 'The application supplied observed outcome evidence.' },
  pending: { label: 'Pending confirmation', tone: 'info', description: 'Waiting for a result. The outcome is not confirmed.' },
  unknown: { label: 'Outcome unknown', tone: 'warning', description: 'The action may have completed. Check its receipt before repeating it.' },
  confirmed: { label: 'Confirmed', tone: 'success', description: 'The application has supplied a confirmed result.' },
  error: { label: 'Failed', tone: 'danger', description: 'The application reports a failure. Review its details before any retry.' },
  suppressed: { label: 'Suppressed', tone: 'neutral', description: 'Not sent: the target is suppressed, for example unsubscribed or previously bounced.' },
  skipped: { label: 'Skipped', tone: 'neutral', description: 'Not attempted. The application decided not to send to this target.' },
};

/** Per-target receipts; actions are caller-owned and nothing is retried automatically. */
export function OperationResults({ title = 'Operation results', description, items, loading = false, emptyMessage = 'No operation results yet.', className }: OperationResultsProps) {
  const id = useId();
  return <Card className={cx('t98-operation-results', className)} title={<span id={id}>{title}</span>} description={description}
    role="region" aria-labelledby={id} aria-busy={loading || undefined}>
    {loading && <p className="t98-operation-loading" role="status">Loading operation results. Outcomes have not been confirmed.</p>}
    {!loading && items.length === 0 && <p className="t98-operation-empty">{emptyMessage}</p>}
    <ul className="t98-operation-list" aria-live="polite" aria-relevant="additions text">
      {items.map(item => <li className={cx('t98-operation-item', `t98-operation-item--${item.status}`)} key={item.id}>
        <div className="t98-operation-heading"><h4 className="t98-operation-target">{item.target}</h4><Badge tone={operationStatus[item.status].tone}>{operationStatus[item.status].label}</Badge></div>
        <p className="t98-operation-detail">{item.detail ?? operationStatus[item.status].description}</p>
        {item.receipt != null && <dl className="t98-operation-receipt"><dt>Receipt / request reference</dt><dd>{item.receipt}</dd></dl>}
        {item.error != null && <div className="t98-operation-error"><strong>Error details</strong><div>{item.error}</div></div>}
        {item.actions != null && <div className="t98-operation-actions">{item.actions}</div>}
      </li>)}
    </ul>
  </Card>;
}

export interface ReviewChange { id: string; label: ReactNode; before: ReactNode; after: ReactNode }
export interface ReviewSummaryProps {
  title?: ReactNode;
  description?: ReactNode;
  scope: ReactNode;
  resource: ReactNode;
  changes: readonly ReviewChange[];
  consequences?: ReactNode;
  actions?: ReactNode;
  readOnlyReason?: ReactNode;
  className?: string;
}

/** Review presentation only; the app owns authorization, revisions, validation and submission. */
export function ReviewSummary({ title = 'Review change', description, scope, resource, changes, consequences, actions, readOnlyReason, className }: ReviewSummaryProps) {
  const id = useId();
  return <Card className={cx('t98-review-summary', className)} title={<span id={id}>{title}</span>} description={description} role="region" aria-labelledby={id}>
    <dl className="t98-review-identity"><div><dt>Scope</dt><dd>{scope}</dd></div><div><dt>Resource</dt><dd>{resource}</dd></div></dl>
    {readOnlyReason != null && <Alert className="t98-review-read-only" title="Read-only review">{readOnlyReason}</Alert>}
    {changes.length ? <div className="t98-review-table-region" role="region" aria-label="Proposed changes" tabIndex={0}>
      <table className="t98-review-table"><caption>Proposed changes</caption><thead><tr><th scope="col">Field</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
        <tbody>{changes.map(change => <tr key={change.id}><th scope="row">{change.label}</th><td>{change.before}</td><td>{change.after}</td></tr>)}</tbody>
      </table>
    </div> : <p className="t98-review-empty">No changes to review.</p>}
    {consequences != null && <div className="t98-review-consequences"><h4>Consequences</h4>{consequences}</div>}
    {actions != null && <div className="t98-review-actions">{actions}</div>}
  </Card>;
}
