'use client';

import { useId, type ComponentType, type ReactNode, type Ref } from 'react';
import { Badge, Icon, Input, Select, cx, type IconName, type Tone } from './primitives.js';
import { Option, VisuallyHidden } from './structure.js';

/* Presentation for application navigation. Routing, authorization, data loading and draft guards stay in the app. */

/** Router link contract shared with `Link.component`, plus the attributes navigation needs.
 * With a linkComponent, `href` is a key the application resolves (for example a route id), not necessarily a URL. */
export type NavLinkComponent = ComponentType<{ href: string; className?: string; children?: ReactNode; 'aria-current'?: 'page'; onClick?: () => void }>;

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
export type SidebarNavItem = NavItemBase & ({ href: string; onSelect?: never } | { onSelect: () => void; href?: never });
export interface SidebarNavGroup { id: string; label?: string; items: SidebarNavItem[] }
export interface SidebarNavProps {
  /** Accessible name of the navigation landmark. */
  label: string;
  groups: SidebarNavGroup[];
  /** Renders `href` items, for example a TanStack Router link. `href` is then a key your component resolves. */
  linkComponent?: NavLinkComponent;
  /** Case-insensitive match on label and keywords; other items get the `hidden` attribute. */
  filter?: string;
  /** Called after the item's own handler, for example to close a mobile drawer. */
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
  const visible = groups.map(group => group.items.filter(item => matches(item, query)).length);
  const nothing = visible.every(count => count === 0);
  return <nav aria-label={label} className="t98-sidebar-nav">
    {groups.map((group, index) => {
      const headingId = `${baseId}-${group.id}`;
      return <div key={group.id} className="t98-sidebar-nav__group" hidden={visible[index] === 0}>
        {group.label && <p id={headingId} className="t98-sidebar-nav__heading">{group.label}</p>}
        <ul className="t98-sidebar-nav__list" aria-labelledby={group.label ? headingId : undefined}>
          {group.items.map(item => {
            const aria = item.current ? 'page' as const : undefined;
            const select = () => { item.onSelect?.(); onNavigate?.(item); };
            let control: ReactNode;
            if (item.disabled) control = <span className="t98-sidebar-nav__item" aria-disabled="true" aria-current={aria}><NavItemContent item={item} /></span>;
            else if (item.href != null) {
              control = LinkComponent
                ? <LinkComponent href={item.href} className="t98-sidebar-nav__item" aria-current={aria} onClick={select}><NavItemContent item={item} /></LinkComponent>
                : <a href={item.href} className="t98-sidebar-nav__item" aria-current={aria} onClick={select}><NavItemContent item={item} /></a>;
            } else control = <button type="button" className="t98-sidebar-nav__item" aria-current={aria} onClick={select}><NavItemContent item={item} /></button>;
            return <li key={item.id} className="t98-sidebar-nav__entry" hidden={!matches(item, query)}>{control}</li>;
          })}
        </ul>
      </div>;
    })}
    {query && nothing && emptyFilter && <div className="t98-sidebar-nav__empty">{emptyFilter(filter.trim())}</div>}
  </nav>;
}

export interface WorkspaceOption { id: string; name: string; roleLabel?: string }
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
      <Select id={`${id}-workspace`} value={workspace?.id ?? ''} disabled={disabled} aria-describedby={workspace?.roleLabel ? `${id}-role` : undefined} onChange={event => onWorkspaceChange(event.target.value)}>
        {!workspace && <Option value="" disabled>{text.workspace}</Option>}
        {workspaces.map(item => <Option key={item.id} value={item.id}>{item.name}</Option>)}
      </Select>
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
