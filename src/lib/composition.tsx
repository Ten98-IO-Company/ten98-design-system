'use client';

import { useId, useState, type ReactNode } from 'react';
import { Alert, Avatar, Badge, Button, Checkbox, Field, Input, Textarea, cx } from './primitives.js';
import { MediaPlayer } from './controls.js';
import { Image } from './structure.js';
import { formatDuration, formatFileSize } from './format.js';
import { contentPolicyMeta, prefixDocument } from './sandbox.js';

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
  /** Media URL. With `type`, the strip previews it when `preview` is not supplied. */
  url?: string;
  /** MIME type, such as image/jpeg or video/mp4. */
  type?: string;
  /** Pixel dimensions, shown as width × height. */
  width?: number;
  height?: number;
  /** Length in seconds for audio and video. */
  duration?: number;
  /** Size in bytes. */
  size?: number;
}

const positive = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value) && value > 0;
/** Facts known about the media; missing or invalid values are left out rather than shown as 0. */
function mediaFacts(item: MediaItem) {
  return [
    positive(item.width) && positive(item.height) ? `${Math.round(item.width)} × ${Math.round(item.height)} px` : '',
    item.duration === undefined ? '' : formatDuration(item.duration),
    item.size === undefined ? '' : formatFileSize(item.size),
  ].filter(Boolean);
}
function mediaPreview(item: MediaItem) {
  if (item.preview != null) return item.preview;
  if (!item.url || !item.type) return <span className="t98-media-placeholder">Preview unavailable</span>;
  if (item.type.startsWith('image/')) return <Image src={item.url} alt={item.altText} fit="contain" width={positive(item.width) ? item.width : undefined} height={positive(item.height) ? item.height : undefined} />;
  const kind = item.type.startsWith('video/') ? 'video' : item.type.startsWith('audio/') ? 'audio' : null;
  if (!kind) return <span className="t98-media-placeholder">Preview unavailable</span>;
  return <MediaPlayer kind={kind} label={`Preview of ${item.name}`} src={item.url} type={item.type} width={positive(item.width) ? item.width : undefined} height={positive(item.height) ? item.height : undefined} />;
}

