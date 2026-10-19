import type { HTMLAttributes, ReactNode } from 'react';
import { PageHeader } from './patterns.js';
import { cx } from './primitives.js';

/** Place one template inside the app's main landmark. App slots own their controls and state. */
export interface TemplateBaseProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  title: string;
  description?: string;
  actions?: ReactNode;
  scope?: ReactNode;
  children: ReactNode;
}
export interface OverviewTemplateProps extends TemplateBaseProps {
  filters?: ReactNode;
  metrics?: ReactNode;
}
export interface CollectionTemplateProps extends TemplateBaseProps {
  toolbar?: ReactNode;
  selection?: ReactNode;
  pagination?: ReactNode;
}
export interface DetailTemplateProps extends TemplateBaseProps {
  breadcrumb?: ReactNode;
  status?: ReactNode;
  navigation?: ReactNode;
  aside?: ReactNode;
}
export interface EditorTemplateProps extends TemplateBaseProps {
  breadcrumb?: ReactNode;
  steps?: ReactNode;
  preview?: ReactNode;
  feedback?: ReactNode;
  footer?: ReactNode;
}
export interface SettingsTemplateProps extends TemplateBaseProps {
  navigation?: ReactNode;
  feedback?: ReactNode;
}

function TemplateFrame({ title, description, actions, scope, breadcrumb, variant, className, children, ...props }: TemplateBaseProps & {
  variant: 'overview' | 'collection' | 'detail' | 'editor' | 'settings';
  breadcrumb?: ReactNode;
}) {
  return <section aria-label={title} {...props} className={cx('t98-template', `t98-template--${variant}`, className)}>
    {breadcrumb != null && <div className="t98-template-breadcrumb">{breadcrumb}</div>}
    <div className="t98-template-header"><PageHeader title={title} description={description} actions={actions} /></div>
    {scope != null && <div className="t98-template-scope">{scope}</div>}
    {children}
  </section>;
}

/** Fixed reading order: header → scope → filters → metrics → content. */
export function OverviewTemplate({ filters, metrics, children, ...props }: OverviewTemplateProps) {
  return <TemplateFrame {...props} variant="overview">
    {filters != null && <div className="t98-template-filters">{filters}</div>}
    {metrics != null && <div className="t98-template-metrics">{metrics}</div>}
    <div className="t98-template-body"><div className="t98-template-main">{children}</div></div>
  </TemplateFrame>;
}

/** Fixed reading order: header → scope → toolbar → selection → content → pagination. */
export function CollectionTemplate({ toolbar, selection, pagination, children, ...props }: CollectionTemplateProps) {
  return <TemplateFrame {...props} variant="collection">
    {toolbar != null && <div className="t98-template-toolbar">{toolbar}</div>}
    {selection != null && <div className="t98-template-selection">{selection}</div>}
    <div className="t98-template-body"><div className="t98-template-main">{children}</div></div>
    {pagination != null && <div className="t98-template-pagination">{pagination}</div>}
  </TemplateFrame>;
}

/** Fixed reading order: breadcrumb → header → scope → status → navigation → content → aside. */
export function DetailTemplate({ status, navigation, aside, children, ...props }: DetailTemplateProps) {
  return <TemplateFrame {...props} variant="detail">
    {status != null && <div className="t98-template-status">{status}</div>}
    {navigation != null && <div className="t98-template-navigation">{navigation}</div>}
    <div className="t98-template-body"><div className="t98-template-main">{children}</div>
      {aside != null && <aside className="t98-template-aside" aria-label="Related information">{aside}</aside>}
    </div>
  </TemplateFrame>;
}

/** Fixed reading order: breadcrumb → header → scope → steps → feedback → form content → preview → footer. */
export function EditorTemplate({ steps, feedback, preview, footer, children, ...props }: EditorTemplateProps) {
  return <TemplateFrame {...props} variant="editor">
    {steps != null && <div className="t98-template-steps">{steps}</div>}
    {feedback != null && <div className="t98-template-feedback">{feedback}</div>}
    <div className="t98-template-body"><div className="t98-template-main">{children}</div>
      {preview != null && <aside className="t98-template-preview" aria-label="Preview">{preview}</aside>}
    </div>
    {footer != null && <footer className="t98-template-footer">{footer}</footer>}
  </TemplateFrame>;
}

/** Fixed reading order: header → scope → section navigation → feedback → settings content. */
export function SettingsTemplate({ navigation, feedback, children, ...props }: SettingsTemplateProps) {
  return <TemplateFrame {...props} variant="settings">
    <div className="t98-template-body">
      {navigation != null && <div className="t98-template-navigation">{navigation}</div>}
      <div className="t98-template-main">
        {feedback != null && <div className="t98-template-feedback">{feedback}</div>}
        {children}
      </div>
    </div>
  </TemplateFrame>;
}
