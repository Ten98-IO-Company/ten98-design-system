'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button, cx, type Tone } from './primitives.js';
import { addDays, toIso, toTime } from './dates.js';

/** Month grid only: the app owns schedules, creation rules and navigation. Keyboard model ported from the WAI-ARIA APG date-picker grid. */

export interface CalendarEntry {
  id: string;
  label: string;
  /** App-formatted time or range, shown before the label. */
  time?: string;
  /** App-formatted network or source, shown between the time and the label. */
  network?: string;
  /** App-supplied status (for example a scheduled/review dot), shown after the label. */
  status?: ReactNode;
  /** Tone applied to `status`. */
  tone?: Tone;
  /** Without a handler the entry is shown as plain text. */
  onSelect?: () => void;
}
export interface CalendarMonthProps {
  /** Month is 1-12. */
  month: { year: number; month: number };
  weekStartsOn: 0 | 1;
  /** Explicit BCP 47 locale so names are deterministic (dates use UTC). */
  locale: string;
  /** Local calendar date, YYYY-MM-DD, supplied by the app so the library never reads a clock. */
  today: string;
  days: ReadonlyMap<string, readonly CalendarEntry[]>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  /** Shows a Create button in each day of the month when supplied. */
  onCreateDay?: (iso: string) => void;
  /** When set, the buttons are disabled and this reason stays visible. */
  createDisabledReason?: ReactNode;
  /** Days for which Create is offered, for example `iso => iso >= today` to hide it on past days. Defaults to every day of the month. */
  isCreatable?: (iso: string) => boolean;
  className?: string;
}

const dayOfWeek = (iso: string) => new Date(toTime(iso)).getUTCDay();
const monthOf = (iso: string) => iso.slice(0, 7);
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Same day number in another month, clamped to that month's last day. */
function shiftMonth(iso: string, delta: number) {
  const date = new Date(toTime(iso));
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
  const day = Math.min(date.getUTCDate(), daysInMonth(target.getUTCFullYear(), target.getUTCMonth() + 1));
  return toIso(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), day));
}

