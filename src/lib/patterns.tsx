'use client';

import { Children, Fragment, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject, type SyntheticEvent } from 'react';
import { Badge, Button, Icon, Input, cx } from './primitives.js';
import { Pager, StatusLine } from './controls.js';
import { linearScale, segments } from './chart-scale.js';
import { appShellNavigation } from './shell.js';
import { useSidebarNavigation } from './sidebar.js';

export type TableAlign = 'start' | 'end' | 'center';
export type TableMinWidth = 'sm' | 'md' | 'lg';

export interface DataColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** Supply a plain value for searching and sorting a custom cell. */
  sortValue?: (row: T) => string | number;
  /** Defaults to `end` for `numeric` columns and `start` otherwise. */
  align?: TableAlign;
  /** End-aligns with tabular numerals. */
  numeric?: boolean;
  /** Lets long text wrap instead of widening the table. */
  wrap?: boolean;
  /** Named minimum width; apps cannot pass styles. */
  minWidth?: TableMinWidth;
  /** Renders the cell as a row header (`th scope="row"`) that names its row. */
  rowHeader?: boolean;
  /** Omits the column, including from search and sort, without removing its definition. */
  hidden?: boolean;
  /** Set to `false` to keep one column from sorting. */
  sortable?: boolean;
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

/** `index` is zero-based. `total` enables page counts; without it Next is offered while the page is full. */
export interface TableIndexPage { index: number; size: number; total?: number; status?: ReactNode; cursor?: undefined }
export interface TableCursorPage { cursor: { hasPrevious: boolean; hasNext: boolean }; status?: ReactNode; index?: undefined }
export interface TablePageChange {
  direction: 'previous' | 'next';
  /** The requested zero-based page for index paging; absent for cursor paging. */
  index?: number;
}

type TableName =
  | { caption: string; captionHidden?: boolean; ariaLabel?: undefined }
  | { caption?: undefined; captionHidden?: undefined; ariaLabel: string };

interface DataTableBaseProps<T> {
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** With `sortable` and `pagination` also `false`, a plain table with no toolbar. */
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  selectable?: boolean;
  /** Controlled selection: the table keeps no selection state and the app owns pruning. Report changes through `onSelectionChange`. */
  selectedKeys?: readonly string[];
  onSelectionChange?: (keys: string[]) => void;
  /** The row shown as current for a list-detail layout (`aria-current`). Independent of checkbox selection. */
  activeKey?: string;
  /** Makes rows activatable: a click on a cell (not an inner control) or Enter/Space on the focused row. Rows become one roving tab stop. */
  onRowActivate?: (row: T, key: string) => void;
  /** Detail content for an expanded row, rendered in a following full-width row with a disclosure button per row. */
  rowDetail?: (row: T) => ReactNode;
  /** Controlled expansion; without it the table keeps its own. */
  expandedKeys?: readonly string[];
  onExpandedChange?: (keys: string[]) => void;
  emptyTitle?: string;
  /** Replaces the default empty state. */
  emptyState?: ReactNode;
  /** Server mode: the app sorts. Supplying `sort` or `onSortChange` stops local sorting. */
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  /** Server mode: the app slices. The table shows `rows` as given. */
  /** Server paging. Pass `total` or a cursor: without either, Next stays enabled whenever a page is full, because the table cannot know a full page is the last. */
  page?: TableIndexPage | TableCursorPage;
  onPageChange?: (change: TablePageChange) => void;
  /** Server mode: the app filters. Supplying `search` or `onSearchChange` stops local filtering. */
  search?: string;
  onSearchChange?: (query: string) => void;
  /** Trailing actions cell per row; supply Buttons or menus. */
  rowActions?: (row: T) => ReactNode;
  rowActionsLabel?: string;
  loading?: boolean;
  /** An error or unavailable state, with any retry content supplied by the app. Distinct from empty. */
  unavailable?: ReactNode;
  stickyHeader?: boolean;
  /** Totals row cells, aligned by index to `columns` (hidden columns keep their slot). */
  footerCells?: readonly ReactNode[];
  density?: 'comfortable' | 'compact';
  /** `stack` shows each row as label/value pairs below 600px; table semantics are kept. */
  responsive?: 'scroll' | 'stack';
}
export type DataTableProps<T> = DataTableBaseProps<T> & TableName;

