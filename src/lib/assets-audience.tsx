'use client';

import { useId, type ReactNode } from 'react';
import { Alert, Card, cx } from './primitives.js';

export interface AssetMetadata { label: ReactNode; value: ReactNode }
export interface AssetDetailsProps {
  assetId: string;
  name: ReactNode;
  kind: ReactNode;
  preview?: ReactNode;
  metadata: readonly AssetMetadata[];
  source: ReactNode;
  original?: ReactNode;
  delivery?: ReactNode;
  approvalStatus?: ReactNode;
  deliveryStatus?: ReactNode;
  deliveryExpiry?: ReactNode;
  processing?: boolean;
  readOnlyReason?: ReactNode;
  issue?: ReactNode;
  error?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Presentation only. The app supplies original/delivery evidence, approval and permitted actions. */
export function AssetDetails({ assetId, name, kind, preview, metadata, source, original, delivery, approvalStatus,
  deliveryStatus, deliveryExpiry, processing = false, readOnlyReason, issue, error, actions, className }: AssetDetailsProps) {
  const id = useId();
  return <Card className={cx('t98-asset-details', className)} title={<span id={id}>{name}</span>}
    role="region" aria-labelledby={id} aria-busy={processing || undefined}>
    {processing && <p className="t98-asset-pending" role="status">Media processing is pending. Delivery readiness is unverified.</p>}
    {preview != null && <div className="t98-asset-preview" role="group" aria-label="Asset preview">{preview}</div>}
    <dl className="t98-asset-identity">
      <div><dt>Asset ID</dt><dd>{assetId}</dd></div>
      <div><dt>Kind</dt><dd>{kind}</dd></div>
      <div><dt>Source / provenance</dt><dd>{source}</dd></div>
      <div><dt>Original</dt><dd>{original ?? 'Original reference unavailable'}</dd></div>
      <div><dt>Delivery file</dt><dd>{delivery ?? 'Delivery reference unavailable'}</dd></div>
      <div><dt>Approval</dt><dd>{approvalStatus ?? 'Approval status unknown'}</dd></div>
      <div><dt>Delivery status</dt><dd>{deliveryStatus ?? 'Delivery status unknown'}</dd></div>
      <div><dt>Delivery expiry</dt><dd>{deliveryExpiry ?? 'Delivery expiry unverified'}</dd></div>
    </dl>
    {metadata.length > 0 && <dl className="t98-asset-metadata" aria-label="Asset metadata">
      {metadata.map((item, index) => <div key={index}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
    </dl>}
    {readOnlyReason != null && <Alert className="t98-asset-read-only" title="Read-only asset">{readOnlyReason}</Alert>}
    {issue != null && <Alert className="t98-asset-issue" tone="warning" title="Asset needs attention">{issue}</Alert>}
    {error != null && <Alert className="t98-asset-error" tone="danger" title="Asset error">{error}</Alert>}
    {actions != null && <div className="t98-asset-actions">{actions}</div>}
  </Card>;
}

export type AudienceCount = string | number | null;
export interface AudienceCounts { total: AudienceCount; eligible: AudienceCount; excluded: AudienceCount; unverified: AudienceCount }
export interface AudienceExclusion { reason: ReactNode; count: AudienceCount }
export interface AudienceSummaryProps {
  title?: ReactNode;
  scope: ReactNode;
  channel: ReactNode;
  purpose: ReactNode;
  counts: AudienceCounts;
  exclusions?: readonly AudienceExclusion[];
  sample?: ReactNode;
  importResult?: ReactNode;
  pending?: boolean;
  stale?: boolean;
  staleReason?: ReactNode;
  readOnlyReason?: ReactNode;
  error?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** App-resolved counts only; no identity matching, consent, suppression, segmentation or send logic. */
export function AudienceSummary({ title = 'Audience summary', scope, channel, purpose, counts, exclusions = [], sample,
  importResult, pending = false, stale = false, staleReason, readOnlyReason, error, actions, className }: AudienceSummaryProps) {
  const id = useId();
  return <Card className={cx('t98-audience-summary', className)} title={<span id={id}>{title}</span>}
    role="region" aria-labelledby={id} aria-busy={pending || undefined}>
    <dl className="t98-audience-context"><div><dt>Scope</dt><dd>{scope}</dd></div><div><dt>Channel</dt><dd>{channel}</dd></div><div><dt>Purpose</dt><dd>{purpose}</dd></div></dl>
    {pending && <p className="t98-audience-pending" role="status">Audience preview pending. Eligibility is not confirmed for sending.</p>}
    {stale && <Alert className="t98-audience-stale" tone="warning" title="Audience preview is stale">{staleReason ?? 'Refresh the app-owned preview before reviewing a send.'}</Alert>}
    {error != null && <Alert className="t98-audience-error" tone="danger" title="Audience preview error">{error}</Alert>}
    <dl className="t98-audience-counts">
      <div><dt>Total</dt><dd>{counts.total ?? 'Unavailable'}</dd></div>
      <div><dt>Eligible</dt><dd>{counts.eligible ?? 'Unavailable'}</dd></div>
      <div><dt>Excluded</dt><dd>{counts.excluded ?? 'Unavailable'}</dd></div>
      <div><dt>Unverified</dt><dd>{counts.unverified ?? 'Unavailable'}</dd></div>
    </dl>
    {exclusions.length > 0 && <section className="t98-audience-exclusions" aria-labelledby={`${id}-exclusions`}>
      <h4 id={`${id}-exclusions`}>Exclusion reasons</h4><dl>{exclusions.map((item, index) => <div key={index}><dt>{item.reason}</dt><dd>{item.count ?? 'Unavailable'}</dd></div>)}</dl>
    </section>}
    {sample != null && <section className="t98-audience-sample" aria-labelledby={`${id}-sample`}><h4 id={`${id}-sample`}>Audience sample</h4>{sample}</section>}
    {importResult != null && <section className="t98-audience-import" aria-labelledby={`${id}-import`}><h4 id={`${id}-import`}>Import result</h4>{importResult}</section>}
    {readOnlyReason != null && <Alert className="t98-audience-read-only" title="Read-only audience">{readOnlyReason}</Alert>}
    {actions != null && <div className="t98-audience-actions">{actions}</div>}
  </Card>;
}
