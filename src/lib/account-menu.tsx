'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Avatar, Icon, cx, type IconName } from './primitives.js';
import type { NavLinkComponent } from './shell.js';

function isUnavailable(element: Element) {
  return element.matches(':disabled') || Boolean(element.closest('[aria-disabled="true"], [aria-busy="true"]'));
}

export type AccountMenuItem = { id: string } & (
  | { kind: 'link'; label: string; href: string; icon?: IconName; danger?: boolean; disabled?: boolean; busy?: boolean; busyLabel?: string }
  | { kind: 'button'; label: string; onSelect: () => void; icon?: IconName; danger?: boolean; disabled?: boolean; busy?: boolean; busyLabel?: string }
  | { kind: 'separator' });

function AccountMenuItems({ items, linkComponent: LinkComponent }: { items: AccountMenuItem[]; linkComponent?: NavLinkComponent }) {
  return <>{items.map(item => {
    if (item.kind === 'separator') return <hr key={item.id} className="t98-account-menu__separator" />;
    const className = cx('t98-account-menu__item', item.danger && 't98-account-menu__item--danger');
    const content = <>{item.icon && <Icon name={item.icon} size={17} aria-hidden="true" />}<span>{item.busy ? item.busyLabel ?? item.label : item.label}</span></>;
    const unavailable = item.disabled || item.busy;
    if (item.kind === 'button') return <button key={item.id} type="button" className={className} disabled={unavailable} aria-busy={item.busy || undefined} onClick={item.onSelect}>{content}</button>;
    // A link has no native disabled state; without an href it is neither focusable nor navigable.
    if (unavailable) return <a key={item.id} role="link" className={className} aria-disabled="true" aria-busy={item.busy || undefined}>{content}</a>;
    return LinkComponent
      ? <LinkComponent key={item.id} href={item.href} className={className}>{content}</LinkComponent>
      : <a key={item.id} href={item.href} className={className}>{content}</a>;
  })}</>;
}

export interface AccountMenuProps {
  name: string;
  email?: string;
  avatar?: ReactNode;
  /** Declarative links, buttons and separators; the preferred way to fill the menu. */
  items?: AccountMenuItem[];
  /** Renders `link` items; `href` is then a key your component resolves. */
  linkComponent?: NavLinkComponent;
  /** @deprecated Prefer `items`. Still renders native app elements after `items`. */
  children?: ReactNode;
  label?: string;
  defaultOpen?: boolean;
}

/** A nonmodal disclosure; applications own its links, forms and account actions. */
export function AccountMenu({ name, email, avatar, items, linkComponent, children, label = 'Account menu', defaultOpen = false }: AccountMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = `t98-account-${useId()}`;

  useEffect(() => {
    if (!open || !rootRef.current) return;
    const root = rootRef.current;
    const doc = root.ownerDocument;
    const dismissOutside = (event: Event) => {
      if (event.target && !root.contains(event.target as Node)) setOpen(false);
    };
    doc.addEventListener('pointerdown', dismissOutside);
    doc.addEventListener('focusin', dismissOutside);
    return () => {
      doc.removeEventListener('pointerdown', dismissOutside);
      doc.removeEventListener('focusin', dismissOutside);
    };
  }, [open]);

  return <div className="t98-account-menu" ref={rootRef} onKeyDown={event => {
    if (!open || event.key !== 'Escape' || event.defaultPrevented ||
      !event.currentTarget.contains(event.target as Node) ||
      (event.target as Element).closest('dialog[open]')) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    triggerRef.current?.focus();
  }}>
    <button className="t98-account-menu__trigger" type="button" ref={triggerRef}
      aria-label={label} aria-expanded={open} aria-controls={panelId}
      onClick={() => setOpen(value => !value)}>
      <span className="t98-account-menu__avatar" aria-hidden="true">{avatar ?? <Avatar name={name} />}</span>
      <Icon name="chevron-down" size={14} strokeWidth={2} />
    </button>
    <div className="t98-account-menu__panel" id={panelId} hidden={!open}
      onClickCapture={event => {
        const action = (event.target as Element).closest('a[href], button');
        if (action && event.currentTarget.contains(action) && isUnavailable(action)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onClick={event => {
        const target = event.target as Element;
        const action = target.closest('a[href], button');
        if (!action || !event.currentTarget.contains(action) || isUnavailable(action)) return;
        // A submit click can fail native validation. Only a subsequent submit may close it.
        if (action.tagName === 'BUTTON' && (action as HTMLButtonElement).type === 'submit' &&
          (action as HTMLButtonElement).form) return;
        setOpen(false);
      }}
      onSubmitCapture={event => {
        const form = event.target as HTMLFormElement;
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (isUnavailable(form) || (submitter && isUnavailable(submitter))) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onSubmit={() => setOpen(false)}>
      <div className="t98-account-menu__identity">
        <strong>{name}</strong>
        {email && <span>{email}</span>}
      </div>
      <div className="t98-account-menu__actions">{items && <AccountMenuItems items={items} linkComponent={linkComponent} />}{children}</div>
    </div>
  </div>;
}

export interface SidebarFooterProps {
  version: string;
  children: ReactNode;
  className?: string;
}

/** Sidebar utility actions and the app's actual version, without a second profile. */
export function SidebarFooter({ version, children, className }: SidebarFooterProps) {
  return <footer className={cx('t98-sidebar-footer', className)}>
    <div className="t98-sidebar-footer__actions">{children}</div>
    <small className="t98-sidebar-footer__version">Version {version}</small>
  </footer>;
}
