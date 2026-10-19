'use client';

import { useId, type ReactNode } from 'react';
import { Alert, Badge, Button, Card, cx } from './primitives.js';

export type EvidenceAvailability = 'ready' | 'loading' | 'empty' | 'unavailable' | 'expired' | 'forbidden' | 'error';
export interface EvidenceDetailProps {
  label: string;
  title?: ReactNode;
  scope: ReactNode;
  provenance: ReactNode;
  availability: EvidenceAvailability;
  message?: ReactNode;
  answer?: ReactNode;
  evidence?: ReactNode;
  sources?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}
const evidenceLabels: Record<EvidenceAvailability, string> = {
  ready: 'Evidence available', loading: 'Loading evidence', empty: 'No matching evidence',
  unavailable: 'Evidence unavailable', expired: 'Evidence expired', forbidden: 'Evidence access restricted', error: 'Evidence could not be loaded',
};

/** Slots are safe React content supplied by the app; no fetching, parsing or source classification. */
export function EvidenceDetail({ label, title = label, scope, provenance, availability, message, answer, evidence, sources, children, actions, onBack, backLabel = 'Back to results', className }: EvidenceDetailProps) {
  const id = useId();
  return <section className={cx('t98-evidence-detail-root', className)} aria-labelledby={`${id}-title`} aria-label={label} aria-busy={availability === 'loading' || undefined} data-availability={availability}>
    <div className="t98-evidence-detail-header">{onBack && <Button className="t98-evidence-detail-back" variant="secondary" onClick={onBack}>{backLabel}</Button>}<h3 className="t98-evidence-detail-title" id={`${id}-title`}>{title}</h3></div>
    <dl className="t98-evidence-detail-context"><div><dt>Scope</dt><dd>{scope}</dd></div><div><dt>Provenance</dt><dd>{provenance}</dd></div></dl>
    <div className="t98-evidence-detail-status" role="status"><Badge tone={availability === 'error' ? 'danger' : availability === 'ready' ? 'neutral' : 'warning'}>{evidenceLabels[availability]}</Badge>{message != null && <div className="t98-evidence-detail-message">{message}</div>}</div>
    {availability === 'ready' && <>
      {answer != null && <section className="t98-evidence-detail-answer" aria-labelledby={`${id}-answer`}><h4 id={`${id}-answer`}>Original answer</h4>{answer}</section>}
      {evidence != null && <section className="t98-evidence-detail-evidence" aria-labelledby={`${id}-evidence`}><h4 id={`${id}-evidence`}>Evidence</h4>{evidence}</section>}
      {sources != null && <section className="t98-evidence-detail-sources" aria-labelledby={`${id}-sources`}><h4 id={`${id}-sources`}>Sources</h4>{sources}</section>}
      {children != null && <div className="t98-evidence-detail-content">{children}</div>}
    </>}
    {actions != null && <div className="t98-evidence-detail-actions">{actions}</div>}
  </section>;
}

export type ReportPanelStatus = 'loading' | 'ready' | 'empty' | 'partial' | 'stale' | 'error' | 'forbidden' | 'expired';
export interface ReportPanelProps {
  title: ReactNode;
  scope: ReactNode;
  source: ReactNode;
  asOf: ReactNode;
  status: ReportPanelStatus;
  reason?: ReactNode;
  /** Caller explicitly permits previously supplied content during loading or error. */
  retainedContent?: boolean;
  retainedContentLabel?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  retry?: ReactNode;
  className?: string;
}
const reportLabels: Record<ReportPanelStatus, string> = {
  loading: 'Loading report', ready: 'Report available', empty: 'No report data', partial: 'Partial report',
  stale: 'Stale report', error: 'Report could not be refreshed', forbidden: 'Report access restricted', expired: 'Report evidence expired',
};

