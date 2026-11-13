'use client';

import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { cx } from './primitives.js';

/* One command registry for menus, key hints, a command palette and a remappable keymap. Commands register with the
 * context (scope) they are rendered in; keymaps are app data. The registry listens once, on the document, after
 * widgets: a key a widget already handled (preventDefault) is never also a command. */

/** A key chord such as "Ctrl+S", "Mod+Enter", "F2" or "Alt+C". "Mod" is Command on Apple platforms and Ctrl elsewhere. */
export type KeyChord = string;
/** Command id → one or more chords. An empty list unbinds the command. */
export type Keymap = Readonly<Record<string, KeyChord | readonly KeyChord[]>>;
export type ShortcutPlatform = 'apple' | 'other';

const MODIFIERS = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const;
const MODIFIER_ALIASES: Record<string, (typeof MODIFIERS)[number] | 'Mod'> = {
  ctrl: 'Ctrl', control: 'Ctrl', alt: 'Alt', option: 'Alt', opt: 'Alt', shift: 'Shift',
  meta: 'Meta', cmd: 'Meta', command: 'Meta', super: 'Meta', win: 'Meta', mod: 'Mod',
};
const NAMED_KEYS = ['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'Insert', 'Space', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ContextMenu'];
const KEY_ALIASES: Record<string, string> = {
  esc: 'Escape', return: 'Enter', del: 'Delete', ins: 'Insert', spacebar: 'Space', ' ': 'Space',
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', pgup: 'PageUp', pgdn: 'PageDown',
  ...Object.fromEntries(NAMED_KEYS.map(key => [key.toLowerCase(), key])),
};
const FUNCTION_KEY = /^f([1-9]|1\d|2[0-4])$/i;
const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph', 'OS', 'CapsLock', 'Fn', 'FnLock', 'Hyper', 'Super', 'NumLock', 'ScrollLock']);
const NAVIGATION_KEYS = new Set(['Enter', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Backspace', 'Delete']);

function canonicalKey(raw: string): string | undefined {
  if (raw.length === 1) return raw === ' ' ? 'Space' : raw.toUpperCase();
  if (FUNCTION_KEY.test(raw)) return raw.toUpperCase();
  return KEY_ALIASES[raw.toLowerCase()];
}
function join(mods: ReadonlySet<string>, key: string) {
  return [...MODIFIERS.filter(mod => mods.has(mod)), key].join('+');
}

/** Normalises a chord to its canonical form ("ctrl+shift+s" → "Ctrl+Shift+S", "Mod+K" → "Meta+K" on Apple), or undefined when it is not a valid chord. */
export function parseChord(chord: KeyChord, platform: ShortcutPlatform = 'other'): KeyChord | undefined {
  const trimmed = chord.trim();
  // A trailing "+" names the plus key itself ("Ctrl++").
  const parts = trimmed.endsWith('++') ? [...trimmed.slice(0, -2).split('+'), '+'] : trimmed.split('+');
  const key = canonicalKey(parts.pop()?.trim() ?? '');
  if (!key) return undefined;
  const mods = new Set<string>();
  for (const part of parts) {
    const mod = MODIFIER_ALIASES[part.trim().toLowerCase()];
    if (!mod) return undefined;
    mods.add(mod === 'Mod' ? (platform === 'apple' ? 'Meta' : 'Ctrl') : mod);
  }
  return join(mods, key);
}

/** The keyboard-event fields the registry reads, so tests and adapters can pass plain objects. */
export interface ChordEvent {
  key: string;
  code?: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  isComposing?: boolean;
  keyCode?: number;
  getModifierState?: (key: string) => boolean;
}

/**
 * The canonical chord a keydown produces, or undefined when it must never run a command: IME composition, a lone
 * modifier, or a character typed with AltGr (reported by Windows and Linux as Ctrl+Alt). Letters and digits pressed
 * with Ctrl, Alt or Meta fall back to the physical key when the layout produces another character, so "Alt+C" works
 * on Arabic layouts and with the Apple Option key.
 */
export function chordFromEvent(event: ChordEvent, platform: ShortcutPlatform = 'other'): KeyChord | undefined {
  if (event.isComposing || event.keyCode === 229 || MODIFIER_KEYS.has(event.key)) return undefined;
  let { ctrlKey: ctrl, altKey: alt } = event;
  const altGraph = platform !== 'apple' && ctrl && alt && event.getModifierState?.('AltGraph') === true;
  const commandModifier = ctrl || alt || event.metaKey;
  let key: string | undefined;
  if ([...event.key].length === 1 && event.key !== ' ') {
    if (altGraph) return undefined;
    key = /^[a-z0-9]$/i.test(event.key) ? event.key.toUpperCase() : undefined;
    if (!key && commandModifier) key = physical(event.code);
    // Other printable characters already include Shift ("?" rather than "Shift+/").
    if (!key) return join(new Set([ctrl && 'Ctrl', alt && 'Alt', event.metaKey && 'Meta'].filter(Boolean) as string[]), event.key);
  } else if (event.key === 'Dead' || event.key === 'Unidentified') {
    key = commandModifier ? physical(event.code) : undefined;
  } else key = canonicalKey(event.key);
  if (!key) return undefined;
  if (altGraph) ctrl = alt = false;
  return join(new Set([ctrl && 'Ctrl', alt && 'Alt', event.shiftKey && 'Shift', event.metaKey && 'Meta'].filter(Boolean) as string[]), key);
}
function physical(code = '') {
  return /^Key[A-Z]$/.test(code) ? code.slice(3) : /^Digit\d$/.test(code) ? code.slice(5) : undefined;
}

/** Splits a canonical chord into its modifiers and key ("Ctrl++" → ["Ctrl"], "+"). */
function splitChord(chord: KeyChord): [string[], string] {
  const parts = chord === '+' || chord.endsWith('++') ? [...chord.slice(0, -1).split('+').filter(Boolean), '+'] : chord.split('+');
  return [parts.slice(0, -1), parts.at(-1)!];
}
/** True when the chord types a character: no Ctrl, Alt or Meta, and a character or Space as its key. */
export function isPrintableChord(chord: KeyChord) {
  const [mods, key] = splitChord(chord);
  return mods.every(mod => mod === 'Shift') && (key.length === 1 || key === 'Space');
}

/** Merges keymaps left to right: a later map replaces a command's chords, and an empty list unbinds it. */
export function mergeKeymaps(...maps: readonly (Keymap | undefined)[]): Record<string, readonly KeyChord[]> {
  const merged: Record<string, readonly KeyChord[]> = {};
  for (const map of maps) for (const [id, chords] of Object.entries(map ?? {})) merged[id] = typeof chords === 'string' ? [chords] : chords;
  return merged;
}

export type ReservedChordKind = 'reserved' | 'browser';
export interface ReservedChord {
  /** reserved: the browser or OS keeps the chord and a page never receives it. browser: the page receives it, but it replaces a well-known browser action. */
  kind: ReservedChordKind;
  reason: string;
}
const reserve = (kind: ReservedChordKind, reason: string, chords: string[]) => chords.map(chord => [chord, { kind, reason }] as const);
const RESERVED: Record<ShortcutPlatform, ReadonlyMap<string, ReservedChord>> = {
  other: new Map([
    ...reserve('reserved', 'Opens a new window.', ['Ctrl+N', 'Ctrl+Shift+N']),
    ...reserve('reserved', 'Opens or reopens a tab.', ['Ctrl+T', 'Ctrl+Shift+T']),
    ...reserve('reserved', 'Closes the tab or window.', ['Ctrl+W', 'Ctrl+Shift+W', 'Ctrl+F4', 'Alt+F4']),
    ...reserve('reserved', 'Switches tabs.', ['Ctrl+Tab', 'Ctrl+Shift+Tab', 'Ctrl+PageUp', 'Ctrl+PageDown']),
    ...reserve('reserved', 'Toggles full screen.', ['F11']),
    ...reserve('browser', 'Opens browser help.', ['F1']),
    ...reserve('browser', 'Finds in the page.', ['F3', 'Shift+F3', 'Ctrl+F', 'Ctrl+G', 'Ctrl+Shift+G']),
    ...reserve('browser', 'Reloads the page.', ['F5', 'Ctrl+F5', 'Shift+F5', 'Ctrl+R', 'Ctrl+Shift+R']),
    ...reserve('browser', 'Moves focus to the address bar or browser toolbar.', ['F6', 'Shift+F6', 'Ctrl+L', 'Alt+D', 'Ctrl+E', 'Ctrl+K']),
    ...reserve('browser', 'Toggles caret browsing.', ['F7']),
    ...reserve('browser', 'Opens the browser menu bar.', ['F10', 'Alt+F', 'Alt+E']),
    ...reserve('browser', 'Opens developer tools.', ['F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C', 'Ctrl+U']),
    ...reserve('browser', 'Opens a browser panel (history, downloads, bookmarks).', ['Ctrl+H', 'Ctrl+J', 'Ctrl+D', 'Ctrl+Shift+B', 'Ctrl+Shift+O', 'Ctrl+Shift+Delete']),
    ...reserve('browser', 'Saves, opens or prints the page.', ['Ctrl+S', 'Ctrl+O', 'Ctrl+P']),
    ...reserve('browser', 'Zooms the page.', ['Ctrl+=', 'Ctrl++', 'Ctrl+-', 'Ctrl+0']),
    ...reserve('browser', 'Goes back, forward or home.', ['Alt+ArrowLeft', 'Alt+ArrowRight', 'Alt+Home']),
  ]),
  apple: new Map([
    ...reserve('reserved', 'Opens a new window.', ['Meta+N', 'Meta+Shift+N']),
    ...reserve('reserved', 'Opens or reopens a tab.', ['Meta+T', 'Meta+Shift+T']),
    ...reserve('reserved', 'Closes the tab or window.', ['Meta+W', 'Meta+Shift+W']),
    ...reserve('reserved', 'Quits, hides or minimises the browser.', ['Meta+Q', 'Meta+H', 'Meta+M', 'Meta+Alt+H']),
    ...reserve('reserved', 'Switches applications or tabs.', ['Meta+Tab', 'Ctrl+Tab', 'Ctrl+Shift+Tab', 'Meta+Alt+ArrowLeft', 'Meta+Alt+ArrowRight']),
    ...reserve('reserved', 'Toggles full screen.', ['Ctrl+Meta+F']),
    ...reserve('browser', 'Finds in the page.', ['Meta+F', 'Meta+G', 'Meta+Shift+G']),
    ...reserve('browser', 'Reloads the page.', ['Meta+R', 'Meta+Shift+R']),
    ...reserve('browser', 'Moves focus to the address bar.', ['Meta+L', 'Meta+K']),
    ...reserve('browser', 'Opens developer tools or the page source.', ['Meta+Alt+I', 'Meta+Alt+J', 'Meta+Alt+C', 'Meta+Alt+U']),
    ...reserve('browser', 'Opens a browser panel (history, downloads, bookmarks).', ['Meta+Y', 'Meta+Shift+J', 'Meta+D', 'Meta+Shift+B', 'Meta+Alt+B']),
    ...reserve('browser', 'Saves, opens or prints the page.', ['Meta+S', 'Meta+O', 'Meta+P']),
    ...reserve('browser', 'Zooms the page.', ['Meta+=', 'Meta++', 'Meta+-', 'Meta+0']),
    ...reserve('browser', 'Goes back or forward.', ['Meta+[', 'Meta+]', 'Meta+ArrowLeft', 'Meta+ArrowRight']),
  ]),
};

/** Whether browsers keep this chord from the page or use it for their own toolbar, so an app can warn and offer an alternate. */
export function reservedChord(chord: KeyChord, platform: ShortcutPlatform = 'other'): ReservedChord | undefined {
  const canonical = parseChord(chord, platform);
  return canonical ? RESERVED[platform].get(canonical) : undefined;
}
/** Every chord in a keymap that browsers reserve or use themselves. */
export function findReservedChords(keymap: Keymap, platform: ShortcutPlatform = 'other') {
  return Object.entries(mergeKeymaps(keymap)).flatMap(([command, chords]) => chords.flatMap(chord => {
    const found = reservedChord(chord, platform);
    return found ? [{ command, chord, ...found }] : [];
  }));
}

/** A registered command as the pure resolver and conflict finder see it. */
export interface ResolvedCommand {
  id: string;
  /** The scope instance the command is registered in; "" is the provider (application) scope. */
  scope: string;
  chords: readonly KeyChord[];
  enabled: boolean;
  allowInTextInput?: boolean;
  repeat?: boolean;
}

/** Lists chords bound to more than one enabled command in the same scope. */
export function findChordConflicts(commands: readonly ResolvedCommand[]) {
  const seen = new Map<string, string[]>();
  for (const command of commands) if (command.enabled) for (const chord of new Set(command.chords)) {
    const key = `${command.scope}\u0000${chord}`;
    seen.set(key, [...(seen.get(key) ?? []), command.id]);
  }
  return [...seen].filter(([, ids]) => ids.length > 1).map(([key, commands]) => {
    const [scope, chord] = key.split('\u0000');
    return { scope, chord, commands };
  });
}

/** What the focused element does with keys natively. text: a single-line text field; multiline: textarea or contenteditable; control: buttons, links, checkboxes, selects and similar. */
export type ShortcutTarget = 'text' | 'multiline' | 'control' | 'other';
export interface ShortcutResolveInput {
  chord: KeyChord;
  /** Active scopes, innermost first. `focus` is true for a focus-activated scope that contains the focused element. */
  scopes: readonly { id: string; focus: boolean }[];
  commands: readonly ResolvedCommand[];
  target: ShortcutTarget;
  repeat?: boolean;
}

/**
 * The command a chord runs, or undefined. The innermost scope that binds the chord wins; a disabled command there
 * still claims it, so an outer command never runs in its place. Keys the focused element uses itself (typing,
 * caret and list movement, Enter in a textarea, Enter and Space on buttons) stay with it unless the command opts in
 * with allowInTextInput (never on buttons and other controls), and chords that only type characters run only in a
 * focus-activated scope that contains focus (WCAG 2.1.4).
 */
export function resolveShortcut({ chord, scopes, commands, target, repeat = false }: ShortcutResolveInput): ResolvedCommand | undefined {
  const [mods, key] = splitChord(chord);
  const printable = isPrintableChord(chord);
  const native = mods.every(mod => mod === 'Shift') && (printable || NAVIGATION_KEYS.has(key));
  for (const scope of scopes) {
    const command = commands.find(candidate => candidate.scope === scope.id && candidate.chords.includes(chord));
    if (!command) continue;
    if (!command.enabled || (repeat && !command.repeat)) return undefined;
    if (printable && !scope.focus) return undefined;
    if (native) {
      // Buttons, links, checkboxes and selects keep Enter, Space and arrows; text fields keep typing and caret keys, single-line ones not Enter.
      if (target === 'control' && NAVIGATION_KEYS.has(key)) return undefined;
      if (!command.allowInTextInput && (target === 'multiline' || (target === 'text' && key !== 'Enter'))) return undefined;
    }
    return command;
  }
  return undefined;
}

export interface ChordLabel {
  /** Visible key caps, for example ["Ctrl", "S"] or ["⌘", "S"]. */
  keys: string[];
  /** Spoken form, for example "Control+S" or "Command+S". */
  text: string;
}
const APPLE_SYMBOLS: Record<string, [string, string]> = { Ctrl: ['⌃', 'Control'], Alt: ['⌥', 'Option'], Shift: ['⇧', 'Shift'], Meta: ['⌘', 'Command'] };
const OTHER_NAMES: Record<string, [string, string]> = { Ctrl: ['Ctrl', 'Control'], Alt: ['Alt', 'Alt'], Shift: ['Shift', 'Shift'], Meta: ['Win', 'Windows'] };
const KEY_NAMES: Record<string, [string, string]> = {
  Escape: ['Esc', 'Escape'], ArrowUp: ['↑', 'Up arrow'], ArrowDown: ['↓', 'Down arrow'], ArrowLeft: ['←', 'Left arrow'], ArrowRight: ['→', 'Right arrow'],
  PageUp: ['PgUp', 'Page up'], PageDown: ['PgDn', 'Page down'], Delete: ['Del', 'Delete'], Insert: ['Ins', 'Insert'], ContextMenu: ['Menu', 'Menu'],
  '+': ['+', 'Plus'], '-': ['-', 'Minus'], '=': ['=', 'Equals'],
};
/** Platform labels for a chord: symbols on Apple platforms, names elsewhere. */
export function formatChord(chord: KeyChord, platform: ShortcutPlatform = 'other'): ChordLabel {
  const [parts, key] = splitChord(parseChord(chord, platform) ?? chord);
  const names = platform === 'apple' ? APPLE_SYMBOLS : OTHER_NAMES;
  const mods = parts.map(mod => names[mod] ?? [mod, mod]);
  const [keyLabel, keyText] = KEY_NAMES[key] ?? (platform === 'apple' && key === 'Enter' ? ['↩', 'Return'] : platform === 'apple' && key === 'Backspace' ? ['⌫', 'Delete'] : [key, key]);
  return { keys: [...mods.map(([label]) => label), keyLabel], text: [...mods.map(([, text]) => text), keyText].join('+') };
}

function detectPlatform(): ShortcutPlatform {
  const nav = globalThis.navigator as (Navigator & { userAgentData?: { platform?: string } }) | undefined;
  return /mac|iphone|ipad|ipod/i.test(nav?.userAgentData?.platform || nav?.platform || '') ? 'apple' : 'other';
}
const isDevelopment = () => (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production';

export interface CommandOptions {
  /** Stable id that keymaps bind, for example "voucher.save". */
  id: string;
  /** Human label for menus, the help list and a command palette. */
  label: string;
  /** Optional heading for help lists and palettes. */
  group?: string;
  run: () => void;
  /** A disabled command still claims its chord in its scope, but does nothing. Defaults to true. */
  enabled?: boolean;
  /** Chords used when the active keymap does not bind this id. */
  keys?: KeyChord | readonly KeyChord[];
  /** Run while the user types in a text field even though the chord types or edits text there (Enter in a textarea, a letter, arrows). */
  allowInTextInput?: boolean;
  /** Run again while the key is held. Defaults to false. */
  repeat?: boolean;
}
export interface ShortcutCommand {
  id: string;
  label: string;
  group?: string;
  /** Name of the scope the command is registered in; undefined for the application scope. */
  scope?: string;
  enabled: boolean;
  /** Canonical chords from the merged keymap, in keymap order. */
  keys: readonly KeyChord[];
  /** Runs the command, for example from a menu or palette. Does nothing while disabled. */
  run: () => void;
}

interface ScopeRecord { name: string; activation: 'mounted' | 'focus' }
interface CommandRecord extends Omit<CommandOptions, 'keys'> { uid: string; scope: string; defaults: readonly KeyChord[] }

const SCOPE_ATTRIBUTE = 'data-t98-shortcut-scope';
// Focus inside one of these limits commands to the scopes inside it.
const MODAL_ATTRIBUTE = 'data-t98-shortcut-modal';
const BARRIERS = `dialog, [popover], [role="dialog"], [role="alertdialog"], [${MODAL_ATTRIBUTE}]`;
const TEXT_TYPES = new Set(['', 'text', 'search', 'email', 'url', 'tel', 'password', 'number', 'date', 'datetime-local', 'month', 'time', 'week']);

function targetKind(element: Element | null): ShortcutTarget {
  if (!element) return 'other';
  if (element instanceof HTMLTextAreaElement || (element as HTMLElement).isContentEditable) return 'multiline';
  if (element instanceof HTMLInputElement) return TEXT_TYPES.has(element.type) ? 'text' : 'control';
  if (element.matches('button, a[href], summary, select, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="slider"], [role="spinbutton"], [role="treeitem"]')) return 'control';
  if (element.matches('[role="textbox"], [role="searchbox"]')) return 'text';
  return 'other';
}

class ShortcutStore {
  scopes = new Map<string, ScopeRecord>();
  commands = new Map<string, CommandRecord>();
  keymap: Record<string, readonly KeyChord[]> = {};
  platform: ShortcutPlatform = 'other';
  private listeners = new Set<() => void>();
  private snapshot: ShortcutCommand[] = [];
  private dirty = true;
  private warned = new Set<string>();
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => {
    if (this.dirty) {
      this.dirty = false;
      this.snapshot = [...this.commands.values()].map(record => ({
        id: record.id, label: record.label, group: record.group, scope: this.scopes.get(record.scope)?.name,
        enabled: record.enabled !== false, keys: this.chordsFor(record), run: () => { if (record.enabled !== false) record.run(); },
      }));
    }
    return this.snapshot;
  };
  changed() {
    this.dirty = true;
    for (const listener of this.listeners) listener();
    if (isDevelopment()) this.reportConflicts();
  }
  chordsFor(record: CommandRecord): KeyChord[] {
    const chords = this.keymap[record.id] ?? record.defaults;
    return chords.flatMap(chord => {
      const canonical = parseChord(chord, this.platform);
      if (!canonical && isDevelopment()) this.warnOnce(`chord:${chord}`, `@ten98/ui shortcuts: "${chord}" for ${record.id} is not a valid key chord.`);
      return canonical ? [canonical] : [];
    });
  }
  resolved(): ResolvedCommand[] {
    return [...this.commands.values()].map(record => ({ id: record.uid, scope: record.scope, chords: this.chordsFor(record), enabled: record.enabled !== false, allowInTextInput: record.allowInTextInput, repeat: record.repeat }));
  }
  private reportConflicts() {
    for (const conflict of findChordConflicts(this.resolved())) {
      const ids = conflict.commands.map(uid => this.commands.get(uid)?.id).join(', ');
      this.warnOnce(`conflict:${conflict.scope}:${conflict.chord}:${ids}`, `@ten98/ui shortcuts: ${conflict.chord} is bound to ${ids} in the ${this.scopes.get(conflict.scope)?.name ?? 'application'} scope; only the first runs.`);
    }
  }
  private warnOnce(key: string, message: string) {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(message);
  }
  /** Active scopes for a focused element, innermost first. */
  activeScopes(target: Element | null): { id: string; focus: boolean }[] {
    const path: { id: string; focus: boolean }[] = [];
    for (let node = target; node; node = node.parentElement) {
      const id = node.getAttribute(SCOPE_ATTRIBUTE);
      const scope = id !== null ? this.scopes.get(id) : undefined;
      if (id !== null && scope) path.push({ id, focus: scope.activation === 'focus' });
      if (node.hasAttribute(MODAL_ATTRIBUTE)) return path;
      if (node.matches(BARRIERS) && !(node.matches('[popover]') && !node.matches(':popover-open'))) {
        // A modal scope wrapping the dialog owns it, wherever focus is inside the dialog.
        const owner = node.parentElement?.closest(`[${SCOPE_ATTRIBUTE}]`);
        const ownerId = owner?.hasAttribute(MODAL_ATTRIBUTE) ? owner.getAttribute(SCOPE_ATTRIBUTE)! : undefined;
        if (ownerId && this.scopes.has(ownerId)) path.push({ id: ownerId, focus: false });
        return path;
      }
    }
    const modal = document.querySelector('dialog:modal');
    if (modal && !(target && modal.contains(target))) return [];
    // Mounted scopes stay active wherever focus is, deeper ones first, except inside dialogs, popovers and hidden content.
    const mounted = [...document.querySelectorAll(`[${SCOPE_ATTRIBUTE}]`)].flatMap(element => {
      const id = element.getAttribute(SCOPE_ATTRIBUTE)!;
      const scope = this.scopes.get(id);
      if (!scope || scope.activation !== 'mounted' || element.hasAttribute(MODAL_ATTRIBUTE) || path.some(entry => entry.id === id) || element.parentElement?.closest(`${BARRIERS}, [hidden], [inert]`)) return [];
      let depth = 0;
      for (let node = element.parentElement?.closest(`[${SCOPE_ATTRIBUTE}]`); node; node = node.parentElement?.closest(`[${SCOPE_ATTRIBUTE}]`)) depth++;
      return [{ id, depth }];
    }).sort((a, b) => b.depth - a.depth);
    return [...path, ...mounted.map(({ id }) => ({ id, focus: false })), { id: '', focus: false }];
  }
  handleKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    const chord = chordFromEvent(event, this.platform);
    if (!chord) return;
    const target = event.target instanceof Element ? event.target : document.activeElement;
    const match = resolveShortcut({ chord, scopes: this.activeScopes(target), commands: this.resolved(), target: targetKind(target), repeat: event.repeat });
    const record = match && this.commands.get(match.id);
    if (!record) return;
    event.preventDefault();
    record.run();
  };
}

const StoreContext = createContext<ShortcutStore | null>(null);
const ScopeContext = createContext('');

export interface ShortcutProviderProps {
  /** Named keymaps supplied by the app, for example { classic, 'web-safe' }. */
  keymaps?: Readonly<Record<string, Keymap>>;
  /** Name of the active keymap. Defaults to the first one. */
  keymap?: string;
  /** The user's own bindings, merged over the active keymap. */
  overrides?: Keymap;
  /** Defaults to detection after mount (Apple platforms show ⌘ and resolve Mod to Command). */
  platform?: ShortcutPlatform;
  children: ReactNode;
}
/** Holds the command registry for the app and listens for its chords on the document. Mount once, near the root. */
export function ShortcutProvider({ keymaps = {}, keymap, overrides, platform, children }: ShortcutProviderProps) {
  const base = keymaps[keymap ?? Object.keys(keymaps)[0]];
  // Children register their commands before this provider's effects run, so the first keymap is set up front.
  const [store] = useState(() => Object.assign(new ShortcutStore(), { keymap: mergeKeymaps(base, overrides), platform: platform ?? 'other' }));
  const [detected, setDetected] = useState<ShortcutPlatform>('other');
  useEffect(() => { if (!platform) setDetected(detectPlatform()); }, [platform]);
  const active = platform ?? detected;
  useEffect(() => {
    store.keymap = mergeKeymaps(base, overrides);
    store.platform = active;
    store.changed();
  }, [store, base, overrides, active]);
  useEffect(() => {
    document.addEventListener('keydown', store.handleKeyDown);
    return () => document.removeEventListener('keydown', store.handleKeyDown);
  }, [store]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export interface ShortcutScopeProps {
  /** Context name for help lists and development warnings, for example "Voucher entry". */
  name: string;
  /** mounted: active while rendered (screens). focus: active only while focus is inside (an entry grid, an open list). Defaults to mounted. */
  activation?: 'mounted' | 'focus';
  /**
   * Active only while focus is inside it, and then no outer command runs. Wrap a Dialog or Popover in a modal scope to give it
   * commands that work wherever focus is in it; without one, focus in a dialog or popover runs only scopes inside it.
   */
  modal?: boolean;
  children: ReactNode;
}
/**
 * A nested shortcut context. Commands registered by descendants belong to it; the innermost active scope that binds a
 * chord wins. Renders a wrapper with display: contents, so it adds no box to the layout.
 */
export function ShortcutScope({ name, activation = 'mounted', modal = false, children }: ShortcutScopeProps) {
  const store = useContext(StoreContext);
  const id = useId();
  useEffect(() => {
    if (!store) return;
    store.scopes.set(id, { name, activation });
    store.changed();
    return () => { store.scopes.delete(id); store.changed(); };
  }, [store, id, name, activation]);
  return <div {...{ [SCOPE_ATTRIBUTE]: id }} {...(modal && { [MODAL_ATTRIBUTE]: '' })} style={{ display: 'contents' }}>
    <ScopeContext.Provider value={id}>{children}</ScopeContext.Provider>
  </div>;
}

/** Registers a command in the nearest ShortcutScope (or the application scope) while the component is mounted. Does nothing outside a ShortcutProvider. */
export function useCommand({ id, label, group, run, enabled = true, keys, allowInTextInput = false, repeat = false }: CommandOptions) {
  const store = useContext(StoreContext);
  const scope = useContext(ScopeContext);
  const uid = useId();
  const handler = useRef(run);
  useEffect(() => { handler.current = run; });
  const defaults = typeof keys === 'string' ? keys : (keys ?? []).join('\n');
  useEffect(() => {
    if (!store) return;
    store.commands.set(uid, { uid, id, label, group, scope, enabled, allowInTextInput, repeat, run: () => handler.current(), defaults: defaults ? defaults.split('\n') : [] });
    store.changed();
    return () => { store.commands.delete(uid); store.changed(); };
  }, [store, uid, id, label, group, scope, enabled, allowInTextInput, repeat, defaults]);
}

const noCommands: ShortcutCommand[] = [];
const noSubscription = () => () => {};
/** Every registered command with its current chords, for a help list, menu or command palette. */
export function useShortcutCommands(): readonly ShortcutCommand[] {
  const store = useContext(StoreContext);
  return useSyncExternalStore(store?.subscribe ?? noSubscription, store?.getSnapshot ?? (() => noCommands), () => noCommands);
}
/** The current chords for a command id, so a menu item or button can show its shortcut. */
export function useCommandKeys(id: string): readonly KeyChord[] {
  return useShortcutCommands().find(command => command.id === id)?.keys ?? noKeys;
}
const noKeys: readonly KeyChord[] = [];
function useShortcutPlatform(): ShortcutPlatform {
  const store = useContext(StoreContext);
  const provided = useSyncExternalStore(store?.subscribe ?? noSubscription, () => store?.platform, () => undefined);
  const [detected, setDetected] = useState<ShortcutPlatform>('other');
  useEffect(() => { if (!store) setDetected(detectPlatform()); }, [store]);
  return provided ?? detected;
}

export interface KeyHintProps {
  /** The chord to show. */
  chord?: KeyChord;
  /** Or a command id: shows its first current chord, and nothing when it has none. */
  command?: string;
  /** Defaults to the provider's platform. */
  platform?: ShortcutPlatform;
  className?: string;
}
/** Shows a chord as key caps with platform labels and a spoken form for screen readers. It announces nothing by itself. */
export function KeyHint({ chord, command, platform, className }: KeyHintProps) {
  const current = useShortcutPlatform();
  const keys = useCommandKeys(command ?? '');
  const shown = chord ?? (command ? keys[0] : undefined);
  if (!shown) return null;
  const label = formatChord(shown, platform ?? current);
  return <kbd className={cx('t98-key-hint', className)}>
    <span className="t98-key-hint__keys" aria-hidden="true">{label.keys.map((key, index) => <kbd key={index} className="t98-key-hint__key">{key}</kbd>)}</span>
    <span className="t98-visually-hidden">{label.text}</span>
  </kbd>;
}
