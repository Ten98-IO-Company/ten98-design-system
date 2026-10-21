'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from './primitives.js';
import { Fieldset } from './controls.js';
import { Inline, Text, VisuallyHidden } from './structure.js';

/* Repeatable field rows. Presentation only: the items, their values and any validation stay with the caller.
 * Behaviour (not code) is ported from two sources, credited here:
 * - react-aria, GridList / ListBox reordering (Apache-2.0, https://react-spectrum.adobe.com/react-aria/): after a keyboard
 *   move the focus stays on the moved item's control and a polite live region announces the new position.
 * - W3C WAI-ARIA Authoring Practices, "Dynamic content" guidance: one persistent polite status region, and focus moved
 *   deliberately to the new or neighbouring row when a row is added or removed so it is never lost to the page. */

export interface FieldListHelpers {
  /** Zero-based position of the row. */
  index: number;
  /** Number of rows. */
  count: number;
  /** Native form name for a field of this row, such as `slots.0.time`. */
  name: (field: string) => string;
  /** A document-unique id for a field of this row, stable while the row's key is. */
  id: (field: string) => string;
}

export interface FieldListLabels {
  added: string;
  removed: string;
  moved: (position: number) => string;
  moveUp: (index: number) => string;
  moveDown: (index: number) => string;
  /** Visually hidden heading of each row. */
  itemHeading: (index: number, count: number) => string;
  minReached: (min: number) => string;
  maxReached: (max: number) => string;
}
const defaultLabels: FieldListLabels = {
  added: 'Item added',
  removed: 'Item removed',
  moved: position => `Moved to position ${position}`,
  moveUp: index => `Move item ${index + 1} up`,
  moveDown: index => `Move item ${index + 1} down`,
  itemHeading: (index, count) => `Item ${index + 1} of ${count}`,
  minReached: min => `At least ${min} ${min === 1 ? 'item is' : 'items are'} required.`,
  maxReached: max => `No more than ${max} ${max === 1 ? 'item' : 'items'} allowed.`,
};

export interface FieldListProps<T> {
  legend: ReactNode;
  description?: ReactNode;
  /** Prefix of the native field names, so a row's `time` field posts as `${name}.${index}.time`. */
  name: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number, helpers: FieldListHelpers) => ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  /** Adds Move up and Move down buttons to each row. */
  onMove?: (from: number, to: number) => void;
  addLabel: string;
  removeLabel: (index: number) => string;
  min?: number;
  max?: number;
  emptyMessage?: string;
  error?: ReactNode;
  disabled?: boolean;
  labels?: Partial<FieldListLabels>;
}

type Pending = { kind: 'add' | 'remove' | 'move'; index: number; length: number; direction?: 'up' | 'down' };
const firstField = (row: Element | null | undefined) =>
  row?.querySelector<HTMLElement>('.t98-field-list-body :is(input:not([type="hidden"]), select, textarea, [tabindex="0"]):not(:disabled)') ?? null;

/** A fieldset of repeatable rows with add, remove and optional reorder buttons, focus management and a polite status. */
export function FieldList<T>({ legend, description, name, items, getKey, renderItem, onAdd, onRemove, onMove, addLabel, removeLabel, min = 0, max, emptyMessage = 'No items yet.', error, disabled, labels: custom }: FieldListProps<T>) {
  const labels = { ...defaultLabels, ...custom };
  const base = useId();
  const list = useRef<HTMLOListElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const pending = useRef<Pending | null>(null);
  const [message, setMessage] = useState('');
  const count = items.length;
  const atMin = count <= min;
  const atMax = max !== undefined && count >= max;
  const reasonId = `${base}-reason`;
  const addReason = atMax ? labels.maxReached(max) : undefined;
  const removeReason = atMin && count > 0 && min > 0 ? labels.minReached(min) : undefined;

  // Runs once the caller has applied the change, so focus lands on the row that now exists.
  useEffect(() => {
    const action = pending.current;
    if (!action) return;
    const rows = list.current?.children;
    if (action.kind === 'add' && count === action.length + 1) {
      firstField(rows?.[count - 1])?.focus();
      announce(labels.added);
    } else if (action.kind === 'remove' && count === action.length - 1) {
      // The row that took the removed row's place, or Add when the last row went.
      (action.index < count ? firstField(rows?.[action.index]) ?? addButton.current : addButton.current)?.focus();
      announce(labels.removed);
    } else if (action.kind === 'move' && count === action.length) {
      const row = rows?.[action.index];
      const wanted = row?.querySelector<HTMLButtonElement>(`[data-move="${action.direction}"]:not(:disabled)`)
        ?? row?.querySelector<HTMLButtonElement>('[data-move]:not(:disabled)');
      wanted?.focus();
      announce(labels.moved(action.index + 1));
    } else return;
    pending.current = null;
    // Only the caller's change to `items` completes a pending action.
  }, [items]);

  // A repeated message is made distinct so assistive technology announces it again.
  function announce(text: string) { setMessage(previous => previous === text ? `${text} ` : text); }
  function request(action: Pending, run: () => void) { pending.current = action; run(); }

  return <Fieldset legend={legend} description={description} disabled={disabled} error={error}>
    {count === 0 && <Text tone="muted">{emptyMessage}</Text>}
    {count > 0 && <ol className="t98-field-list" ref={list}>
      {items.map((item, index) => {
        const key = getKey(item);
        const helpers: FieldListHelpers = { index, count, name: field => `${name}.${index}.${field}`, id: field => `${base}-${key}-${field}` };
        return <li key={key} className="t98-field-list-item">
          <VisuallyHidden as="h3">{labels.itemHeading(index, count)}</VisuallyHidden>
          <div className="t98-field-list-body">{renderItem(item, index, helpers)}</div>
          <Inline gap={2} className="t98-field-list-actions">
            {onMove && <>
              <Button variant="ghost" data-move="up" aria-label={labels.moveUp(index)} disabled={index === 0}
                onClick={() => request({ kind: 'move', index: index - 1, length: count, direction: 'up' }, () => onMove(index, index - 1))}>Move up</Button>
              <Button variant="ghost" data-move="down" aria-label={labels.moveDown(index)} disabled={index === count - 1}
                onClick={() => request({ kind: 'move', index: index + 1, length: count, direction: 'down' }, () => onMove(index, index + 1))}>Move down</Button>
            </>}
            <Button variant="ghost" disabled={atMin} aria-describedby={removeReason ? reasonId : undefined}
              onClick={() => request({ kind: 'remove', index, length: count }, () => onRemove(index))}>{removeLabel(index)}</Button>
          </Inline>
        </li>;
      })}
    </ol>}
    <div className="t98-field-list-add">
      <Button ref={addButton} variant="secondary" disabled={atMax} aria-describedby={addReason ? reasonId : undefined}
        onClick={() => request({ kind: 'add', index: count, length: count }, onAdd)}>{addLabel}</Button>
      {(addReason ?? removeReason) && <Text size="sm" tone="muted" id={reasonId}>{addReason ?? removeReason}</Text>}
    </div>
    <p className="t98-visually-hidden" role="status" aria-live="polite">{message}</p>
  </Fieldset>;
}