/** One widget boundary. App owns rendering, query state, authorization and recovery. */
export function ReportPanel({ title, scope, source, asOf, status, reason, retainedContent = false, retainedContentLabel = 'Previously supplied content is shown; this refresh has not confirmed new data.', children, actions, retry, className }: ReportPanelProps) {
  const id = useId();
  const retained = retainedContent && (status === 'loading' || status === 'error');
  const showContent = status === 'ready' || status === 'partial' || status === 'stale' || retained;
  return <Card className={cx('t98-report-root', className)} title={<span id={`${id}-title`}>{title}</span>} role="region" aria-labelledby={`${id}-title`} aria-busy={status === 'loading' || undefined} data-status={status}>
    <dl className="t98-report-context"><div><dt>Scope</dt><dd>{scope}</dd></div><div><dt>Source</dt><dd>{source}</dd></div><div><dt>As of</dt><dd>{asOf}</dd></div></dl>
    <div className="t98-report-status" role="status"><Badge tone={status === 'error' ? 'danger' : status === 'ready' ? 'neutral' : 'warning'}>{reportLabels[status]}</Badge>{reason != null && <div className="t98-report-reason">{reason}</div>}</div>
    {retained && children != null && <p className="t98-report-retained">{retainedContentLabel}</p>}
    {showContent && children != null && <div className="t98-report-content">{children}</div>}
    {(actions != null || retry != null) && <div className="t98-report-actions">{actions}{retry}</div>}
  </Card>;
}

export type RunCostState = 'quoted' | 'pending' | 'settled' | 'uncertain' | 'expired' | 'blocked';
export interface RunCostSummaryProps {
  title?: ReactNode;
  scope: ReactNode;
  units: ReactNode;
  estimatedPrice?: ReactNode;
  settledPrice?: ReactNode;
  quoteExpiryLabel?: ReactNode;
  receipt?: ReactNode;
  state: RunCostState;
  reason?: ReactNode;
  warnings?: ReactNode;
  actions?: ReactNode;
  className?: string;
}
const costLabels: Record<RunCostState, string> = {
  quoted: 'Quoted estimate', pending: 'Settlement pending', settled: 'Charge settled',
  uncertain: 'Charge uncertain', expired: 'Quote expired', blocked: 'Run blocked',
};

/** Preformatted accounting only. Never computes money, dispatches work or grants approval. */
export function RunCostSummary({ title = 'Run cost summary', scope, units, estimatedPrice, settledPrice, quoteExpiryLabel, receipt, state, reason, warnings, actions, className }: RunCostSummaryProps) {
  const id = useId();
  return <Card className={cx('t98-cost-root', className)} title={<span id={`${id}-title`}>{title}</span>} role="region" aria-labelledby={`${id}-title`} data-state={state}>
    <div className="t98-cost-status" role="status"><Badge tone={state === 'uncertain' || state === 'expired' || state === 'blocked' ? 'warning' : 'neutral'}>{costLabels[state]}</Badge>{reason != null && <div className="t98-cost-reason">{reason}</div>}</div>
    <dl className="t98-cost-context"><div><dt>Exact request scope</dt><dd>{scope}</dd></div><div><dt>Usage units / bound</dt><dd>{units}</dd></div><div><dt>Estimated price</dt><dd>{estimatedPrice ?? 'Estimate unavailable'}</dd></div><div><dt>Settled price</dt><dd>{settledPrice ?? 'Settled amount unknown'}</dd></div>{quoteExpiryLabel != null && <div><dt>Quote expiry</dt><dd>{quoteExpiryLabel}</dd></div>}{receipt != null && <div><dt>Receipt / request reference</dt><dd>{receipt}</dd></div>}</dl>
    {state === 'uncertain' && <p className="t98-cost-uncertain">The outcome or charge is unconfirmed. Reconcile the original request before another charged attempt.</p>}
    {warnings != null && <Alert className="t98-cost-warnings" title="Cost limitations" tone="warning">{warnings}</Alert>}
    {actions != null && <div className="t98-cost-actions">{actions}</div>}
  </Card>;
}
