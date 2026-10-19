'use client';

import { type ReactNode } from 'react';
import { Button, cx } from './primitives.js';

interface AnalyticsContextProps {
  label: string;
  /** Visible app-owned scope, range, timezone, units and measurement definitions. */
  context: ReactNode;
  /** App-owned loading/error/partial/stale explanation; retained data keeps its context. */
  notice?: ReactNode;
  loading?: boolean;
  emptyMessage?: ReactNode;
  className?: string;
}

export interface FunnelStep {
  id: string;
  label: string;
  count: string | number | null;
  reason?: string;
  /** Already calculated and formatted by the app. Omit when no rate is supplied. */
  conversion?: string | null;
  conversionReason?: string;
  detail?: ReactNode;
}
export interface FunnelBreakdownProps extends AnalyticsContextProps {
  countLabel?: string;
  steps: readonly FunnelStep[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  disabled?: boolean;
}

/** Ordered presentation only; identity, windows, denominators and all math belong to the app. */
export function FunnelBreakdown({ label, context, countLabel = 'Count', steps, selectedId, onSelect, disabled, notice, loading, emptyMessage = 'No funnel steps supplied.', className }: FunnelBreakdownProps) {
  return <section className={cx('t98-funnel-breakdown', className)} aria-label={label} aria-busy={loading || undefined}>
    <h3 className="t98-funnel-title">{label}</h3>
    <div className="t98-funnel-context">{context}</div>
    {notice != null && <div className="t98-funnel-notice">{notice}</div>}
    {steps.length === 0 ? <p className="t98-funnel-empty">{emptyMessage}</p> : <ol className="t98-funnel-steps">{steps.map(step => <li className="t98-funnel-step" data-selected={step.id === selectedId || undefined} key={step.id}>
      <div className="t98-funnel-step-heading">{onSelect ? <Button className="t98-funnel-select" variant="ghost" size="sm" disabled={disabled} aria-pressed={step.id === selectedId} onClick={() => onSelect(step.id)}>{step.label}</Button> : <span className="t98-funnel-label">{step.label}</span>}
        {step.id === selectedId && <span className="t98-funnel-selected">Selected</span>}
      </div>
      <p className="t98-funnel-count">{countLabel}: <span>{step.count === null ? 'Unavailable' : step.count}</span></p>
      {step.count === null && !step.reason && <p className="t98-funnel-reason">No count observation available.</p>}
      {step.reason && <p className="t98-funnel-reason">{step.reason}</p>}
      {step.conversion !== undefined && <p className="t98-funnel-conversion">Conversion: {step.conversion === null ? 'Unavailable' : step.conversion}</p>}
      {step.conversion === null && <p className="t98-funnel-reason">{step.conversionReason ?? 'No conversion comparison available.'}</p>}
      {step.detail != null && <div className="t98-funnel-detail">{step.detail}</div>}
    </li>)}</ol>}
  </section>;
}

export interface RetentionColumn { id: string; label: string }
export type RetentionCell =
  | { status: 'observed'; value: string | number; detail?: ReactNode }
  | { status: 'future' | 'unavailable'; reason?: string; detail?: ReactNode };
export interface RetentionCohort {
  id: string;
  label: string;
  size: string | number | null;
  sizeReason?: string;
  /** Keys are column ids. Missing cells are unavailable, never measured zero. */
  cells: Readonly<Record<string, RetentionCell | undefined>>;
}
export interface RetentionTableProps extends AnalyticsContextProps {
  columns: readonly RetentionColumn[];
  cohorts: readonly RetentionCohort[];
}

/** Native cohort table; app supplies observation status, cohorts, units and retention math. */
export function RetentionTable({ label, context, columns, cohorts, notice, loading, emptyMessage = 'No cohorts supplied.', className }: RetentionTableProps) {
  return <section className={cx('t98-retention-table', className)} aria-label={label} aria-busy={loading || undefined}>
    <h3 className="t98-retention-title">{label}</h3>
    <div className="t98-retention-context">{context}</div>
    {notice != null && <div className="t98-retention-notice">{notice}</div>}
    {cohorts.length === 0 ? <p className="t98-retention-empty">{emptyMessage}</p> : <div className="t98-retention-scroll" role="region" aria-label={`${label} table`} tabIndex={0}>
      <table className="t98-retention-grid"><caption className="t98-retention-caption">{label}</caption>
        <thead><tr><th scope="col">Cohort</th><th scope="col">Cohort size</th>{columns.map(column => <th scope="col" key={column.id}>{column.label}</th>)}</tr></thead>
        <tbody>{cohorts.map(cohort => <tr key={cohort.id}><th scope="row">{cohort.label}</th><td className="t98-retention-size">{cohort.size === null ? 'Unavailable' : cohort.size}{cohort.sizeReason && <div className="t98-retention-reason">{cohort.sizeReason}</div>}</td>
          {columns.map(column => {
            const cell = cohort.cells[column.id];
            return <td className="t98-retention-cell" data-status={cell?.status ?? 'unavailable'} key={column.id}>
              <span className="t98-retention-value">{cell?.status === 'observed' ? cell.value : cell?.status === 'future' ? 'Not yet observed' : 'Unavailable'}</span>
              {cell?.status !== 'observed' && <div className="t98-retention-reason">{cell?.reason ?? (cell?.status === 'future' ? 'Observation period has not completed.' : 'No observation available for this period.')}</div>}
              {cell?.detail != null && <div className="t98-retention-detail">{cell.detail}</div>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}

export interface JourneyStep {
  id: string;
  label: string;
  count: string | number | null;
  reason?: string;
  detail?: ReactNode;
}
export interface JourneyPathProps extends AnalyticsContextProps {
  countLabel?: string;
  steps: readonly JourneyStep[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  disabled?: boolean;
  /** App-rendered graph. The ordered path remains available alongside it. */
  graph?: ReactNode;
}

/** Keyboard-accessible linear path; no graph layout, path inference or aggregation. */
export function JourneyPath({ label, context, countLabel = 'Count', steps, selectedId, onSelect, disabled, graph, notice, loading, emptyMessage = 'No journey steps supplied.', className }: JourneyPathProps) {
  return <section className={cx('t98-journey-path', className)} aria-label={label} aria-busy={loading || undefined}>
    <h3 className="t98-journey-title">{label}</h3>
    <div className="t98-journey-context">{context}</div>
    {notice != null && <div className="t98-journey-notice">{notice}</div>}
    {graph != null && <div className="t98-journey-graph">{graph}</div>}
    {steps.length === 0 ? <p className="t98-journey-empty">{emptyMessage}</p> : <ol className="t98-journey-steps">{steps.map(step => <li className="t98-journey-step" data-selected={step.id === selectedId || undefined} key={step.id}>
      <div className="t98-journey-step-heading">{onSelect ? <Button className="t98-journey-select" variant="ghost" size="sm" disabled={disabled} aria-pressed={step.id === selectedId} onClick={() => onSelect(step.id)}>{step.label}</Button> : <span className="t98-journey-label">{step.label}</span>}
        {step.id === selectedId && <span className="t98-journey-selected">Selected</span>}
      </div>
      <p className="t98-journey-count">{countLabel}: <span>{step.count === null ? 'Unavailable' : step.count}</span></p>
      {step.count === null && !step.reason && <p className="t98-journey-reason">No count observation available.</p>}
      {step.reason && <p className="t98-journey-reason">{step.reason}</p>}
      {step.detail != null && <div className="t98-journey-detail">{step.detail}</div>}
    </li>)}</ol>}
  </section>;
}

export interface RankComparisonRow {
  id: string;
  label: string;
  current: string | number | null;
  previous: string | number | null;
  currentReason?: string;
  previousReason?: string;
  /** App-defined change text, including direction/meaning; null is unavailable. */
  change: string | null;
  changeReason?: string;
  source: string;
  detail?: ReactNode;
}
export interface RankComparisonProps extends AnalyticsContextProps {
  currentLabel: string;
  previousLabel: string;
  rows: readonly RankComparisonRow[];
}

/** Retains supplied observation labels and rank meanings; never infers rank or change. */
export function RankComparison({ label, context, currentLabel, previousLabel, rows, notice, loading, emptyMessage = 'No rank comparisons supplied.', className }: RankComparisonProps) {
  return <section className={cx('t98-rank-comparison', className)} aria-label={label} aria-busy={loading || undefined}>
    <h3 className="t98-rank-title">{label}</h3>
    <div className="t98-rank-context">{context}</div>
    {notice != null && <div className="t98-rank-notice">{notice}</div>}
    {rows.length === 0 ? <p className="t98-rank-empty">{emptyMessage}</p> : <div className="t98-rank-scroll" role="region" aria-label={`${label} table`} tabIndex={0}>
      <table className="t98-rank-grid"><caption className="t98-rank-caption">{label}</caption>
        <thead><tr><th scope="col">Item</th><th scope="col">{currentLabel}</th><th scope="col">{previousLabel}</th><th scope="col">Change</th><th scope="col">Source / coverage</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}><th scope="row">{row.label}{row.detail != null && <div className="t98-rank-detail">{row.detail}</div>}</th>
          <td className="t98-rank-current"><span className="t98-rank-value">{row.current === null ? 'Unavailable' : row.current}</span>{(row.currentReason || row.current === null) && <div className="t98-rank-reason">{row.currentReason ?? 'No current rank observation available.'}</div>}</td>
          <td className="t98-rank-previous"><span className="t98-rank-value">{row.previous === null ? 'Unavailable' : row.previous}</span>{(row.previousReason || row.previous === null) && <div className="t98-rank-reason">{row.previousReason ?? 'No previous rank observation available.'}</div>}</td>
          <td className="t98-rank-change">{row.change === null ? 'Unavailable' : row.change}{(row.changeReason || row.change === null) && <div className="t98-rank-reason">{row.changeReason ?? 'No compatible comparison supplied.'}</div>}</td>
          <td className="t98-rank-source">{row.source}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
