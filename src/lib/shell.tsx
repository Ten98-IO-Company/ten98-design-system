'use client';

import { createContext, useContext, useId, type ComponentType, type MouseEvent, type ReactNode, type Ref, type RefObject } from 'react';
import { Avatar, Badge, Icon, Input, Select, cx, type IconName, type Tone } from './primitives.js';
import { Option, VisuallyHidden } from './structure.js';

/* Presentation for application navigation. Routing, authorization, data loading and draft guards stay in the app. */

/** Router link contract shared with `Link.component`, plus the attributes navigation needs.
 * With a linkComponent, `href` is a key the application resolves (for example a route id mapped to a router `to` and `search`), not necessarily a URL. */
export type NavLinkComponent = ComponentType<{ href: string; className?: string; children?: ReactNode; 'aria-current'?: 'page'; onClick?: (event: MouseEvent<HTMLElement>) => void }>;

interface NavItemBase {
  id: string;
  label: string;
  icon?: IconName;
  /** Marks the item for the page the user is on; exposed as aria-current="page". */
  current?: boolean;
  badge?: ReactNode;
  /** Spoken description of the badge, for example "unread". Visually hidden. */
  badgeLabel?: string;
  badgeTone?: Tone;
  /** Removes the item for this user without the application filtering its own list. */
  hidden?: boolean;
  /** Extra terms matched by `filter` besides the label. */
  keywords?: string[];
  disabled?: boolean;
}
type NavSelect = (item: SidebarNavItem, event: MouseEvent<HTMLElement>) => void;
/** At least one of `href` and `onSelect`. With both, the anchor is always rendered and `onSelect` runs first on a plain primary click:
 * calling `event.preventDefault()` there (for example to guard an unsaved draft) cancels navigation and `onNavigate`.
 * A `linkComponent` must honour `event.defaultPrevented` (TanStack Link does). Modified or non-primary clicks skip both callbacks and keep the browser default.
 * An item with only `onSelect` renders a button. */
export type SidebarNavItem = NavItemBase & ({ href: string; onSelect?: NavSelect } | { onSelect: NavSelect; href?: string });
export interface SidebarNavGroup { id: string; label?: string; items: SidebarNavItem[] }
export interface SidebarNavProps {
  /** Accessible name of the navigation landmark. */
  label: string;
  groups: SidebarNavGroup[];
  /** Renders `href` items, for example a TanStack Router link. `href` is then a key your component resolves. */
  linkComponent?: NavLinkComponent;
  /** Case-insensitive match on label and keywords; other items get the `hidden` attribute. A group whose items are all hidden or filtered is hidden too. */
  filter?: string;
  /** Called after the item's own handler unless that handler prevented the default action, for example to close a mobile drawer. */
  onNavigate?: (item: SidebarNavItem) => void;
  /** Shown when a non-empty filter matches nothing. */
  emptyFilter?: (query: string) => ReactNode;
}

function matches(item: SidebarNavItem, query: string) {
  if (item.hidden) return false;
  if (!query) return true;
  return [item.label, ...(item.keywords ?? [])].some(text => text.toLowerCase().includes(query));
}

function NavItemContent({ item }: { item: SidebarNavItem }) {
  return <>
    {item.icon && <Icon name={item.icon} size={17} aria-hidden="true" />}
    <span className="t98-sidebar-nav__text">{item.label}</span>
    {item.badge != null && item.badge !== false && <Badge tone={item.badgeTone} className="t98-sidebar-nav__badge">{item.badge}{item.badgeLabel && <VisuallyHidden> {item.badgeLabel}</VisuallyHidden>}</Badge>}
  </>;
}

