'use client';

import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from './primitives.js';

export interface FlowSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  title: string;
  description?: string;
  scope?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** A feature-sized composition inside a page template. It owns no form, route or request. */
export function FlowSection({ title, description, scope, actions, children, className, ...props }: FlowSectionProps) {
  const titleId = useId();
  return <section aria-labelledby={props['aria-label'] ? undefined : titleId} {...props} className={cx('t98-flow-section', className)}>
    <header className="t98-flow-header">
      <div className="t98-flow-heading"><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>
      {actions != null && <div className="t98-form-actions">{actions}</div>}
    </header>
    {scope != null && <div className="t98-flow-scope">{scope}</div>}
    <div className="t98-flow-body">{children}</div>
  </section>;
}
