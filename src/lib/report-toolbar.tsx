'use client';

import type { ReactNode } from 'react';
import { Disclosure, type DisclosureProps } from './controls.js';
import { cx } from './primitives.js';
import { FeatureControls, Inline, Stack } from './structure.js';

export interface ReportToolbarProps {
  controls: ReactNode;
  advanced?: ReactNode;
  advancedLabel?: string;
  advancedOpen?: boolean;
  defaultAdvancedOpen?: boolean;
  onAdvancedOpenChange?: DisclosureProps['onOpenChange'];
  summary?: ReactNode;
  actions?: ReactNode;
  label?: string;
  className?: string;
}

/** Report controls and applied scope; the application owns filtering and queries. */
export function ReportToolbar({ controls, advanced, advancedLabel = 'Advanced filters', advancedOpen, defaultAdvancedOpen, onAdvancedOpenChange, summary, actions, label = 'Report controls', className }: ReportToolbarProps) {
  return <Stack role="group" aria-label={label.trim() || 'Report controls'} gap={3} className={cx('t98-report-toolbar', className)}>
    <Inline align="end" gap={3} className="t98-report-toolbar-controls">{controls}</Inline>
    {advanced != null && <Disclosure summary={advancedLabel.trim() || 'Advanced filters'} variant="plain" open={advancedOpen} defaultOpen={defaultAdvancedOpen} onOpenChange={onAdvancedOpenChange}>
      <FeatureControls>{advanced}</FeatureControls>
    </Disclosure>}
    {(summary != null || actions != null) && <Inline justify="between" gap={3}>
      {summary != null && <Stack gap={2} className="t98-report-toolbar-summary">{summary}</Stack>}
      {actions != null && <Inline className="t98-report-toolbar-actions">{actions}</Inline>}
    </Inline>}
  </Stack>;
}
