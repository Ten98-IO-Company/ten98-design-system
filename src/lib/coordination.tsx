'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Alert, Button, cx } from './primitives.js';

export interface PublishingAgendaEntry {
  id: string;
  title: string;
  /** Already formatted by the app in the explicitly named display timezone. */
  when: string;
  dateTime?: string;
  status: ReactNode;
  details?: ReactNode;
  actions?: ReactNode;
}

export interface PublishingAgendaProps {
  label: string;
  scope: string;
  timezoneLabel: string;
  entries: readonly PublishingAgendaEntry[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  loading?: boolean;
  readOnly?: boolean;
  error?: ReactNode;
  emptyMessage?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** The app resolves ordering, dates, schedules and overlay duplicates before rendering. */
export function PublishingAgenda({ label, scope, timezoneLabel, entries, selectedId, onSelect, loading = false, readOnly = false, error, emptyMessage = 'No publishing items in this scope.', actions, className }: PublishingAgendaProps) {
  const id = useId();
  return <section className={cx('t98-agenda-root', className)} aria-labelledby={`${id}-title`} aria-busy={loading || undefined}>
    <div className="t98-agenda-header"><div><h3 id={`${id}-title`} className="t98-agenda-title">{label}</h3><p className="t98-agenda-scope">{scope}</p><p className="t98-agenda-timezone">Display timezone: {timezoneLabel}</p></div>{actions && <div className="t98-agenda-actions">{actions}</div>}</div>
    {loading && <p className="t98-agenda-loading" role="status">Loading publishing items. Previously supplied items remain visible.</p>}
    {readOnly && <p className="t98-agenda-readonly">Read only. Publishing changes are unavailable; records can still be inspected.</p>}
    {error && <Alert title="Publishing agenda needs attention" tone="danger">{error}</Alert>}
    {entries.length ? <ol className="t98-agenda-list">{entries.map(entry => <li key={entry.id} className="t98-agenda-item" data-entry-id={entry.id} data-selected={selectedId === entry.id ? 'true' : 'false'}>
      <time className="t98-agenda-when" dateTime={entry.dateTime}>{entry.when}</time>
      <div className="t98-agenda-content">
        {onSelect ? <Button className="t98-agenda-item-title" variant="ghost" aria-pressed={selectedId === entry.id} onClick={() => onSelect(entry.id)}>{entry.title}</Button> : <h4 className="t98-agenda-item-title">{entry.title}</h4>}
        <div className="t98-agenda-status">{entry.status}</div>
        {entry.details != null && <div className="t98-agenda-details">{entry.details}</div>}
        {entry.actions != null && <div className="t98-agenda-actions">{entry.actions}</div>}
      </div>
    </li>)}</ol> : !loading && <div className="t98-agenda-empty">{emptyMessage}</div>}
  </section>;
}

export interface DetailWorkspaceProps {
  label: string;
  listLabel: string;
  detailLabel: string;
  list: ReactNode;
  detail: ReactNode;
  selected: boolean;
  /** App guards unsaved work, updates selection and restores its originating list control. */
  onBack: () => void;
  backLabel?: string;
  emptyMessage?: ReactNode;
  className?: string;
}

/** Both slots stay mounted. Recover hidden focus to a pane heading; app guards, routes and drafts remain app-owned. */
export function DetailWorkspace({ label, listLabel, detailLabel, list, detail, selected, onBack, backLabel = 'Back to list', emptyMessage = 'Select an item to see its details.', className }: DetailWorkspaceProps) {
  const id = useId();
  const previousSelected = useRef(selected);
  const lastFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (previousSelected.current === selected) return;
    previousSelected.current = selected;
    const focused = lastFocus.current;
    if (!focused || focused.getClientRects().length) return;
    const document = focused.ownerDocument;
    const active = document.activeElement;
    if (active && active !== document.body && active !== document.documentElement && active.getClientRects().length) return;
    document.getElementById(`${id}-${selected ? 'detail' : 'list'}`)?.focus();
  }, [id, selected]);
  return <section className={cx('t98-detail-root', className)} aria-labelledby={`${id}-title`} data-selected={selected ? 'true' : 'false'}
    onFocusCapture={event => { lastFocus.current = event.target; }}
    onBlurCapture={event => { if (event.target.getClientRects().length && !event.currentTarget.contains(event.relatedTarget)) lastFocus.current = null; }}>
    <h3 id={`${id}-title`} className="t98-detail-title">{label}</h3>
    <div className="t98-detail-panes">
      <section className="t98-detail-list-pane" aria-labelledby={`${id}-list`}><h4 id={`${id}-list`} className="t98-detail-pane-title" tabIndex={-1}>{listLabel}</h4>{list}</section>
      <section className="t98-detail-detail-pane" aria-labelledby={`${id}-detail`}>
        <div className="t98-detail-header">{selected && <Button className="t98-detail-back" variant="secondary" onClick={onBack}>{backLabel}</Button>}<h4 id={`${id}-detail`} className="t98-detail-pane-title" tabIndex={-1}>{detailLabel}</h4></div>
        <div className="t98-detail-selected-content" hidden={!selected}>{detail}</div>
        {!selected && <div className="t98-detail-empty">{emptyMessage}</div>}
      </section>
    </div>
  </section>;
}

export interface ConversationMessage {
  id: string;
  author: string;
  time: string;
  dateTime?: string;
  visibility: 'public' | 'private' | 'note';
  content: ReactNode;
  attachments?: ReactNode;
  status?: ReactNode;
}

export interface ConversationThreadProps {
  label: string;
  messages: readonly ConversationMessage[];
  composer?: ReactNode;
  status?: ReactNode;
  loading?: boolean;
  readOnly?: boolean;
  error?: ReactNode;
  emptyMessage?: ReactNode;
  className?: string;
}

const visibilityLabels = { public: 'Public reply', private: 'Private message', note: 'Internal note' } as const;

/** History presentation only. App owns composer drafts, send windows, receipts and assignments. */
export function ConversationThread({ label, messages, composer, status, loading = false, readOnly = false, error, emptyMessage = 'No messages in this conversation.', className }: ConversationThreadProps) {
  const id = useId();
  return <section className={cx('t98-conversation-root', className)} aria-labelledby={`${id}-title`} aria-busy={loading || undefined}>
    <h3 id={`${id}-title`} className="t98-conversation-title">{label}</h3>
    {loading && <p className="t98-conversation-loading" role="status">Loading conversation. Previously supplied messages remain visible.</p>}
    {status != null && <div className="t98-conversation-status">{status}</div>}
    {error && <Alert title="Conversation needs attention" tone="danger">{error}</Alert>}
    {messages.length ? <ol className="t98-conversation-messages">{messages.map(message => <li className="t98-conversation-message" key={message.id} data-message-id={message.id} data-visibility={message.visibility}>
      <div className="t98-conversation-header"><strong className="t98-conversation-author">{message.author}</strong><time className="t98-conversation-time" dateTime={message.dateTime}>{message.time}</time><span className="t98-conversation-visibility">{visibilityLabels[message.visibility]}</span></div>
      <div className="t98-conversation-content">{message.content}</div>
      {message.attachments != null && <div className="t98-conversation-attachments">{message.attachments}</div>}
      {message.status != null && <div className="t98-conversation-status">{message.status}</div>}
    </li>)}</ol> : !loading && <div className="t98-conversation-empty">{emptyMessage}</div>}
    {readOnly && <p className="t98-conversation-readonly">Read only. Replies are unavailable.</p>}
    {composer != null && <div className="t98-conversation-composer" hidden={readOnly}>{composer}</div>}
  </section>;
}
