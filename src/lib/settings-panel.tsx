'use client';

import type { FormEvent, ReactNode } from 'react';
import { SettingsFlow, useSingleSubmit } from './flow-frame.js';
import type { FlowState } from './settings-base.js';

export interface SettingsPanelProps extends FlowState {
  /** Section heading (h2) and accessible name of the section. */
  title: string;
  description?: string;
  /** Receives the form's values. Runs once at a time, so a double activation sends one request. The panel calls `preventDefault`. */
  onSubmit?: (form: FormData) => void | Promise<void>;
  /** Native post target, used when `onSubmit` is omitted. The browser submits the form. */
  action?: string;
  method?: 'get' | 'post';
  /** Submit button label; omit when the panel has its own buttons in `actions`. */
  submitLabel?: string;
  submitDisabled?: boolean;
  /** Extra buttons or links beside the submit button. */
  actions?: ReactNode;
  children: ReactNode;
}

/** The section frame the library's own settings flows use, for an application's own settings screens: heading, outcome
 * alerts, a fieldset that locks busy or read-only content, a single-submit guard and focus on a new error or invalid field. */
export function SettingsPanel({ onSubmit, action, method, actions, ...props }: SettingsPanelProps) {
  const single = useSingleSubmit();
  const handle = onSubmit || action !== undefined
    ? (event: FormEvent<HTMLFormElement>) => {
      if (!onSubmit) return;
      event.preventDefault();
      void single(() => onSubmit(new FormData(event.currentTarget)));
    }
    : undefined;
  return <SettingsFlow {...props} onSubmit={handle} action={action} method={method} extraActions={actions} />;
}
