'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button, Icon, cx } from './primitives.js';
import { Disclosure } from './controls.js';

export type SuggestionQueueState = 'suggested' | 'accepted' | 'dismissed';
export interface SuggestionQueueItem {
  /** Stable identity, unique within its group. */
  id: string;
  /** Current display text, retained when editor slots are suppressed in read-only mode. */
  label: string;
  state: SuggestionQueueState;
  description?: ReactNode;
  provenance?: ReactNode;
  /** App-owned labelled editor; rendered only while editable. The app owns its draft and validation. */
  editor?: ReactNode;
  edited?: boolean;
}
export interface SuggestionQueueGroup {
  /** Stable identity, unique within the queue. */
  id: string;
  label: string;
  items: readonly SuggestionQueueItem[];
  provenance?: ReactNode;
}
export interface SuggestionQueueChange {
  groupId: string;
  itemIds: readonly string[];
  state: SuggestionQueueState;
}
export interface SuggestionQueueProps {
  label: string;
  groups: readonly SuggestionQueueGroup[];
  /** One batch request: Accept all targets suggested items, Dismiss all targets non-dismissed items, Restore requests suggested. Omission makes the queue read-only. */
  onStateChange?: (change: SuggestionQueueChange) => void;
  readOnly?: boolean;
  readOnlyReason?: ReactNode;
  emptyMessage?: ReactNode;
  className?: string;
}

type QueueAction = 'accept' | 'dismiss' | 'restore' | 'accept-all' | 'dismiss-all';
interface PendingFocus {
  groupId: string;
  itemIds: readonly string[];
  before: string;
  action: QueueAction;
  activeOrder: readonly string[];
  trigger: HTMLElement;
}