export function CalendarMonth({ month, weekStartsOn, locale, today, days, onPrev, onNext, onToday, onCreateDay, createDisabledReason, isCreatable, className }: CalendarMonthProps) {
  const id = useId();
  const gridRef = useRef<HTMLTableElement>(null);
  const moveFocus = useRef(false);
  const [focused, setFocused] = useState<string | null>(null);

  const first = `${String(month.year).padStart(4, '0')}-${String(month.month).padStart(2, '0')}-01`;
  const validMonth = Number.isFinite(toTime(first)) && month.month >= 1 && month.month <= 12;
  const start = validMonth ? addDays(first, -((dayOfWeek(first) - weekStartsOn + 7) % 7)) : '1970-01-01';
  const cells = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const inGrid = (iso: string) => iso >= cells[0] && iso <= cells[41];
  const todayInMonth = monthOf(today) === monthOf(first);
  // Roving tab stop: the remembered day while it is in view, otherwise today or the first of the month.
  const active = focused != null && inGrid(focused) ? focused : todayInMonth ? today : first;

  const dateFormat = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
  const monthTitle = validMonth ? dateFormat({ month: 'long', year: 'numeric' }).format(toTime(first)) : 'Month unavailable';
  const fullDate = dateFormat({ dateStyle: 'full' });
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const time = toTime(addDays(start, index));
    return { short: dateFormat({ weekday: 'short' }).format(time), long: dateFormat({ weekday: 'long' }).format(time) };
  });
  const rows = Array.from({ length: 6 }, (_, row) => cells.slice(row * 7, row * 7 + 7));

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${active}"]`)?.focus();
  });

  function go(target: string) {
    moveFocus.current = true;
    setFocused(target);
    if (!inGrid(target)) (target < cells[0] ? onPrev : onNext)();
  }
  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-date]');
    const current = cell?.dataset.date;
    if (!current) return;
    const offset = (dayOfWeek(current) - weekStartsOn + 7) % 7;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const next: Record<string, string> = {
      // Day order follows the writing direction (APG): in RTL, ArrowLeft moves to the next day.
      [rtl ? 'ArrowRight' : 'ArrowLeft']: addDays(current, -1), [rtl ? 'ArrowLeft' : 'ArrowRight']: addDays(current, 1), ArrowUp: addDays(current, -7), ArrowDown: addDays(current, 7),
      Home: addDays(current, -offset), End: addDays(current, 6 - offset),
      // Month paging keeps the day number relative to the displayed month, as in the APG example.
      PageUp: shiftMonth(current, -1), PageDown: shiftMonth(current, 1),
    };
    const target = next[event.key];
    if (!target) return;
    event.preventDefault();
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      moveFocus.current = true;
      setFocused(target);
      (event.key === 'PageUp' ? onPrev : onNext)();
    } else go(target);
  }

  const creating = onCreateDay != null || createDisabledReason != null;
  return <section className={cx('t98-calendar', className)} aria-label={`${monthTitle} calendar`}>
    <div className="t98-calendar-header">
      <h3 className="t98-calendar-title" id={`${id}-title`} aria-live="polite">{monthTitle}</h3>
      <div className="t98-calendar-nav" role="group" aria-label="Calendar navigation">
        <Button className="t98-calendar-button" variant="secondary" onClick={onPrev}>Previous month</Button>
        <Button className="t98-calendar-button" variant="secondary" onClick={onToday}>Today</Button>
        <Button className="t98-calendar-button" variant="secondary" onClick={onNext}>Next month</Button>
      </div>
    </div>
    {createDisabledReason != null && <div className="t98-calendar-reason" id={`${id}-reason`}>{createDisabledReason}</div>}
    {/* A labelled, focusable region so keyboard users can scroll the month when it is wider than the screen. */}
    <div className="t98-calendar-scroll" role="region" tabIndex={0} aria-label={`${monthTitle} days`}>
      <table className="t98-calendar-grid" role="grid" aria-labelledby={`${id}-title`} ref={gridRef} onKeyDown={onKeyDown}>
        <thead><tr role="row">{weekdays.map(day => <th key={day.long} role="columnheader" scope="col" abbr={day.long} className="t98-calendar-weekday">{day.short}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr role="row" key={row[0]}>{row.map(iso => {
          const outside = monthOf(iso) !== monthOf(first);
          const isToday = iso === today;
          const isActive = iso === active;
          const entries = days.get(iso) ?? [];
          // The label replaces the cell's content in its name, so it states how many entries the day holds.
          const count = entries.length ? `, ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : '';
          const name = `${fullDate.format(toTime(iso))}${isToday ? ', today' : ''}${outside ? ', outside this month' : ''}${count}`;
          return <td key={iso} role="gridcell" data-date={iso} tabIndex={isActive ? 0 : -1} aria-label={name} aria-current={isToday ? 'date' : undefined}
            className={cx('t98-calendar-cell', outside && 't98-calendar-cell--outside', isToday && 't98-calendar-cell--today')}
            onFocus={() => setFocused(iso)}>
            <span className="t98-calendar-date" aria-hidden="true">{Number(iso.slice(8))}{isToday && <span className="t98-calendar-today-mark"> Today</span>}</span>
            {entries.length > 0 && <ul className="t98-calendar-entries">{entries.map(entry => {
              const parts = <>{entry.time && <span className="t98-calendar-entry-time">{entry.time}</span>}{entry.network && <span className="t98-calendar-entry-network">{entry.network}</span>}<span className="t98-calendar-entry-label">{entry.label}</span>{entry.status != null && <span className={`t98-calendar-entry-status t98-tone--${entry.tone ?? 'neutral'}`}>{entry.status}</span>}</>;
              return <li key={entry.id} className="t98-calendar-entry-item">
              {entry.onSelect
                ? <button type="button" className="t98-calendar-entry" tabIndex={isActive ? 0 : -1} onClick={entry.onSelect}>{parts}</button>
                : <span className="t98-calendar-entry t98-calendar-entry--static">{parts}</span>}</li>;
            })}</ul>}
            {creating && !outside && (isCreatable?.(iso) ?? true) && <button type="button" className="t98-calendar-create" tabIndex={isActive ? 0 : -1} disabled={createDisabledReason != null || !onCreateDay}
              aria-label={`Create on ${fullDate.format(toTime(iso))}`} aria-describedby={createDisabledReason != null ? `${id}-reason` : undefined} onClick={() => onCreateDay?.(iso)}>Create</button>}
          </td>;
        })}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}