const isMissing = (value: unknown) => value == null || (typeof value === 'number' && Number.isNaN(value));
// Clicks on these inside a row belong to the control, never to row activation.
const interactiveTarget = 'a[href],button,input,select,textarea,label,summary,[role="button"],[role="link"],[contenteditable="true"]';

export function DataTable<T>({
  columns, rows, rowKey, caption, captionHidden = true, ariaLabel, searchable = true, sortable = true, pagination = true,
  searchPlaceholder = 'Search records…', pageSize = 5, selectable = false, selectedKeys: selectedKeysProp, onSelectionChange, activeKey, onRowActivate, rowDetail, expandedKeys: expandedKeysProp, onExpandedChange, emptyTitle = 'No records found', emptyState,
  sort: sortProp, onSortChange, page: pageProp, onPageChange, search: searchProp, onSearchChange, rowActions, rowActionsLabel = 'Actions',
  loading = false, unavailable, stickyHeader = false, footerCells, density = 'comfortable', responsive = 'scroll',
}: DataTableProps<T>) {
  const [localQuery, setQuery] = useState('');
  const [localSort, setSort] = useState<TableSort>();
  const [localPage, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [localExpanded, setLocalExpanded] = useState<string[]>([]);
  const [focusKey, setFocusKey] = useState<string>();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const selectAll = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const name = caption ?? ariaLabel;
  const controlledSort = sortProp !== undefined || onSortChange !== undefined;
  const controlledSearch = searchProp !== undefined || onSearchChange !== undefined;
  const controlledPage = pageProp !== undefined;
  const shown = columns.filter(column => !column.hidden);
  const sort = controlledSort ? sortProp : localSort;
  const query = controlledSearch ? searchProp ?? '' : localQuery;
  const size = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 5;
  // ponytail: local operations suit small datasets; use the controlled props for server-side collections.
  const filtered = filterAndSortRows(rows, shown, searchable && !controlledSearch ? localQuery : '', controlledSort ? undefined : localSort);
  const paged = pagination && !controlledPage;
  const pageCount = paged ? Math.max(1, Math.ceil(filtered.length / size)) : 1;
  const currentPage = Math.min(localPage, pageCount);
  const serverIndex = pageProp?.index;
  const serverTotal = pageProp?.index === undefined ? undefined : pageProp.total;
  const serverSize = pageProp?.index === undefined ? 0 : pageProp.size;
  const offset = paged ? (currentPage - 1) * size : (serverIndex ?? 0) * serverSize;
  const visible = paged ? filtered.slice(offset, offset + size) : filtered;
  const keys = new Set(rows.map(rowKey));
  const controlledSelection = selectedKeysProp !== undefined;
  const selectedKeys = controlledSelection ? [...selectedKeysProp] : controlledPage ? selected : selected.filter(key => keys.has(key));
  const selectedSet = new Set(selectedKeys);
  const visibleKeys = visible.map(rowKey);
  const selectedOnPage = visibleKeys.filter(key => selectedSet.has(key)).length;
  const allChecked = visible.length > 0 && selectedOnPage === visible.length;
  const hasUnavailable = unavailable != null && unavailable !== false;
  const stack = responsive === 'stack';
  const columnCount = Math.max(1, shown.length + (selectable ? 1 : 0) + (rowDetail ? 1 : 0) + (rowActions ? 1 : 0));
  const detailBase = useId();
  const expandedSet = new Set(expandedKeysProp ?? localExpanded);
  const activatable = onRowActivate !== undefined;
  // One roving tab stop: the last focused row, else the active row, else the first.
  const tabKey = [focusKey, activeKey].find(key => key !== undefined && visibleKeys.includes(key)) ?? visibleKeys[0];
  const alignOf = (column: DataColumn<T>) => column.align ?? (column.numeric ? 'end' : 'start');
  const cellClass = (column: DataColumn<T>) => cx(
    alignOf(column) !== 'start' && `t98-table-cell--${alignOf(column)}`, column.numeric && 't98-table-cell--numeric',
    column.wrap && 't98-table-cell--wrap', column.minWidth && `t98-table-cell--${column.minWidth}`,
  ) || undefined;
  // A stacked table is display:block, which some browsers treat as losing table semantics; roles restore them.
  const role = (value: string) => stack ? value : undefined;

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selectedOnPage > 0 && !allChecked;
  }, [selectedOnPage, allChecked]);

  useEffect(() => { setPage(current => Math.min(current, pageCount)); }, [pageCount]);

  useEffect(() => {
    // With server paging the rows are one page, so other pages' selections stay with the app.
    if (controlledPage || controlledSelection) return;
    const availableKeys = new Set(rows.map(rowKey));
    const next = selected.filter(key => availableKeys.has(key));
    if (next.length !== selected.length) {
      setSelected(next);
      onSelectionChange?.(next);
    }
  }, [rows, rowKey, selected, onSelectionChange, controlledPage, controlledSelection]);

  function updateSelection(next: string[]) {
    if (!controlledSelection) setSelected(next);
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

  function toggleExpanded(key: string) {
    const current = expandedKeysProp ?? localExpanded;
    const next = current.includes(key) ? current.filter(item => item !== key) : [...current, key];
    if (expandedKeysProp === undefined) setLocalExpanded(next);
    onExpandedChange?.(next);
  }

  // Row activation and roving focus follow the WAI-ARIA APG grid/table keyboard guidance and the
  // react-aria useTable row-action model (Apache-2.0); a behaviour-only port, no code is copied.
  function onRowClick(event: MouseEvent<HTMLTableRowElement>, row: T) {
    const control = (event.target as Element).closest(interactiveTarget);
    if (control && event.currentTarget.contains(control)) return;
    onRowActivate?.(row, rowKey(row));
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: T, index: number) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowActivate?.(row, rowKey(row));
      return;
    }
    const last = visibleKeys.length - 1;
    const target = event.key === 'ArrowDown' ? Math.min(index + 1, last) : event.key === 'ArrowUp' ? Math.max(index - 1, 0)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : undefined;
    if (target === undefined) return;
    event.preventDefault();
    rowRefs.current.get(visibleKeys[target])?.focus();
  }

  function changeQuery(value: string) {
    if (controlledSearch) onSearchChange?.(value);
    else { setQuery(value); setPage(1); }
  }

  function changeSort(column: DataColumn<T>) {
    const next: TableSort = { key: column.key, direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' };
    if (controlledSort) onSortChange?.(next);
    else { setSort(next); setPage(1); }
  }

  const hasPrevious = pageProp?.cursor ? pageProp.cursor.hasPrevious : (serverIndex ?? 0) > 0;
  const hasNext = pageProp?.cursor ? pageProp.cursor.hasNext
    : serverTotal !== undefined ? ((serverIndex ?? 0) + 1) * serverSize < serverTotal : rows.length >= serverSize;
  const serverStatus = pageProp?.status ?? (serverIndex === undefined ? undefined
    : serverTotal !== undefined ? `${rows.length ? offset + 1 : 0}–${offset + rows.length} of ${serverTotal}` : `Page ${serverIndex + 1}`);
  const count = controlledPage ? serverTotal ?? rows.length : filtered.length;
  const countLabel = controlledPage && serverTotal === undefined ? `${count} shown` : `${count} ${count === 1 ? 'record' : 'records'}`;
  // Counts and pages describe settled data; while loading or unavailable they would state a total the app does not have.
  const settled = pagination && !hasUnavailable && !loading;

  return <div className={cx('t98-data-table', stickyHeader && 't98-data-table--sticky', density === 'compact' && 't98-data-table--compact', stack && 't98-data-table--stack')} aria-busy={loading || undefined}>
    {(searchable || pagination) && <div className="t98-table-toolbar">
      {searchable && <div className="t98-table-search">
        <label htmlFor={searchId} className="t98-visually-hidden">Search {name}</label>
        <Icon name="search" size={16} />
        <Input id={searchId} type="search" value={query} placeholder={searchPlaceholder} onChange={event => changeQuery(event.target.value)} />
      </div>}
      {settled && <span className="t98-table-count" aria-live="polite">
        {selectedKeys.length > 0 && selectable ? `${selectedKeys.length} selected · ` : ''}
        {countLabel}
      </span>}
    </div>}
    {loading && <div className="t98-table-status"><StatusLine busy>Loading records…</StatusLine></div>}
    <div className={cx('t98-table-scroll', stickyHeader && 't98-table-scroll--sticky')} tabIndex={0} role="region" aria-label={`${name} table`}>
      <table className="t98-table" role={role('table')} aria-label={caption === undefined ? ariaLabel : undefined} aria-busy={loading || undefined}>
        {caption !== undefined && <caption className={captionHidden ? 't98-visually-hidden' : 't98-table-caption'}>{caption}</caption>}
        <thead role={role('rowgroup')}><tr role={role('row')}>
          {selectable && <th className="t98-table-check" scope="col" role={role('columnheader')}>
            <label className="t98-table-checkbox-target"><input ref={selectAll} type="checkbox" checked={allChecked} disabled={visible.length === 0}
              aria-label="Select all rows on this page" onChange={togglePage} /></label>
          </th>}
          {rowDetail && <th scope="col" className="t98-table-expand" role={role('columnheader')}><span className="t98-visually-hidden">Details</span></th>}
          {shown.map(column => {
            const sorts = sortable && column.sortable !== false;
            return <th key={column.key} scope="col" className={cellClass(column)} role={role('columnheader')}
              aria-sort={sorts ? sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>
              {sorts ? <button type="button" className="t98-sort-button" onClick={() => changeSort(column)}>
                {column.header}
                <Icon name={sort?.key === column.key ? sort.direction === 'asc' ? 'arrow-up' : 'arrow-down' : 'chevrons-up-down'} size={13} />
              </button> : column.header}
            </th>;
          })}
          {rowActions && <th scope="col" className="t98-table-actions" role={role('columnheader')}><span className="t98-visually-hidden">{rowActionsLabel}</span></th>}
        </tr></thead>
        <tbody role={role('rowgroup')}>
          {!hasUnavailable && visible.map((row, index) => {
            const key = rowKey(row);
            const expanded = rowDetail !== undefined && expandedSet.has(key);
            const detailId = `${detailBase}-detail-${offset + index}`;
            return <Fragment key={key}><tr role={role('row')} data-selected={selectedSet.has(key) || undefined}
              // aria-current rather than aria-selected: aria-selected is not supported on a row of a native table and would blur with checkbox selection.
              aria-current={activeKey === key ? 'true' : undefined} className={activatable ? 't98-table-row--interactive' : undefined}
              ref={activatable ? node => { if (node) rowRefs.current.set(key, node); else rowRefs.current.delete(key); } : undefined}
              tabIndex={activatable ? (key === tabKey ? 0 : -1) : undefined}
              onFocus={activatable ? event => { if (event.target === event.currentTarget) setFocusKey(key); } : undefined}
              onClick={activatable ? event => onRowClick(event, row) : undefined}
              onKeyDown={activatable ? event => onRowKeyDown(event, row, index) : undefined}>
            {selectable && <td className="t98-table-check" role={role('cell')}>
              <label className="t98-table-checkbox-target"><input type="checkbox" aria-label={`Select row ${offset + index + 1}`} checked={selectedSet.has(key)}
                onChange={() => toggleRow(key)} /></label>
            </td>}
            {rowDetail && <td className="t98-table-expand" role={role('cell')}>
              <Button variant="ghost" size="sm" aria-label={`Details for row ${offset + index + 1}`} aria-expanded={expanded} aria-controls={detailId} onClick={() => toggleExpanded(key)}>
                <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} />
              </Button>
            </td>}
            {shown.map(column => {
              const content = column.render ? column.render(row) : cellValue(row, column);
              const children = isMissing(content)
                ? <><span aria-hidden="true">—</span><span className="t98-visually-hidden">Not available</span></>
                : column.render ? content as ReactNode : cellText(content);
              const label = stack ? column.header : undefined;
              return column.rowHeader
                ? <th key={column.key} scope="row" className={cellClass(column)} data-label={label} role={role('rowheader')}>{children}</th>
                : <td key={column.key} className={cellClass(column)} data-label={label} role={role('cell')}>{children}</td>;
            })}
            {rowActions && <td className="t98-table-actions" data-label={stack ? rowActionsLabel : undefined} role={role('cell')}>{rowActions(row)}</td>}
          </tr>
          {expanded && <tr id={detailId} className="t98-table-detail" role={role('row')}><td colSpan={columnCount} role={role('cell')}>{rowDetail(row)}</td></tr>}
          </Fragment>;
          })}
          {hasUnavailable && <tr role={role('row')}><td colSpan={columnCount} role={role('cell')}><div className="t98-table-state">{unavailable}</div></td></tr>}
          {!hasUnavailable && !loading && visible.length === 0 && <tr role={role('row')}><td colSpan={columnCount} role={role('cell')}>
            {emptyState ?? <EmptyState title={emptyTitle} description={query ? 'Try a different search or clear your search to see all records.' : 'New records will appear here.'}
              icon="search" action={query ? <Button variant="secondary" size="sm" onClick={() => changeQuery('')}>Clear search</Button> : undefined} />}
          </td></tr>}
        </tbody>
        {footerCells && <tfoot role={role('rowgroup')}><tr role={role('row')}>
          {selectable && <td className="t98-table-check" role={role('cell')} />}
          {rowDetail && <td className="t98-table-expand" role={role('cell')} />}
          {columns.flatMap((column, index) => column.hidden ? [] : [column.rowHeader
            ? <th key={column.key} scope="row" className={cellClass(column)} data-label={stack ? column.header : undefined} role={role('rowheader')}>{footerCells[index]}</th>
            : <td key={column.key} className={cellClass(column)} data-label={stack ? column.header : undefined} role={role('cell')}>{footerCells[index]}</td>])}
          {rowActions && <td className="t98-table-actions" role={role('cell')} />}
        </tr></tfoot>}
      </table>
    </div>
    {settled && (controlledPage
      ? <div className="t98-table-pager">
        <Pager label={`${name} pages`} status={serverStatus}
          onPrevious={hasPrevious ? () => onPageChange?.({ direction: 'previous', index: serverIndex === undefined ? undefined : serverIndex - 1 }) : undefined}
          onNext={hasNext ? () => onPageChange?.({ direction: 'next', index: serverIndex === undefined ? undefined : serverIndex + 1 }) : undefined} />
      </div>
      : paged && <div className="t98-table-pagination">
        <span>{filtered.length === 0 ? '0 records' : `${offset + 1}–${Math.min(offset + size, filtered.length)} of ${filtered.length}`}</span>
        <div className="t98-pagination-controls">
          <Button variant="ghost" size="sm" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><Icon name="chevron-left" size={16} /></Button>
          <span aria-live="polite">Page {currentPage} of {pageCount}</span>
          <Button variant="ghost" size="sm" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><Icon name="chevron-right" size={16} /></Button>
        </div>
      </div>)}
  </div>;
}