/** Controlled review only: the app owns edits, persistence, authorization and provider requests. */
export function SuggestionQueue({ label, groups, onStateChange, readOnly = false, readOnlyReason, emptyMessage = 'No suggestions.', className }: SuggestionQueueProps) {
  const uid = useId();
  const root = useRef<HTMLElement>(null);
  const groupNodes = useRef(new Map<string, HTMLElement>());
  const pending = useRef<PendingFocus | null>(null);
  const editable = !readOnly && onStateChange !== undefined;
  const all = groups.flatMap(group => group.items);
  const accepted = all.filter(item => item.state === 'accepted').length;
  const suggested = all.filter(item => item.state === 'suggested').length;
  const dismissed = all.length - accepted - suggested;
  // Editor rerenders must not be mistaken for an app-applied decision change.
  const fingerprint = JSON.stringify(groups.map(group => [group.id, group.items.map(item => [item.id, item.state])]));

  useEffect(() => {
    const request = pending.current;
    if (!request) return;
    const group = groups.find(group => group.id === request.groupId);
    const states = new Map(group?.items.map(item => [item.id, item.state]));
    if (JSON.stringify(request.itemIds.map(id => states.get(id) ?? null)) === request.before) return;
    pending.current = null;
    // Only repair focus lost by the controlled update; a caller's chosen focus wins.
    const active = document.activeElement;
    if (active && active !== document.body && active !== request.trigger) return;
    if (request.trigger.isConnected && request.trigger.getClientRects().length > 0) return;
    const node = groupNodes.current.get(request.groupId);
    const rows = node ? [...node.querySelectorAll<HTMLElement>(':scope > [data-queue-active] > [data-suggestion-id]')] : [];
    const row = (id: string) => rows.find(row => row.dataset.suggestionId === id);
    let target: HTMLElement | null | undefined;
    if (request.action === 'accept' || request.action === 'restore') {
      target = row(request.itemIds[0])?.querySelector<HTMLElement>(`[data-queue-action="${request.action === 'accept' ? 'dismiss' : 'accept'}"]`);
    } else if (request.action === 'dismiss') {
      const index = request.activeOrder.indexOf(request.itemIds[0]);
      const nearby = [...request.activeOrder.slice(index + 1), ...request.activeOrder.slice(0, index).reverse()];
      target = nearby.map(id => row(id)?.querySelector<HTMLElement>('[data-queue-action]')).find(Boolean);
    } else if (request.action === 'accept-all') {
      target = node?.querySelector<HTMLElement>(':scope > header [data-queue-bulk="dismiss"]');
    }
    (target ?? node?.querySelector<HTMLElement>(':scope > [data-queue-dismissed] summary') ?? node?.querySelector<HTMLElement>(':scope > header h3') ?? root.current?.querySelector<HTMLElement>(':scope > header h2'))?.focus();
  }, [fingerprint, editable]);

  function change(group: SuggestionQueueGroup, itemIds: readonly string[], state: SuggestionQueueState, action: QueueAction, trigger: HTMLElement) {
    if (!editable || !itemIds.length) return;
    const states = new Map(group.items.map(item => [item.id, item.state]));
    pending.current = document.activeElement === trigger ? {
      groupId: group.id, itemIds, action, trigger,
      before: JSON.stringify(itemIds.map(id => states.get(id) ?? null)),
      activeOrder: group.items.filter(item => item.state !== 'dismissed').map(item => item.id),
    } : null;
    onStateChange?.({ groupId: group.id, itemIds, state });
  }

  function renderItem(group: SuggestionQueueGroup, item: SuggestionQueueItem) {
    return <li key={item.id} aria-label={item.label} data-suggestion-id={item.id} data-state={item.state} className="t98-suggestion-queue-item">
      <div className="t98-suggestion-queue-body">
        <strong className="t98-suggestion-queue-label">{item.label}</strong>
        <span className="t98-suggestion-queue-state"><Icon name={item.state === 'accepted' ? 'check' : item.state === 'dismissed' ? 'x' : 'plus'} size={14} />{item.state === 'accepted' ? 'Accepted' : item.state === 'dismissed' ? 'Dismissed' : 'Suggested'}</span>
        {item.edited && <span className="t98-suggestion-queue-edited">Edited</span>}
        {item.description != null && <div className="t98-suggestion-queue-description">{item.description}</div>}
        {item.provenance != null && <div className="t98-suggestion-queue-provenance">{item.provenance}</div>}
      </div>
      {editable && <div className="t98-suggestion-queue-actions">
        {item.state === 'suggested' && <Button type="button" variant="secondary" aria-label={`Accept ${item.label}`} data-queue-action="accept" onClick={event => change(group, [item.id], 'accepted', 'accept', event.currentTarget)}>Accept</Button>}
        {item.state !== 'dismissed' ? <Button type="button" variant="ghost" aria-label={`Dismiss ${item.label}`} data-queue-action="dismiss" onClick={event => change(group, [item.id], 'dismissed', 'dismiss', event.currentTarget)}>Dismiss</Button>
          : <Button type="button" variant="secondary" aria-label={`Restore ${item.label}`} data-queue-action="restore" onClick={event => change(group, [item.id], 'suggested', 'restore', event.currentTarget)}>Restore</Button>}
      </div>}
      {editable && item.editor != null && <div className="t98-suggestion-queue-editor">{item.editor}</div>}
    </li>;
  }

  return <section ref={root} aria-label={label} className={cx('t98-suggestion-queue', className)}>
    <header className="t98-suggestion-queue-header"><h2 tabIndex={-1} className="t98-suggestion-queue-title">{label}</h2>
      <p role="status" aria-live="polite" aria-atomic="true"><bdi>{accepted} of {all.length} accepted; {suggested} suggested; {dismissed} dismissed.</bdi></p>
      {!editable && readOnlyReason != null && <div className="t98-suggestion-queue-reason">{readOnlyReason}</div>}
    </header>
    {groups.length === 0 && <div className="t98-suggestion-queue-empty">{emptyMessage}</div>}
    {groups.map((group, index) => {
      const active = group.items.filter(item => item.state !== 'dismissed');
      const suggested = group.items.filter(item => item.state === 'suggested');
      const dismissed = group.items.filter(item => item.state === 'dismissed');
      return <section key={group.id} ref={node => { if (node) groupNodes.current.set(group.id, node); else groupNodes.current.delete(group.id); }} aria-labelledby={`${uid}-group-${index}`} className="t98-suggestion-queue-group">
        <header className="t98-suggestion-queue-header"><h3 id={`${uid}-group-${index}`} tabIndex={-1} className="t98-suggestion-queue-heading">{group.label}</h3>
          <p><bdi>{group.items.filter(item => item.state === 'accepted').length} of {group.items.length} accepted</bdi></p>
          {group.provenance != null && <div className="t98-suggestion-queue-provenance">{group.provenance}</div>}
          {editable && active.length > 0 && <div className="t98-suggestion-queue-actions">
            {suggested.length > 0 && <Button type="button" variant="secondary" aria-label={`Accept all in ${group.label}`} onClick={event => change(group, suggested.map(item => item.id), 'accepted', 'accept-all', event.currentTarget)}>Accept all</Button>}
            <Button type="button" variant="ghost" aria-label={`Dismiss all in ${group.label}`} data-queue-bulk="dismiss" onClick={event => change(group, active.map(item => item.id), 'dismissed', 'dismiss-all', event.currentTarget)}>Dismiss all</Button>
          </div>}
        </header>
        {group.items.length === 0 && <div className="t98-suggestion-queue-empty">{emptyMessage}</div>}
        {active.length > 0 && <ul data-queue-active className="t98-suggestion-queue-items">{active.map(item => renderItem(group, item))}</ul>}
        {dismissed.length > 0 && <div data-queue-dismissed><Disclosure summary={`Dismissed (${dismissed.length})`}><ul className="t98-suggestion-queue-items">{dismissed.map(item => renderItem(group, item))}</ul></Disclosure></div>}
      </section>;
    })}
  </section>;
}
