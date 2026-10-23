'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Alert, Button, cx } from './primitives.js';
import { LoadMore } from './controls.js';

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
  /** Level of the workspace heading; the pane headings use the next level. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5;
  className?: string;
}

/** Both slots stay mounted. Recover hidden focus to a pane heading; app guards, routes and drafts remain app-owned. */
export function DetailWorkspace({ label, listLabel, detailLabel, list, detail, selected, onBack, backLabel = 'Back to list', emptyMessage = 'Select an item to see its details.', headingLevel = 3, className }: DetailWorkspaceProps) {
  const Title = `h${headingLevel}` as const;
  const Pane = `h${headingLevel + 1}` as 'h3' | 'h4' | 'h5' | 'h6';
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
    <Title id={`${id}-title`} className="t98-detail-title">{label}</Title>
    <div className="t98-detail-panes">
      <section className="t98-detail-list-pane" aria-labelledby={`${id}-list`}><Pane id={`${id}-list`} className="t98-detail-pane-title" tabIndex={-1}>{listLabel}</Pane>{list}</section>
      <section className="t98-detail-detail-pane" aria-labelledby={`${id}-detail`}>
        <div className="t98-detail-header">{selected && <Button className="t98-detail-back" variant="secondary" onClick={onBack}>{backLabel}</Button>}<Pane id={`${id}-detail`} className="t98-detail-pane-title" tabIndex={-1}>{detailLabel}</Pane></div>
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
  /** Inbound from a contact or outbound from the team. Shown as text; outbound messages sit towards the end on wide screens. */
  direction?: 'inbound' | 'outbound';
  /** Per-message controls such as Reply, Hide or Delete. The app owns their behaviour and any confirmation. */
  actions?: ReactNode;
  /** Deleted, hidden or moderated. Content and attachments are withheld; `removedReason` says why. */
  removed?: boolean;
  removedReason?: ReactNode;
  /** Replies to this message, for example comment replies; nested up to three levels deep, deeper replies stay at the third level. */
  replies?: readonly ConversationMessage[];
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
  /** Older messages exist before the first one shown. */
  hasOlder?: boolean;
  onLoadOlder?: () => void;
  /** Older messages are loading; the control keeps focus. */
  olderLoading?: boolean;
  /** Older messages exist but cannot be loaded, for example the provider returned no cursor. */
  olderUnavailableReason?: ReactNode;
  /** Level of the thread heading. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

const visibilityLabels = { public: 'Public reply', private: 'Private message', note: 'Internal note' } as const;
const directionLabels = { inbound: 'Received', outbound: 'Sent' } as const;

/** History presentation only. App owns composer drafts, send windows, receipts and assignments. */
const MAX_DEPTH = 3;
function MessageItem({ message, depth }: { message: ConversationMessage; depth: number }) {
  return <li className="t98-conversation-message" data-message-id={message.id} data-visibility={message.visibility} data-direction={message.direction} data-removed={message.removed || undefined} data-depth={depth > 0 ? depth : undefined}>
    <div className="t98-conversation-header"><strong className="t98-conversation-author">{message.author}</strong><time className="t98-conversation-time" dateTime={message.dateTime}>{message.time}</time>{message.direction && <span className="t98-conversation-direction">{directionLabels[message.direction]}</span>}<span className="t98-conversation-visibility">{visibilityLabels[message.visibility]}</span></div>
    {message.removed ? <div className="t98-conversation-content t98-conversation-removed"><p className="t98-conversation-removed-label">Message removed.</p>{message.removedReason != null && <div className="t98-conversation-removed-reason">{message.removedReason}</div>}</div>
      : <div className="t98-conversation-content">{message.content}</div>}
    {!message.removed && message.attachments != null && <div className="t98-conversation-attachments">{message.attachments}</div>}
    {message.status != null && <div className="t98-conversation-status">{message.status}</div>}
    {message.actions != null && <div className="t98-conversation-actions" role="group" aria-label={`Actions for the message from ${message.author}, ${message.time}`}>{message.actions}</div>}
    {message.replies && message.replies.length > 0 && <ol className="t98-conversation-replies" aria-label={`${message.replies.length} ${message.replies.length === 1 ? 'reply' : 'replies'} to ${message.author}`} data-flat={depth + 1 >= MAX_DEPTH || undefined}>
      {message.replies.map(reply => <MessageItem key={reply.id} message={reply} depth={Math.min(depth + 1, MAX_DEPTH)} />)}
    </ol>}
  </li>;
}

export function ConversationThread({ label, messages, composer, status, loading = false, readOnly = false, error, emptyMessage = 'No messages in this conversation.', className, hasOlder = false, onLoadOlder, olderLoading = false, olderUnavailableReason, headingLevel = 3 }: ConversationThreadProps) {
  const id = useId();
  const Title = `h${headingLevel}` as const;
  return <section className={cx('t98-conversation-root', className)} aria-labelledby={`${id}-title`} aria-busy={loading || undefined}>
    <Title id={`${id}-title`} className="t98-conversation-title">{label}</Title>
    {loading && <p className="t98-conversation-loading" role="status">Loading conversation. Previously supplied messages remain visible.</p>}
    {status != null && <div className="t98-conversation-status">{status}</div>}
    {error && <Alert title="Conversation needs attention" tone="danger">{error}</Alert>}
    {onLoadOlder && messages.length > 0 && <div className="t98-conversation-older">
      <LoadMore hasMore={hasOlder} busy={olderLoading} onLoadMore={onLoadOlder} itemLabel="older messages" label="Load older messages" unavailableReason={olderUnavailableReason} endMessage="This is the start of the conversation." />
    </div>}
    {messages.length ? <ol className="t98-conversation-messages">{messages.map(message => <MessageItem key={message.id} message={message} depth={0} />)}</ol> : !loading && <div className="t98-conversation-empty">{emptyMessage}</div>}
    {readOnly && <p className="t98-conversation-readonly">Read only. Replies are unavailable.</p>}
    {composer != null && <div className="t98-conversation-composer" hidden={readOnly}>{composer}</div>}
  </section>;
}

export interface SelectableListItem {
  id: string;
  /** Primary line, for example a contact or conversation name. */
  title: ReactNode;
  /** Secondary line, for example the latest message; clipped to two lines. */
  preview?: ReactNode;
  /** Trailing detail such as a time. */
  meta?: ReactNode;
  /** Leading visual such as an Avatar or a status dot; it should not carry meaning alone. */
  leading?: ReactNode;
  /** Unread count; 0 or undefined means read. Shown as a badge and stated in text. */
  unread?: number;
  /** A short status after the title, for example "Assigned to you". */
  status?: ReactNode;
  disabled?: boolean;
}
export interface SelectableListProps {
  label: string;
  items: readonly SelectableListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  emptyMessage?: ReactNode;
  /** Rendered after the list, for example LoadMore. */
  footer?: ReactNode;
  className?: string;
}

/**
 * The list side of DetailWorkspace: conversations, contacts or queue items as one listbox. Arrow keys, Home and End move
 * focus without opening anything; Enter, Space or a click selects. One roving tab stop returns to the selected item.
 * Keyboard model from the WAI-ARIA APG listbox pattern (W3C), selection not following focus.
 */
export function SelectableList({ label, items, selectedId = null, onSelect, loading = false, emptyMessage = 'Nothing to show.', footer, className }: SelectableListProps) {
  const id = useId();
  const list = useRef<HTMLUListElement>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const enabled = items.filter(item => !item.disabled);
  const stop = enabled.some(item => item.id === focused) ? focused : enabled.some(item => item.id === selectedId) ? selectedId : enabled[0]?.id ?? null;
  const focusItem = (itemId: string) => { setFocused(itemId); list.current?.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(itemId)}"]`)?.focus(); };
  function onKeyDown(event: KeyboardEvent<HTMLLIElement>, itemId: string) {
    const index = enabled.findIndex(item => item.id === itemId);
    const target = event.key === 'ArrowDown' ? enabled[index + 1] : event.key === 'ArrowUp' ? enabled[index - 1] : event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : undefined;
    if (target) { event.preventDefault(); focusItem(target.id); return; }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(itemId); }
  }
  return <section className={cx('t98-selectable', className)} aria-labelledby={`${id}-label`} aria-busy={loading || undefined}>
    <h3 className="t98-visually-hidden" id={`${id}-label`}>{label}</h3>
    {loading && <p className="t98-selectable-status" role="status">Loading…</p>}
    {items.length === 0 ? !loading && <p className="t98-selectable-empty">{emptyMessage}</p>
      : <ul className="t98-selectable-list" role="listbox" aria-label={label} ref={list}>
        {items.map(item => {
          const unread = item.unread && item.unread > 0 ? item.unread : 0;
          return <li key={item.id} role="option" data-item-id={item.id} aria-selected={item.id === selectedId} aria-disabled={item.disabled || undefined}
            tabIndex={item.id === stop ? 0 : -1} className={cx('t98-selectable-item', unread > 0 && 't98-selectable-item--unread')}
            onFocus={() => setFocused(item.id)} onClick={() => { if (!item.disabled) onSelect(item.id); }} onKeyDown={event => { if (!item.disabled || event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') onKeyDown(event, item.id); }}>
            {item.leading != null && <span className="t98-selectable-leading" aria-hidden="true">{item.leading}</span>}
            <span className="t98-selectable-body">
              <span className="t98-selectable-top"><span className="t98-selectable-title">{item.title}</span>{item.meta != null && <span className="t98-selectable-meta">{item.meta}</span>}</span>
              {(item.preview != null || item.status != null || unread > 0) && <span className="t98-selectable-bottom">
                {item.preview != null && <span className="t98-selectable-preview">{item.preview}</span>}
                {item.status != null && <span className="t98-selectable-state">{item.status}</span>}
                {unread > 0 && <span className="t98-selectable-unread"><span aria-hidden="true">{unread > 99 ? '99+' : unread}</span><span className="t98-visually-hidden">, {unread} unread</span></span>}
              </span>}
            </span>
          </li>;
        })}
      </ul>}
    {footer != null && <div className="t98-selectable-footer">{footer}</div>}
  </section>;
}

