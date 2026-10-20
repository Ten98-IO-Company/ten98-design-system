'use client';

import { useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import { Badge, Button, Icon, Input, cx } from './primitives.js';
import { appShellNavigation } from './shell.js';
import { useSidebarNavigation } from './sidebar.js';

export interface DataColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** Supply a plain value for searching and sorting a custom cell. */
  sortValue?: (row: T) => string | number;
}

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc';
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const cellValue = <T,>(row: T, column: DataColumn<T>): unknown =>
  column.sortValue ? column.sortValue(row) : (row as Record<string, unknown>)[column.key];
const cellText = (value: unknown) => value == null ? '' : String(value);

/** Local table operations; leaves the source array unchanged. */
export function filterAndSortRows<T>(
  rows: readonly T[],
  columns: readonly DataColumn<T>[],
  query = '',
  sort?: TableSort,
): T[] {
  const search = query.trim().toLocaleLowerCase();
  const filtered = search
    ? rows.filter(row => columns.some(column => cellText(cellValue(row, column)).toLocaleLowerCase().includes(search)))
    : [...rows];
  const column = columns.find(item => item.key === sort?.key);
  if (!column || !sort) return filtered;
  return filtered.sort((a, b) => {
    const left = cellValue(a, column);
    const right = cellValue(b, column);
    const result = typeof left === 'number' && typeof right === 'number' && Number.isFinite(left) && Number.isFinite(right)
      ? left - right
      : collator.compare(cellText(left), cellText(right));
    return sort.direction === 'asc' ? result : -result;
  });
}

export interface DataTableProps<T> {
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  caption: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  selectable?: boolean;
  onSelectionChange?: (keys: string[]) => void;
  emptyTitle?: string;
}