export function SidebarNav({ label, groups, linkComponent: LinkComponent, filter = '', onNavigate, emptyFilter }: SidebarNavProps) {
  const baseId = useId();
  const query = filter.trim().toLowerCase();
  // One match per item; ids only need to be unique within their group.
  const shown = new Set(groups.flatMap(group => group.items.filter(item => matches(item, query)).map(item => `${group.id}/${item.id}`)));
  const visible = groups.map(group => group.items.filter(item => shown.has(`${group.id}/${item.id}`)).length);
  const nothing = visible.every(count => count === 0);
  return <nav aria-label={label} className="t98-sidebar-nav">
    {groups.map((group, index) => {
      const headingId = `${baseId}-${group.id}`;
      return <div key={group.id} className="t98-sidebar-nav__group" hidden={visible[index] === 0}>
        {group.label && <p id={headingId} className="t98-sidebar-nav__heading">{group.label}</p>}
        <ul className="t98-sidebar-nav__list" aria-labelledby={group.label ? headingId : undefined}>
          {group.items.map(item => {
            const aria = item.current ? 'page' as const : undefined;
            const select = (event: MouseEvent<HTMLElement>) => {
              if (item.href != null && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
              item.onSelect?.(item, event);
              if (item.href == null || !event.defaultPrevented) onNavigate?.(item);
            };
            let control: ReactNode;
            if (item.disabled) control = <span className="t98-sidebar-nav__item" aria-disabled="true" aria-current={aria}><NavItemContent item={item} /></span>;
            else if (item.href != null) {
              control = LinkComponent
                ? <LinkComponent href={item.href} className="t98-sidebar-nav__item" aria-current={aria} onClick={select}><NavItemContent item={item} /></LinkComponent>
                : <a href={item.href} className="t98-sidebar-nav__item" aria-current={aria} onClick={select}><NavItemContent item={item} /></a>;
            } else control = <button type="button" className="t98-sidebar-nav__item" aria-current={aria} onClick={select}><NavItemContent item={item} /></button>;
            return <li key={item.id} className="t98-sidebar-nav__entry" hidden={!shown.has(`${group.id}/${item.id}`)}>{control}</li>;
          })}
        </ul>
      </div>;
    })}
    {query && nothing && emptyFilter && <div className="t98-sidebar-nav__empty">{emptyFilter(filter.trim())}</div>}
  </nav>;
}

export interface WorkspaceOption { id: string; name: string; roleLabel?: string; /** One or two characters shown in a decorative avatar beside the select. */ initials?: string }
export interface ProjectOption { id: string; name: string }
export type WorkspaceCreateAction = { label?: string } & ({ href: string; onSelect?: never } | { onSelect: () => void; href?: never });
export interface WorkspaceProjectSwitcherLabels { workspace: string; project: string; noWorkspaces: string; loading: string; choose: string; noProjects: string }
export interface WorkspaceProjectSwitcherProps {
  workspaces: WorkspaceOption[];
  /** `null` while the project list loads. */
  projects: ProjectOption[] | null;
  workspaceId: string | null;
  projectId: string | null;
  onWorkspaceChange: (id: string) => void;
  onProjectChange: (id: string) => void;
  /** Present only when the user may create projects; the application decides. */
  create?: WorkspaceCreateAction;
  labels?: Partial<WorkspaceProjectSwitcherLabels>;
  disabled?: boolean;
  /** Renders a `create.href`; `href` is then a key your component resolves. */
  linkComponent?: NavLinkComponent;
}

const defaultLabels: WorkspaceProjectSwitcherLabels = { workspace: 'Workspace', project: 'Project', noWorkspaces: 'No workspaces available', loading: 'Loading projects…', choose: 'Choose a project', noProjects: 'No projects yet' };

/** Workspace and project selection for the signed-in user (User > Workspace > Project). */
export function WorkspaceProjectSwitcher({ workspaces, projects, workspaceId, projectId, onWorkspaceChange, onProjectChange, create, labels, disabled = false, linkComponent: LinkComponent }: WorkspaceProjectSwitcherProps) {
  const id = useId();
  const text = { ...defaultLabels, ...labels };
  if (workspaces.length === 0) return <p className="t98-switcher t98-switcher__empty">{text.noWorkspaces}</p>;
  const workspace = workspaces.find(item => item.id === workspaceId);
  const loading = projects === null;
  const empty = projects?.length === 0;
  const known = projects?.some(item => item.id === projectId) ?? false;
  const createLabel = create?.label ?? 'New project';
  const createName = `${createLabel} in ${workspace?.name ?? text.workspace}`;
  const createContent = <><Icon name="plus" size={17} aria-hidden="true" /><span>{createLabel}</span></>;
  return <div className="t98-switcher">
    <div className="t98-switcher__field">
      <label className="t98-switcher__label" htmlFor={`${id}-workspace`}>{text.workspace}</label>
      <div className="t98-switcher__workspace">
      {workspace?.initials && <Avatar name={Array.from(workspace.initials).slice(0, 2).join(' ')} size="sm" role={undefined} aria-label={undefined} aria-hidden="true" className="t98-switcher__avatar" />}
      <Select id={`${id}-workspace`} value={workspace?.id ?? ''} disabled={disabled} aria-describedby={workspace?.roleLabel ? `${id}-role` : undefined} onChange={event => onWorkspaceChange(event.target.value)}>
        {!workspace && <Option value="" disabled>{text.workspace}</Option>}
        {workspaces.map(item => <Option key={item.id} value={item.id}>{item.name}</Option>)}
      </Select>
      </div>
      {workspace?.roleLabel && <p id={`${id}-role`} className="t98-switcher__role">{workspace.roleLabel}</p>}
    </div>
    <div className="t98-switcher__field">
      <label className="t98-switcher__label" htmlFor={`${id}-project`}>{text.project}</label>
      <Select id={`${id}-project`} value={known ? projectId ?? '' : ''} disabled={disabled || loading || empty} aria-busy={loading || undefined} onChange={event => onProjectChange(event.target.value)}>
        {loading && <Option value="">{text.loading}</Option>}
        {empty && <Option value="">{text.noProjects}</Option>}
        {!loading && !empty && !known && <Option value="" disabled>{text.choose}</Option>}
        {projects?.map(item => <Option key={item.id} value={item.id}>{item.name}</Option>)}
      </Select>
    </div>
    {create && (create.href != null
      ? (LinkComponent
        ? <LinkComponent href={create.href} className="t98-switcher__create" aria-label={createName}>{createContent}</LinkComponent>
        : <a href={create.href} className="t98-switcher__create" aria-label={createName}>{createContent}</a>)
      : <button type="button" className="t98-switcher__create" aria-label={createName} disabled={disabled} onClick={create.onSelect}>{createContent}</button>)}
  </div>;
}

export interface SearchFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Hides the label visually; it stays in the accessibility tree. */
  hideLabel?: boolean;
  /** Display-only keyboard hint such as "/"; the application registers the shortcut itself. */
  shortcut?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Result count or message, announced politely from a region that exists before any text. */
  status?: ReactNode;
  onClear?: () => void;
  clearLabel?: string;
  variant?: 'topbar' | 'inline';
}

