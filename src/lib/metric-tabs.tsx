'use client';

import type { ReactNode } from 'react';
import { Tabs, cx } from './primitives.js';

export interface MetricTabItem {
  value: string;
  label: string;
  /** App-formatted phrasing content; numeric zero remains a measured value. */
  metric: ReactNode;
  change?: { label: ReactNode; tone?: 'positive' | 'negative' | 'neutral' };
  /** Suppresses the metric and change and makes this tab unavailable. */
  unavailableReason?: string;
  content?: ReactNode;
}

export interface MetricTabsProps {
  label: string;
  items: readonly MetricTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/** App owns availability, formatted values, comparison meaning and panel content. */
export function MetricTabs({ label, items, value, onValueChange, className }: MetricTabsProps) {
  return <Tabs label={label.trim() || 'Metrics'} value={value} onValueChange={onValueChange} className={cx('t98-metric-tabs', className)}
    items={items.map(item => {
      const unavailable = item.unavailableReason !== undefined;
      const reason = item.unavailableReason?.trim() || 'Metric unavailable';
      return { value: item.value, disabled: unavailable, content: unavailable ? <p role="status">{reason}</p> : item.content, label: <>
        <span className="t98-metric-tab-label">{item.label}</span>
        <strong className="t98-metric-tab-value">{unavailable ? '—' : item.metric}</strong>
        {unavailable ? <span className="t98-metric-tab-reason">{reason}</span>
          : item.change != null && <span className="t98-metric-tab-change" data-tone={item.change.tone ?? 'neutral'}>{item.change.label}</span>}
      </> };
    })} />;
}