export interface MediaStripProps {
  label: string;
  /** Longest alt text a destination accepts; the field stops at it and shows a counter. */
  altMaxLength?: number;
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
export function MediaStrip({ label, altMaxLength, items, onItemsChange, onFilesSelect, accept, pending = false, readOnly = false, error, emptyMessage = 'No media attached.', className }: MediaStripProps) {
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
      <div className="t98-media-preview">{mediaPreview(item)}</div>
      <div className="t98-media-details">
        <p className="t98-media-name">{item.name}</p>
        {mediaFacts(item).length > 0 && <p className="t98-media-facts">{mediaFacts(item).join(' · ')}</p>}
        <Badge tone={item.status === 'ready' ? 'success' : item.status === 'error' ? 'danger' : item.status === 'unverified' ? 'neutral' : 'info'}>{item.statusLabel ?? (item.status === 'ready' ? 'Ready' : item.status === 'error' ? 'Failed' : item.status === 'unverified' ? 'Metadata unverified' : 'Processing')}</Badge>
        {item.error && <p className="t98-media-error" role="alert">{item.error}</p>}
        <Field htmlFor={`${id}-alt-${encodeURIComponent(item.id)}`} label={`Alt text for ${item.name}`} count={altMaxLength ? { value: item.altText, max: altMaxLength } : undefined}>
          <Textarea rows={2} value={item.altText} readOnly={readOnly} disabled={pending} maxLength={altMaxLength} onChange={event => {
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

export interface SandboxedPreviewProps {
  /** Visible heading and the frame's accessible name, for example "Email preview: Spring sale". */
  title: string;
  /** Untrusted HTML document or fragment, such as a rendered email. */
  html?: string;
  /** Allows https images. Off by default, so opening a preview cannot fire tracking pixels or read receipts. */
  allowRemoteImages?: boolean;
  /** Frame width: 375px for mobile or 600px for desktop email. Wider than the space available, the frame scrolls sideways. */
  viewport?: 'mobile' | 'desktop';
  /** Frame height: 20, 32 or 48rem. The document scrolls inside the frame. */
  height?: 'sm' | 'md' | 'lg';
  /** Context shown above the frame, such as the subject, sender or an approximation notice. */
  notice?: ReactNode;
  /** Shown instead of the frame when there is nothing to preview or it is not authorized. */
  unavailable?: ReactNode;
  className?: string;
}

/** Scripts, forms and plugins never run; only inline styles and data images load (plus https images when allowed). */
const previewPolicy = (remoteImages: boolean) => `default-src 'none'; style-src 'unsafe-inline' data:; img-src data:${remoteImages ? ' https:' : ''}; font-src data:; form-action 'none'; base-uri 'none'`;

/** Renders untrusted HTML, such as an email, in a frame with every sandbox restriction and a content policy that blocks
 * scripts and network loads. Links cannot navigate: they target a new window, which the sandbox does not allow. */
export function SandboxedPreview({ title, html, allowRemoteImages = false, viewport = 'desktop', height = 'md', notice, unavailable, className }: SandboxedPreviewProps) {
  const id = useId();
  const prefix = `${contentPolicyMeta(previewPolicy(allowRemoteImages))}<base target="_blank"><meta name="color-scheme" content="light">`;
  return <section className={cx('t98-sandboxed-preview', className)} aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`} className="t98-sandboxed-preview-title">{title}</h3>
    {notice != null && <div className="t98-sandboxed-preview-notice">{notice}</div>}
    {unavailable != null || !html ? <p className="t98-sandboxed-preview-empty">{unavailable ?? 'Nothing to preview.'}</p>
      : <div className="t98-sandboxed-preview-scroll" role="region" aria-label={`${title}, scrollable`} tabIndex={0}>
        <iframe className={cx('t98-sandboxed-preview-frame', `t98-sandboxed-preview-frame--${viewport}`, `t98-sandboxed-preview-frame--${height}`)}
          title={title} sandbox="" referrerPolicy="no-referrer" srcDoc={prefixDocument(html, prefix)} />
      </div>}
  </section>;
}

export interface ContentPreviewProps {
  label: string;
  destination: string;
  provider: string;
  text?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  /** Neutral layout that approximates where the content appears: a plain card, a feed post, a 9:16 story or a direct message.
   * No platform logos, colours or trademarks are drawn. */
  chrome?: 'card' | 'post' | 'story' | 'message';
  /** Width of the previewed device: `mobile` (375px) or `desktop` (600px). Omit to fill the space. */
  device?: 'mobile' | 'desktop';
  /** Later posts of a thread, shown after the first one and numbered as a sequence. */
  thread?: readonly { id: string; text?: ReactNode; media?: ReactNode }[];
  /** Characters of a plain-text caption shown before "Show full caption", as feeds truncate long captions. */
  captionLimit?: number;
  /** A poll attached to the post. */
  poll?: { question?: ReactNode; options: readonly string[]; duration?: ReactNode };
  /** The first comment posted with the content. */
  firstComment?: ReactNode;
  pending?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}

/** A plain-text caption cut at a limit, with a toggle that names what it does and states its state. */
function Caption({ text, limit }: { text: string; limit: number }) {
  const [expanded, setExpanded] = useState(false);
  const chars = [...text];
  if (chars.length <= limit) return <>{text}</>;
  return <>{expanded ? text : `${chars.slice(0, limit).join('').trimEnd()}…`}{' '}
    <button type="button" className="t98-content-preview-more" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Show less' : 'Show full caption'}</button></>;
}

/** Approximate presentation only; no provider rules, remote fetching or send behavior. */
export function ContentPreview({ label, destination, provider, text, media, footer, chrome = 'card', device, thread, captionLimit, poll, firstComment, pending = false, error, emptyMessage = 'No content supplied for this destination.', className }: ContentPreviewProps) {
  const id = useId();
  const empty = text == null && media == null;
  const identity = chrome === 'card' ? <div className="t98-content-preview-identity"><strong>{destination}</strong><span>{provider}</span></div>
    : <div className="t98-content-preview-identity"><Avatar name={destination} size="sm" /><span className="t98-content-preview-who"><strong>{destination}</strong><span>{provider}</span></span></div>;
  const body = <>
    {empty && <p className="t98-content-preview-empty">{emptyMessage}</p>}
    {/* A story shows the media first with the text over its lower edge; every other layout reads text, then media. */}
    {chrome === 'story' && media != null && <div className="t98-content-preview-media">{media}</div>}
    {text != null && <div className="t98-content-preview-text">{typeof text === 'string' && captionLimit !== undefined && captionLimit > 0 ? <Caption text={text} limit={captionLimit} /> : text}</div>}
    {chrome !== 'story' && media != null && <div className="t98-content-preview-media">{media}</div>}
    {poll && poll.options.length > 0 && <div className="t98-content-preview-poll">
      {poll.question != null && <p className="t98-content-preview-poll-question">{poll.question}</p>}
      <ul className="t98-content-preview-poll-options" aria-label="Poll options">{poll.options.map(option => <li key={option}>{option}</li>)}</ul>
      {poll.duration != null && <p className="t98-content-preview-poll-duration">{poll.duration}</p>}
    </div>}
    {thread && thread.length > 0 && <ol className="t98-content-preview-thread" aria-label={`Thread, ${thread.length + 1} posts`}>
      {thread.map((entry, index) => <li key={entry.id} className="t98-content-preview-thread-item">
        <span className="t98-content-preview-thread-index">{index + 2} / {thread.length + 1}</span>
        {entry.text != null && <div className="t98-content-preview-text">{entry.text}</div>}
        {entry.media != null && <div className="t98-content-preview-media">{entry.media}</div>}
      </li>)}
    </ol>}
    {firstComment != null && <div className="t98-content-preview-comment"><p className="t98-content-preview-comment-label">First comment</p><div className="t98-content-preview-text">{firstComment}</div></div>}
    {footer != null && <div className="t98-content-preview-footer">{footer}</div>}
  </>;
  return <section className={cx('t98-content-preview-frame', `t98-content-preview-frame--${chrome}`, device && `t98-content-preview-frame--${device}`, className)} aria-labelledby={`${id}-label`} aria-describedby={`${id}-notice`} aria-busy={pending || undefined}>
    <h3 id={`${id}-label`} className="t98-content-preview-label">{label}</h3>
    <p id={`${id}-notice`} className="t98-content-preview-notice">Approximate preview. Final delivery may look different.</p>
    {pending && <p className="t98-content-preview-status" role="status">Preview update pending. Previously supplied content is retained.</p>}
    {error && <Alert title="Preview needs attention" tone="danger">{error}</Alert>}
    {chrome === 'card' ? <>{identity}{body}</> : <div className="t98-content-preview-surface">{identity}{chrome === 'message' ? <div className="t98-content-preview-bubble">{body}</div> : body}</div>}
  </section>;
}