export function SearchField({ label, value, onValueChange, placeholder, hideLabel = false, shortcut, inputRef, status, onClear, clearLabel = 'Clear search', variant = 'inline' }: SearchFieldProps) {
  const id = useId();
  const showClear = Boolean(onClear && value);
  return <div className={cx('t98-search-field', `t98-search-field--${variant}`)}>
    <label className={cx('t98-search-field__label', hideLabel && 't98-visually-hidden')} htmlFor={`${id}-input`}>{label}</label>
    <div className="t98-search-field__control">
      <Icon name="search" size={17} className="t98-search-field__icon" aria-hidden="true" />
      <Input id={`${id}-input`} ref={inputRef} type="search" className="t98-search-field__input" value={value} placeholder={placeholder} autoComplete="off" onChange={event => onValueChange(event.target.value)} />
      {showClear
        ? <button type="button" className="t98-search-field__clear" aria-label={clearLabel} onClick={onClear}><Icon name="x" size={16} aria-hidden="true" /></button>
        : shortcut && !value && <kbd className="t98-search-field__shortcut" aria-hidden="true">{shortcut}</kbd>}
    </div>
    <div role="status" className="t98-search-field__status">{status}</div>
  </div>;
}

/** Drawer state shared from `AppShell` (when given `navigation`) with `AppTopbar`. Internal to the shell. */
export interface AppShellNavigationState {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  sidebarId: string;
}
/** @internal Provided by `AppShell`; applications use `AppTopbar` instead. */
export const appShellNavigation = createContext<AppShellNavigationState | null>(null);

export type ShellAction = { label: string; icon?: IconName } & ({ href: string; onSelect?: never } | { onSelect: () => void; href?: never });

function ShellActionControl({ action, className, linkComponent: LinkComponent }: { action: ShellAction; className: string; linkComponent?: NavLinkComponent }) {
  const content = <>{action.icon && <Icon name={action.icon} size={16} aria-hidden="true" />}<span>{action.label}</span></>;
  if (action.href == null) return <button type="button" className={className} onClick={action.onSelect}>{content}</button>;
  return LinkComponent
    ? <LinkComponent href={action.href} className={className}>{content}</LinkComponent>
    : <a href={action.href} className={className}>{content}</a>;
}

