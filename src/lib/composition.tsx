'use client';

import { useId, type ReactNode } from 'react';
import { Alert, Badge, Button, Checkbox, Field, Input, Textarea, cx } from './primitives.js';

export type DestinationAccount = {
  id: string;
  name: string;
  provider: string;
  description?: string;
} & ({ disabled?: false; disabledReason?: never } | { disabled: true; disabledReason: string });

export interface DestinationPickerProps {
  label: string;
  accounts: readonly DestinationAccount[];
  selectedIds: readonly string[];
  onSelectionChange: (ids: string[]) => void;
  description?: string;
  pending?: boolean;
  readOnly?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}

/** Select exact accounts; the app keeps their independent copies and validates eligibility. */
export function DestinationPicker({ label, accounts, selectedIds, onSelectionChange, description, pending = false, readOnly = false, error, emptyMessage = 'No destination accounts available.', className }: DestinationPickerProps) {
  const id = useId();
  const locked = pending || readOnly;
  return <fieldset className={cx('t98-destination-picker', className)} aria-busy={pending || undefined} aria-describedby={description ? `${id}-description` : undefined}>
    <legend className="t98-destination-label">{label}</legend>
    {description && <p id={`${id}-description`} className="t98-destination-description">{description}</p>}
    {pending && <p className="t98-destination-status" role="status">Destination changes pending.</p>}
    {readOnly && <p className="t98-destination-status">Read only. Destination selection cannot be changed.</p>}
    {error && <Alert title="Destination selection needs attention" tone="danger">{error}</Alert>}
    {accounts.length ? <ul className="t98-destination-list">{accounts.map((account, index) => {
      const reasonId = `${id}-reason-${index}`;
      return <li key={account.id} className="t98-destination-item" data-destination-id={account.id}>
        <Checkbox label={<><span className="t98-destination-name">{account.name}</span><span className="t98-destination-provider"> — {account.provider}</span></>}
          value={account.id} checked={selectedIds.includes(account.id)} disabled={locked || account.disabled}
          aria-describedby={account.disabled ? reasonId : undefined}
          onChange={event => {
            if (locked || account.disabled) return;
            onSelectionChange(event.target.checked ? [...new Set([...selectedIds, account.id])] : selectedIds.filter(value => value !== account.id));
          }} />
        {account.description && <p className="t98-destination-detail">{account.description}</p>}
        {account.disabled && <p id={reasonId} className="t98-destination-reason">{account.disabledReason}</p>}
      </li>;
    })}</ul> : <p className="t98-destination-empty">{emptyMessage}</p>}
  </fieldset>;
}

export interface MediaItem {
  id: string;
  name: string;
  preview?: ReactNode;
  status: 'ready' | 'pending' | 'unverified' | 'error';
  statusLabel?: string;
  error?: string;
  altText: string;
}

export interface MediaStripProps {
  label: string;
  items: readonly MediaItem[];
  onItemsChange: (items: MediaItem[]) => void;
  onFilesSelect?: (files: File[]) => void;
  accept?: string;
  pending?: boolean;
  readOnly?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}

/** Controlled draft media; the app supplies previews and owns upload, validation and rights. */
export function MediaStrip({ label, items, onItemsChange, onFilesSelect, accept, pending = false, readOnly = false, error, emptyMessage = 'No media attached.', className }: MediaStripProps) {
  const id = useId();
  const locked = pending || readOnly;
  function move(index: number, target: number) {
    if (locked || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onItemsChange(next);
  }
  return <section className={cx('t98-media-strip', className)} aria-labelledby={`${id}-label`} aria-busy={pending || undefined}>
    <h3 id={`${id}-label`} className="t98-media-label">{label}</h3>
    {readOnly && <p className="t98-media-description">Read only. Media cannot be changed.</p>}
    {pending && <p className="t98-media-description" role="status">Media changes pending.</p>}
    {error && <Alert title="Media needs attention" tone="danger">{error}</Alert>}
    {onFilesSelect && <Field htmlFor={`${id}-files`} label="Add media" description="Files are passed to the app for validation and processing."><Input type="file" multiple accept={accept} disabled={locked} onChange={event => {
      if (locked) return;
      const files = Array.from(event.currentTarget.files ?? []);
      if (files.length) onFilesSelect(files);
      event.currentTarget.value = '';
    }} /></Field>}
    {items.length ? <ol className="t98-media-list">{items.map((item, index) => <li key={item.id} className="t98-media-item" data-media-id={item.id} aria-busy={item.status === 'pending' || undefined}>
      <div className="t98-media-preview">{item.preview ?? <span className="t98-media-placeholder">Preview unavailable</span>}</div>
      <div className="t98-media-details">
        <p className="t98-media-name">{item.name}</p>
        <Badge tone={item.status === 'ready' ? 'success' : item.status === 'error' ? 'danger' : item.status === 'unverified' ? 'neutral' : 'info'}>{item.statusLabel ?? (item.status === 'ready' ? 'Ready' : item.status === 'error' ? 'Failed' : item.status === 'unverified' ? 'Metadata unverified' : 'Processing')}</Badge>
        {item.error && <p className="t98-media-error" role="alert">{item.error}</p>}
        <Field htmlFor={`${id}-alt-${encodeURIComponent(item.id)}`} label={`Alt text for ${item.name}`}>
          <Textarea rows={2} value={item.altText} readOnly={readOnly} disabled={pending} onChange={event => {
            if (!locked) onItemsChange(items.map(current => current.id === item.id ? { ...current, altText: event.target.value } : current));
          }} />
        </Field>
        <div className="t98-media-actions">
          <Button variant="secondary" disabled={locked || index === 0} aria-label={`Move earlier: ${item.name}`} onClick={() => move(index, index - 1)}>Move earlier</Button>
          <Button variant="secondary" disabled={locked || index === items.length - 1} aria-label={`Move later: ${item.name}`} onClick={() => move(index, index + 1)}>Move later</Button>
          <Button variant="ghost" disabled={locked} aria-label={`Remove: ${item.name}`} onClick={() => { if (!locked) onItemsChange(items.filter(current => current.id !== item.id)); }}>Remove</Button>
        </div>
      </div>
    </li>)}</ol> : <p className="t98-media-empty">{emptyMessage}</p>}
  </section>;
}

export interface ContentPreviewProps {
  label: string;
  destination: string;
  provider: string;
  text?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  pending?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}

/** Approximate presentation only; no provider rules, remote fetching or send behavior. */
export function ContentPreview({ label, destination, provider, text, media, footer, pending = false, error, emptyMessage = 'No content supplied for this destination.', className }: ContentPreviewProps) {
  const id = useId();
  return <section className={cx('t98-content-preview-frame', className)} aria-labelledby={`${id}-label`} aria-describedby={`${id}-notice`} aria-busy={pending || undefined}>
    <h3 id={`${id}-label`} className="t98-content-preview-label">{label}</h3>
    <p id={`${id}-notice`} className="t98-content-preview-notice">Approximate preview. Final delivery may look different.</p>
    <div className="t98-content-preview-identity"><strong>{destination}</strong><span>{provider}</span></div>
    {pending && <p className="t98-content-preview-status" role="status">Preview update pending. Previously supplied content is retained.</p>}
    {error && <Alert title="Preview needs attention" tone="danger">{error}</Alert>}
    {text == null && media == null && <p className="t98-content-preview-empty">{emptyMessage}</p>}
    {text != null && <div className="t98-content-preview-text">{text}</div>}
    {media != null && <div className="t98-content-preview-media">{media}</div>}
    {footer != null && <div className="t98-content-preview-footer">{footer}</div>}
  </section>;
}