/** A compact trend line. A missing (`null` or non-finite) value leaves a gap; it is never drawn as 0. */
export function Sparkline({ values, label, color = 'var(--t98-accent)' }: { values: readonly (number | null)[]; label: string; color?: string }) {
  const known = values.map(value => value !== null && Number.isFinite(value) ? value : null);
  const finite = known.filter((value): value is number => value !== null);
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  // Scale first so the full finite range cannot overflow when subtracted.
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const scaled = linearScale([minimum / scale, maximum / scale], [36, 4]);
  const y = (value: number) => scaled(value) ?? 20;
  const x = (index: number) => known.length === 1 ? 60 : 3 + index / (known.length - 1) * 114;
  const gaps = known.length - finite.length;
  const summary = finite.length ? `${label}: ${finite.length} points, first ${finite[0]}, last ${finite.at(-1)}, minimum ${minimum}, maximum ${maximum}${gaps ? `, ${gaps} unavailable` : ''}` : `${label}: no data`;
  return <svg className="t98-sparkline" viewBox="0 0 120 40" role="img" aria-label={summary} style={{ color }}>
    {segments(known, value => value !== null).map(run => run.length > 1
      ? <polyline key={run[0].index} points={run.map(({ index, item }) => `${x(index)},${y(item! / scale)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      : <circle key={run[0].index} cx={x(run[0].index)} cy={y(run[0].item! / scale)} r="3" fill="currentColor" />)}
  </svg>;
}

interface MetricCardBaseProps {
  label: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  chart?: readonly (number | null)[];
  /** Short qualifier under the value, such as a date range or an exclusion. */
  hint?: ReactNode;
}
export type MetricCardProps = MetricCardBaseProps & (
  | { value: ReactNode; unavailable?: undefined }
  /** `unavailable` replaces the value, comparison and chart; it is never presented as 0. */
  | { unavailable: ReactNode; value?: ReactNode }
);

export function MetricCard({ label, value, change, trend = 'neutral', chart, hint, unavailable }: MetricCardProps) {
  const missing = unavailable != null && unavailable !== false;
  return <article className="t98-metric-card">
    <p className="t98-metric-label">{label}</p>
    <div className="t98-metric-body">
      {missing ? <strong className="t98-metric-value t98-metric-value--unavailable">{unavailable}</strong> : <strong className="t98-metric-value">{value}</strong>}
      {!missing && chart && <Sparkline values={chart} label={`${label} trend`} color={trend === 'down' ? 'var(--t98-danger)' : 'var(--t98-accent)'} />}
    </div>
    {!missing && change && <p className={cx('t98-metric-change', `t98-trend-${trend}`)}>
      <Icon name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus'} size={14} />
      <span className="t98-visually-hidden">{trend === 'up' ? 'Increasing: ' : trend === 'down' ? 'Decreasing: ' : ''}</span>{change}
    </p>}
    {hint && <p className="t98-metric-hint">{hint}</p>}
  </article>;
}

export type MetricGridItemWidth = 'sm' | 'md' | 'lg';
export type MetricGridProps = {
  /** Named minimum card width; the grid fills the available columns. */
  minItemWidth?: MetricGridItemWidth;
  children: ReactNode;
} & ({ list: true; label: string } | { list?: false; label?: string });

/** A responsive grid of MetricCards. `list` exposes the metrics as a labelled list. */
export function MetricGrid({ minItemWidth = 'md', children, list, label }: MetricGridProps) {
  const className = cx('t98-metric-grid', `t98-metric-grid--${minItemWidth}`);
  return list
    ? <ul className={className} aria-label={label}>{Children.map(children, child => <li>{child}</li>)}</ul>
    : <div className={className} role={label ? 'group' : undefined} aria-label={label}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="t98-page-header"><div>
    {eyebrow && <p className="t98-eyebrow">{eyebrow}</p>}
    <h1>{title}</h1>{description && <p className="t98-page-description">{description}</p>}
  </div>{actions && <div className="t98-page-actions">{actions}</div>}</header>;
}

export function EmptyState({ title, description, icon = 'inbox', action }: { title: string; description: ReactNode; icon?: string; action?: ReactNode }) {
  return <div className="t98-empty-state"><span className="t98-empty-icon"><Icon name={icon} size={23} /></span>
    <h3>{title}</h3><p>{description}</p>{action && <div className="t98-empty-action">{action}</div>}
  </div>;
}

export interface ActivityItem {
  id: string;
  title: string;
  description?: ReactNode;
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

export function ResourceCard({ title, description, icon = 'box', status, children, actions, media, tags }: {
  title: string; description: ReactNode; icon?: string; status?: ReactNode; children?: ReactNode; actions?: ReactNode;
  /** A thumbnail or preview (for example an Image with an aspect) shown at the top in place of the icon. */
  media?: ReactNode;
  /** Short labels such as asset type or campaign, listed under the description. */
  tags?: readonly string[];
}) {
  return <article className={cx('t98-resource-card', media != null && 't98-resource-card--media')}>
    {media != null && <div className="t98-resource-media">{media}</div>}
    <div className="t98-resource-topline">
      {media == null && <span className="t98-resource-icon"><Icon name={icon} size={21} /></span>}{status && <div>{typeof status === 'string' ? <Badge>{status}</Badge> : status}</div>}
    </div><h3>{title}</h3><p className="t98-resource-description">{description}</p>
    {tags && tags.length > 0 && <ul className="t98-resource-tags" aria-label={`Tags for ${title}`}>{tags.map(tag => <li key={tag}><Badge>{tag}</Badge></li>)}</ul>}
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

function ShellFrame({ sidebar, header, topbar, banners, sidebarLabel = 'Application navigation', skipLinkLabel = 'Skip to content', mainLabel, children, mainId, asideProps, workspaceProps, drawer }: FrameProps) {
  const main = useRef<HTMLElement>(null);
  /* Skip link per the WCAG G1 technique, with the focus-the-target refinement from the APG landmark guidance.
   * The href stays as the no-JS fallback only. Every JS activation (click, Enter, Ctrl/Meta/Shift click, middle click)
   * is cancelled and main is focused instead, so the URL hash, which apps use for capability tokens, is never rewritten. */
  const skip = (event: SyntheticEvent) => { event.preventDefault(); main.current?.focus(); };
  return <div className={cx('t98-app-shell', drawer && 't98-app-shell--drawer')}><a className="t98-skip-link" href={`#${mainId}`} onClick={skip} onAuxClick={skip}>{skipLinkLabel}</a>
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
      <main ref={main} className="t98-shell-main" id={mainId} tabIndex={-1} aria-label={mainLabel}>{children}</main>
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