export function DataTable<T>({
  columns, rows, rowKey, caption, searchable = true, searchPlaceholder = 'Search records…',
  pageSize = 5, selectable = false, onSelectionChange, emptyTitle = 'No records found',
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<TableSort>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const selectAll = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const size = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 5;
  // ponytail: local operations suit small datasets; use server pagination for large collections.
  const filtered = filterAndSortRows(rows, columns, searchable ? query : '', sort);
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * size;
  const visible = filtered.slice(offset, offset + size);
  const keys = new Set(rows.map(rowKey));
  const selectedKeys = selected.filter(key => keys.has(key));
  const selectedSet = new Set(selectedKeys);
  const visibleKeys = visible.map(rowKey);
  const selectedOnPage = visibleKeys.filter(key => selectedSet.has(key)).length;
  const allChecked = visible.length > 0 && selectedOnPage === visible.length;

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selectedOnPage > 0 && !allChecked;
  }, [selectedOnPage, allChecked]);

  useEffect(() => { setPage(current => Math.min(current, pageCount)); }, [pageCount]);

  useEffect(() => {
    const availableKeys = new Set(rows.map(rowKey));
    const next = selected.filter(key => availableKeys.has(key));
    if (next.length !== selected.length) {
      setSelected(next);
      onSelectionChange?.(next);
    }
  }, [rows, rowKey, selected, onSelectionChange]);

  function updateSelection(next: string[]) {
    setSelected(next);
    onSelectionChange?.(next);
  }

  function togglePage() {
    const next = new Set(selectedKeys);
    visibleKeys.forEach(key => allChecked ? next.delete(key) : next.add(key));
    updateSelection([...next]);
  }

  function toggleRow(key: string) {
    updateSelection(selectedSet.has(key) ? selectedKeys.filter(item => item !== key) : [...selectedKeys, key]);
  }

  return <div className="t98-data-table">
    <div className="t98-table-toolbar">
      {searchable && <div className="t98-table-search">
        <label htmlFor={searchId} className="t98-visually-hidden">Search {caption}</label>
        <Icon name="search" size={16} />
        <Input id={searchId} type="search" value={query} placeholder={searchPlaceholder}
          onChange={event => { setQuery(event.target.value); setPage(1); }} />
      </div>}
      <span className="t98-table-count" aria-live="polite">
        {selectedKeys.length > 0 && selectable ? `${selectedKeys.length} selected · ` : ''}
        {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
      </span>
    </div>
    <div className="t98-table-scroll" tabIndex={0} role="region" aria-label={`${caption} table`}>
      <table className="t98-table">
        <caption className="t98-visually-hidden">{caption}</caption>
        <thead><tr>
          {selectable && <th className="t98-table-check" scope="col">
            <label className="t98-table-checkbox-target"><input ref={selectAll} type="checkbox" checked={allChecked} disabled={visible.length === 0}
              aria-label="Select all rows on this page" onChange={togglePage} /></label>
          </th>}
          {columns.map(column => <th key={column.key} scope="col"
            aria-sort={sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
            <button type="button" className="t98-sort-button" onClick={() => {
              setSort({ key: column.key, direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' });
              setPage(1);
            }}>
              {column.header}
              <Icon name={sort?.key === column.key ? sort.direction === 'asc' ? 'arrow-up' : 'arrow-down' : 'chevrons-up-down'} size={13} />
            </button>
          </th>)}
        </tr></thead>
        <tbody>
          {visible.map((row, index) => <tr key={rowKey(row)} data-selected={selectedSet.has(rowKey(row)) || undefined}>
            {selectable && <td className="t98-table-check">
              <label className="t98-table-checkbox-target"><input type="checkbox" aria-label={`Select row ${offset + index + 1}`} checked={selectedSet.has(rowKey(row))}
                onChange={() => toggleRow(rowKey(row))} /></label>
            </td>}
            {columns.map(column => <td key={column.key}>
              {column.render ? column.render(row) : cellText(cellValue(row, column))}
            </td>)}
          </tr>)}
          {visible.length === 0 && <tr><td colSpan={Math.max(1, columns.length + (selectable ? 1 : 0))}>
            <EmptyState title={emptyTitle} description={query ? 'Try a different search or clear your search to see all records.' : 'New records will appear here.'}
              icon="search" action={query ? <Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button> : undefined} />
          </td></tr>}
        </tbody>
      </table>
    </div>
    <div className="t98-table-pagination">
      <span>{filtered.length === 0 ? '0 records' : `${offset + 1}–${Math.min(offset + size, filtered.length)} of ${filtered.length}`}</span>
      <div className="t98-pagination-controls">
        <Button variant="ghost" size="sm" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><Icon name="chevron-left" size={16} /></Button>
        <span aria-live="polite">Page {currentPage} of {pageCount}</span>
        <Button variant="ghost" size="sm" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><Icon name="chevron-right" size={16} /></Button>
      </div>
    </div>
  </div>;
}

export function Sparkline({ values, label, color = 'var(--t98-accent)' }: { values: readonly number[]; label: string; color?: string }) {
  const finite = values.filter(Number.isFinite);
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const points = finite.map((value, index) => `${finite.length === 1 ? 60 : 3 + index / (finite.length - 1) * 114},${maximum === minimum ? 20 : 36 - (value / scale - minimum / scale) / (maximum / scale - minimum / scale) * 32}`).join(' ');
  const summary = finite.length ? `${label}: ${finite.length} points, first ${finite[0]}, last ${finite.at(-1)}, minimum ${minimum}, maximum ${maximum}` : `${label}: no data`;
  return <svg className="t98-sparkline" viewBox="0 0 120 40" role="img" aria-label={summary} style={{ color }}>
    {finite.length > 1 ? <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      : finite.length === 1 ? <circle cx="60" cy="20" r="3" fill="currentColor" /> : null}
  </svg>;
}

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  chart?: readonly number[];
}

export function MetricCard({ label, value, change, trend = 'neutral', chart }: MetricCardProps) {
  return <article className="t98-metric-card">
    <p className="t98-metric-label">{label}</p>
    <div className="t98-metric-body"><strong className="t98-metric-value">{value}</strong>
      {chart && <Sparkline values={chart} label={`${label} trend`} color={trend === 'down' ? 'var(--t98-danger)' : 'var(--t98-accent)'} />}
    </div>
    {change && <p className={cx('t98-metric-change', `t98-trend-${trend}`)}>
      <Icon name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus'} size={14} />
      <span className="t98-visually-hidden">{trend === 'up' ? 'Increasing: ' : trend === 'down' ? 'Decreasing: ' : ''}</span>{change}
    </p>}
  </article>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="t98-page-header"><div>
    {eyebrow && <p className="t98-eyebrow">{eyebrow}</p>}
    <h1>{title}</h1>{description && <p className="t98-page-description">{description}</p>}
  </div>{actions && <div className="t98-page-actions">{actions}</div>}</header>;
}

export function EmptyState({ title, description, icon = 'inbox', action }: { title: string; description: string; icon?: string; action?: ReactNode }) {
  return <div className="t98-empty-state"><span className="t98-empty-icon"><Icon name={icon} size={23} /></span>
    <h3>{title}</h3><p>{description}</p>{action && <div className="t98-empty-action">{action}</div>}
  </div>;
}

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  icon?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export function ActivityFeed({ items }: { items: readonly ActivityItem[] }) {
  return <ol className="t98-activity-feed">{items.map(item => <li key={item.id}>
    <span className={cx('t98-activity-icon', `t98-activity-${item.tone ?? 'neutral'}`, `t98-tone--${item.tone ?? 'neutral'}`)}><Icon name={item.icon ?? 'activity'} size={15} /></span>
    <div className="t98-activity-content"><div className="t98-activity-heading"><strong>{item.title}</strong><span>{item.time}</span></div>
      {item.description && <p>{item.description}</p>}
    </div>
  </li>)}</ol>;
}

export function ResourceCard({ title, description, icon = 'box', status, children, actions }: {
  title: string; description: string; icon?: string; status?: ReactNode; children?: ReactNode; actions?: ReactNode;
}) {
  return <article className="t98-resource-card"><div className="t98-resource-topline">
    <span className="t98-resource-icon"><Icon name={icon} size={21} /></span>{status && <div>{typeof status === 'string' ? <Badge>{status}</Badge> : status}</div>}
  </div><h3>{title}</h3><p className="t98-resource-description">{description}</p>
    {children && <div className="t98-resource-content">{children}</div>}{actions && <div className="t98-resource-actions">{actions}</div>}
  </article>;
}

export function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const id = useId();
  return <section className="t98-settings-section" aria-labelledby={id}><div className="t98-settings-description"><h2 id={id}>{title}</h2><p>{description}</p></div>
    <div className="t98-settings-fields">{children}</div>
  </section>;
}

/** Current is the zero-based index of the active step. */
export function Stepper({ steps, current }: { steps: readonly string[]; current: number }) {
  return <ol className="t98-stepper" aria-label="Progress">{steps.map((step, index) => <li key={`${index}-${step}`}
    className={cx(index < current && 't98-step-complete', index === current && 't98-step-current')} aria-current={index === current ? 'step' : undefined}>
    <span className="t98-step-marker" aria-hidden="true">{index < current ? <Icon name="check" size={14} /> : index + 1}</span>
    <span><span className="t98-visually-hidden">{index < current ? 'Completed: ' : index === current ? 'Current: ' : ''}</span>{step}</span>
  </li>)}</ol>;
}

export interface AppShellNavigation {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Must agree with the stylesheet breakpoint; defaults to `defaultSidebarMediaQuery`. */
  mediaQuery?: string;
  closeLabel?: string;
}
export interface AppShellProps {
  sidebar: ReactNode;
  /** Plain header strip. Superseded by `topbar` when both are given. */
  header?: ReactNode;
  /** Usually an `AppTopbar`; rendered in a header landmark outside `main`. */
  topbar?: ReactNode;
  /** Stack of `Banner`s above the main content. */
  banners?: ReactNode;
  /** Adds the mobile drawer (focus trap, Escape, shade) and shares its state with `AppTopbar menuToggle`. */
  navigation?: AppShellNavigation;
  sidebarLabel?: string;
  skipLinkLabel?: string;
  mainLabel?: string;
  children: ReactNode;
}

type FrameProps = Omit<AppShellProps, 'navigation'> & {
  mainId: string;
  asideProps?: HTMLAttributes<HTMLElement> & { ref?: RefObject<HTMLElement | null> };
  workspaceProps?: HTMLAttributes<HTMLElement>;
  drawer?: { closeLabel: string; modal: boolean; close: () => void };
};

function ShellFrame({ sidebar, header, topbar, banners, sidebarLabel, skipLinkLabel = 'Skip to content', mainLabel, children, mainId, asideProps, workspaceProps, drawer }: FrameProps) {
  return <div className={cx('t98-app-shell', drawer && 't98-app-shell--drawer')}><a className="t98-skip-link" href={`#${mainId}`}>{skipLinkLabel}</a>
    <aside {...asideProps} className="t98-shell-sidebar" aria-label={sidebarLabel}>
      {drawer ? <div className="t98-shell-sidebar__body">
        <div className="t98-shell-sidebar__bar"><button type="button" className="t98-shell-close" aria-label={drawer.closeLabel} onClick={drawer.close}><Icon name="x" size={20} aria-hidden="true" /></button></div>
        {sidebar}
      </div> : sidebar}
    </aside>
    {drawer?.modal && <div className="t98-shell-shade" aria-hidden="true" onClick={drawer.close} />}
    <div {...workspaceProps} className="t98-shell-workspace">
      {topbar ? <header className="t98-shell-header t98-shell-header--topbar">{topbar}</header> : header && <div className="t98-shell-header">{header}</div>}
      {banners && <div className="t98-shell-banners">{banners}</div>}
      <main className="t98-shell-main" id={mainId} tabIndex={-1} aria-label={mainLabel}>{children}</main>
    </div>
  </div>;
}

function DrawerShell({ navigation, ...props }: AppShellProps & { navigation: AppShellNavigation; mainId: string }) {
  const { open, onOpenChange, mediaQuery, closeLabel = 'Close navigation' } = navigation;
  const sidebarRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sidebarId = useId();
  const { modal, sidebarProps, contentProps } = useSidebarNavigation({ open, onOpenChange, sidebarRef, triggerRef, mediaQuery });
  return <appShellNavigation.Provider value={{ open, setOpen: onOpenChange, triggerRef, sidebarId }}>
    <ShellFrame {...props} asideProps={{ ...sidebarProps, id: sidebarId, ref: sidebarRef }} workspaceProps={contentProps} drawer={{ closeLabel, modal, close: () => onOpenChange(false) }} />
  </appShellNavigation.Provider>;
}

export function AppShell({ navigation, ...props }: AppShellProps) {
  const mainId = useId();
  return navigation ? <DrawerShell {...props} navigation={navigation} mainId={mainId} /> : <ShellFrame {...props} mainId={mainId} />;
}
