'use client';

import { useEffect, useRef, useState, version, type CSSProperties, type RefObject } from 'react';

export interface SidebarNavigationOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sidebarRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  mediaQuery?: string;
}

/** Matches the shared stylesheet's mobile breakpoint. */
export const defaultSidebarMediaQuery = '(max-width:760px)';

/** Drawer behavior for an existing sidebar; applications retain navigation and draft guards. */
export function useSidebarNavigation({ open, onOpenChange, sidebarRef, triggerRef, mediaQuery = defaultSidebarMediaQuery }: SidebarNavigationOptions) {
  // The server and first client render agree; the stylesheet hides closed mobile navigation.
  const [mobile, setMobile] = useState(false);
  const current = useRef({ open, onOpenChange });
  useEffect(() => { current.current = { open, onOpenChange }; });
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(mediaQuery);
    const sync = () => {
      setMobile(media.matches);
      if (!media.matches && current.current.open) current.current.onOpenChange(false);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [mediaQuery]);

  const modal = mobile && open;
  // React 18 treats inert as an unknown attribute and needs an empty string; React 19
  // requires its boolean form. Keep the public props typed for current React DOM.
  const inert = (enabled: boolean) => (version.startsWith('18.') ? enabled ? '' : undefined : enabled) as boolean;
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!modal || !sidebar) return;
    const doc = sidebar.ownerDocument;
    const hasDialog = () => doc.querySelector('dialog:modal') !== null;
    const controls = () => Array.from(sidebar.querySelectorAll<HTMLElement>('a[href],area[href],button,input:not([type="hidden"]),select,textarea,summary,[tabindex],[contenteditable="true"]')).filter(node => {
      if (node.tabIndex < 0 || node.matches(':disabled') || node.closest('[hidden],[inert]') || !node.getClientRects().length) return false;
      if (doc.defaultView?.getComputedStyle(node).visibility !== 'visible') return false;
      for (let parent = node.parentElement; parent && parent !== sidebar; parent = parent.parentElement) {
        if (parent.matches('details:not([open])') && !parent.querySelector(':scope > summary')?.contains(node)) return false;
      }
      return true;
    });
    const focusFirst = () => { if (!hasDialog()) (controls()[0] || sidebar).focus(); };
    const keydown = (event: KeyboardEvent) => {
      // A modal native dialog owns Escape, Tab and focus restoration, including discard guards.
      if (event.defaultPrevented || hasDialog()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        current.current.onOpenChange(false);
      } else if (event.key === 'Tab') {
        const items = controls(), first = items[0], last = items.at(-1), active = doc.activeElement;
        if (!first || !sidebar.contains(active) || active === sidebar || (event.shiftKey ? active === first : active === last)) {
          event.preventDefault();
          (event.shiftKey ? last || sidebar : first || sidebar).focus();
        }
      }
    };
    const focusin = (event: FocusEvent) => { if (!sidebar.contains(event.target as Node)) focusFirst(); };
    const overflow = doc.body.style.overflow;
    doc.body.style.overflow = 'hidden';
    doc.addEventListener('keydown', keydown);
    doc.addEventListener('focusin', focusin);
    focusFirst();
    return () => {
      doc.removeEventListener('keydown', keydown);
      doc.removeEventListener('focusin', focusin);
      doc.body.style.overflow = overflow;
      const trigger = triggerRef.current;
      if (!hasDialog() && trigger?.isConnected && trigger.getClientRects().length && !trigger.closest('[hidden],[inert]') && (sidebar.contains(doc.activeElement) || doc.activeElement === doc.body)) trigger.focus();
    };
  }, [modal, sidebarRef, triggerRef]);

  return {
    modal,
    sidebarProps: {
      inert: inert(mobile && !open),
      role: modal ? 'dialog' as const : undefined,
      'aria-modal': modal || undefined,
      'data-sidebar-state': open ? 'open' : 'closed',
      tabIndex: -1,
      style: { visibility: mobile && !open ? 'hidden' : undefined } as CSSProperties,
    },
    contentProps: { inert: inert(modal) },
  };
}