export interface AppTopbarProps {
  breadcrumb: { icon?: IconName; scope?: string; current: string };
  breadcrumbLabel?: string;
  /** Shows the menu button that opens the drawer; needs `AppShell navigation`. Hidden on desktop. */
  /** Shows the drawer toggle. It renders only inside an `AppShell` with `navigation`, which owns the drawer state. */
  menuToggle?: boolean;
  menuLabel?: string;
  search?: ReactNode;
  badge?: { label: string; hideOnMobile?: boolean };
  actions?: ReactNode;
}

/** Top bar content for `AppShell topbar`: breadcrumb, drawer toggle, search, badge and actions. */
export function AppTopbar({ breadcrumb, breadcrumbLabel = 'Breadcrumb', menuToggle = false, menuLabel = 'Open navigation', search, badge, actions }: AppTopbarProps) {
  const shell = useContext(appShellNavigation);
  return <div className="t98-app-topbar">
    {menuToggle && shell && <button type="button" ref={shell.triggerRef} className="t98-app-topbar__menu" aria-label={menuLabel} aria-controls={shell.sidebarId} aria-expanded={shell.open} onClick={() => shell.setOpen(!shell.open)}><Icon name="menu" size={20} aria-hidden="true" /></button>}
    <nav aria-label={breadcrumbLabel} className="t98-app-topbar__breadcrumb">
      <ol className="t98-app-topbar__crumbs">
        {(breadcrumb.icon || breadcrumb.scope) && <>
          <li className="t98-app-topbar__crumb">
            {breadcrumb.icon && <Icon name={breadcrumb.icon} size={17} aria-hidden="true" />}
            {breadcrumb.scope && <span className="t98-app-topbar__scope">{breadcrumb.scope}</span>}
          </li>
          <li className="t98-app-topbar__separator" aria-hidden="true"><Icon name="chevron-right" size={14} /></li>
        </>}
        <li className="t98-app-topbar__crumb t98-app-topbar__current" aria-current="page">{breadcrumb.current}</li>
      </ol>
    </nav>
    {search && <div className="t98-app-topbar__search">{search}</div>}
    {badge && <Badge className={cx('t98-app-topbar__badge', badge.hideOnMobile && 't98-app-topbar__badge--hide-mobile')}>{badge.label}</Badge>}
    {actions && <div className="t98-app-topbar__actions">{actions}</div>}
  </div>;
}

export type BannerTone = 'sample' | 'info' | 'success' | 'warning' | 'danger';
export interface BannerProps {
  tone?: BannerTone;
  /** Short uppercase tag before the title, for example "Sample". */
  pill?: string;
  title?: string;
  children?: ReactNode;
  icon?: IconName;
  action?: ShellAction;
  linkComponent?: NavLinkComponent;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Announces the banner politely when it appears or changes. */
  live?: boolean;
}

/** Full-width notice above the page content. */
export function Banner({ tone = 'info', pill, title, children, icon, action, linkComponent, onDismiss, dismissLabel = 'Dismiss', live = false }: BannerProps) {
  return <div className={cx('t98-banner', `t98-banner--${tone}`)} role={live ? 'status' : undefined}>
    {icon && <Icon name={icon} size={18} className="t98-banner__icon" aria-hidden="true" />}
    <div className="t98-banner__body">
      {pill && <span className="t98-banner__pill">{pill}</span>}
      {title && <strong className="t98-banner__title">{title}</strong>}
      {children != null && <span className="t98-banner__text">{children}</span>}
    </div>
    {action && <ShellActionControl action={action} className="t98-banner__action" linkComponent={linkComponent} />}
    {onDismiss && <button type="button" className="t98-banner__dismiss" aria-label={dismissLabel} onClick={onDismiss}><Icon name="x" size={16} aria-hidden="true" /></button>}
  </div>;
}

export interface SidebarStatusProps {
  tone: 'connected' | 'idle';
  label: string;
  action?: ShellAction;
  linkComponent?: NavLinkComponent;
}

/** Connection status line for the `SidebarFooter` slot. The dot is decorative; the label carries the meaning. */
export function SidebarStatus({ tone, label, action, linkComponent }: SidebarStatusProps) {
  return <div className={cx('t98-sidebar-status', `t98-sidebar-status--${tone}`)}>
    <span className="t98-sidebar-status__dot" aria-hidden="true" />
    <span className="t98-sidebar-status__label">{label}</span>
    {action && <ShellActionControl action={action} className="t98-sidebar-status__action" linkComponent={linkComponent} />}
  </div>;
}
