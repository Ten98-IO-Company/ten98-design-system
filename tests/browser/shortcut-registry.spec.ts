import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from '@playwright/test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  KeyHint, ShortcutProvider, ShortcutScope, chordFromEvent, findChordConflicts, findReservedChords, formatChord, isPrintableChord,
  mergeKeymaps, parseChord, reservedChord, resolveShortcut, useCommand, type ChordEvent, type ResolvedCommand, type ShortcutTarget,
} from '../../src/lib/shortcuts.js';

// Pure registry rules, without a page; the browser behaviour is in shortcuts.spec.ts.

const press = (key: string, init: Partial<ChordEvent> = {}): ChordEvent => ({ key, code: '', ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...init });
const command = (id: string, scope: string, chords: string[], extra: Partial<ResolvedCommand> = {}): ResolvedCommand => ({ id, scope, chords, enabled: true, ...extra });
const app = { id: '', focus: false };

test('chords parse to one canonical form, with Mod following the platform', () => {
  assert.equal(parseChord('ctrl+shift+s'), 'Ctrl+Shift+S');
  assert.equal(parseChord('Shift+Ctrl+S'), 'Ctrl+Shift+S');
  assert.equal(parseChord('Mod+K'), 'Ctrl+K');
  assert.equal(parseChord('Mod+K', 'apple'), 'Meta+K');
  assert.equal(parseChord('cmd+option+i'), 'Alt+Meta+I');
  assert.equal(parseChord('f2'), 'F2');
  assert.equal(parseChord('Esc'), 'Escape');
  assert.equal(parseChord('Ctrl++'), 'Ctrl++');
  assert.equal(parseChord('alt+down'), 'Alt+ArrowDown');
  assert.equal(parseChord('Hyper+S'), undefined);
  assert.equal(parseChord('Ctrl+'), undefined);
  assert.equal(parseChord('F25'), undefined);
  // Shifted characters arrive as themselves, so these chords could never match an event.
  assert.equal(parseChord('Shift+/'), undefined);
  assert.equal(parseChord('Ctrl+Shift+/'), undefined);
  assert.equal(parseChord('Shift+1'), undefined);
  assert.equal(parseChord('Ctrl+Shift+1'), 'Ctrl+Shift+1');
  assert.equal(parseChord('?'), '?');
});

test('keyboard events resolve to chords by key, falling back to the physical key under modifiers', () => {
  assert.equal(chordFromEvent(press('F2')), 'F2');
  assert.equal(chordFromEvent(press('Enter', { ctrlKey: true })), 'Ctrl+Enter');
  assert.equal(chordFromEvent(press('s', { code: 'KeyS', ctrlKey: true })), 'Ctrl+S');
  assert.equal(chordFromEvent(press('S', { code: 'KeyS', ctrlKey: true, shiftKey: true })), 'Ctrl+Shift+S');
  // Arabic layout: the letter differs, the physical key does not.
  assert.equal(chordFromEvent(press('س', { code: 'KeyS', ctrlKey: true })), 'Ctrl+S');
  // Apple Option produces another character or a dead key.
  assert.equal(chordFromEvent(press('ç', { code: 'KeyC', altKey: true }), 'apple'), 'Alt+C');
  assert.equal(chordFromEvent(press('Dead', { code: 'KeyE', altKey: true }), 'apple'), 'Alt+E');
  assert.equal(chordFromEvent(press('?', { code: 'Slash', shiftKey: true })), '?');
  assert.equal(chordFromEvent(press(' ', { code: 'Space' })), 'Space');
  assert.equal(chordFromEvent(press('Esc')), 'Escape');
  assert.equal(chordFromEvent(press('Control', { ctrlKey: true })), undefined);
  assert.equal(chordFromEvent(press('!', { code: 'Digit1', ctrlKey: true, shiftKey: true })), 'Ctrl+Shift+1');
  assert.equal(chordFromEvent(press('ö', { code: 'Quote', ctrlKey: true })), parseChord('Ctrl+ö'));
  // Autofill picks send keydown without a key.
  assert.equal(chordFromEvent({ ctrlKey: false, altKey: false, shiftKey: false, metaKey: false } as unknown as ChordEvent), undefined);
});

test('IME composition and AltGr characters never produce a command chord', () => {
  assert.equal(chordFromEvent(press('a', { isComposing: true })), undefined);
  assert.equal(chordFromEvent(press('Process', { keyCode: 229 })), undefined);
  const altGraph = { getModifierState: (key: string) => key === 'AltGraph' };
  assert.equal(chordFromEvent(press('@', { code: 'KeyQ', ctrlKey: true, altKey: true, ...altGraph })), undefined);
  assert.equal(chordFromEvent(press('€', { code: 'KeyE', ctrlKey: true, altKey: true, ...altGraph })), undefined);
  // A real Ctrl+Alt chord is still a chord, and AltGr with a named key drops the implied Ctrl+Alt.
  assert.equal(chordFromEvent(press('s', { code: 'KeyS', ctrlKey: true, altKey: true })), 'Ctrl+Alt+S');
  assert.equal(chordFromEvent(press('F2', { ctrlKey: true, altKey: true, ...altGraph })), 'F2');
  assert.equal(chordFromEvent(press('Dead', { code: 'Digit3', ctrlKey: true, altKey: true, ...altGraph })), undefined);
});

test('the innermost active scope that binds a chord wins, and a disabled command still claims it', () => {
  const commands = [command('app.help', '', ['F1']), command('screen.save', 'screen', ['Ctrl+S']), command('grid.save', 'grid', ['Ctrl+S']), command('app.save', '', ['Ctrl+S'])];
  const scopes = [{ id: 'grid', focus: true }, { id: 'screen', focus: false }, app];
  assert.equal(resolveShortcut({ chord: 'Ctrl+S', scopes, commands, target: 'other' })?.command.id, 'grid.save');
  assert.equal(resolveShortcut({ chord: 'Ctrl+S', scopes: scopes.slice(1), commands, target: 'other' })?.command.id, 'screen.save');
  assert.equal(resolveShortcut({ chord: 'F1', scopes, commands, target: 'other' })?.command.id, 'app.help');
  const disabled = commands.map(entry => entry.id === 'grid.save' ? { ...entry, enabled: false } : entry);
  assert.equal(resolveShortcut({ chord: 'Ctrl+S', scopes, commands: disabled, target: 'other' }), undefined);
  // A dialog scope chain has no outer scopes: nothing outside it runs.
  assert.equal(resolveShortcut({ chord: 'F1', scopes: [{ id: 'dialog', focus: false }], commands, target: 'other' }), undefined);
  assert.equal(resolveShortcut({ chord: 'F9', scopes, commands, target: 'other' }), undefined);
});

test('held keys repeat only commands that ask for it, and others stay claimed so the browser action does not run', () => {
  const commands = [command('save', '', ['Ctrl+S']), command('next', '', ['F8'], { repeat: true })];
  assert.deepEqual(resolveShortcut({ chord: 'Ctrl+S', scopes: [app], commands, target: 'other', repeat: true }), { command: commands[0], run: false });
  assert.deepEqual(resolveShortcut({ chord: 'F8', scopes: [app], commands, target: 'other', repeat: true }), { command: commands[1], run: true });
  assert.deepEqual(resolveShortcut({ chord: 'Ctrl+S', scopes: [app], commands, target: 'other' }), { command: commands[0], run: true });
});

test('a scope prefers its enabled command, and Tab is never a command', () => {
  const commands = [command('draft', 'screen', ['Ctrl+S'], { enabled: false }), command('save', 'screen', ['Ctrl+S']), command('next', '', ['Tab', 'Shift+Tab', 'Ctrl+Tab'])];
  const scopes = [{ id: 'screen', focus: false }, app];
  assert.equal(resolveShortcut({ chord: 'Ctrl+S', scopes, commands, target: 'other' })?.command.id, 'save');
  assert.equal(resolveShortcut({ chord: 'Tab', scopes, commands, target: 'other' }), undefined);
  assert.equal(resolveShortcut({ chord: 'Shift+Tab', scopes, commands, target: 'other' }), undefined);
  assert.equal(resolveShortcut({ chord: 'Ctrl+Tab', scopes, commands, target: 'other' })?.command.id, 'next');
});

test('typing and native keys stay with the focused field unless the command opts in', () => {
  const grid = { id: 'grid', focus: true };
  const commands = [
    command('grid.find', 'grid', ['/']), command('grid.advance', 'grid', ['Enter']), command('grid.up', 'grid', ['ArrowUp']),
    command('grid.save', 'grid', ['Ctrl+S']), command('grid.note', 'grid', ['Shift+N'], { allowInTextInput: true }),
  ];
  const run = (chord: string, target: ShortcutTarget, scopes = [grid, app]) => resolveShortcut({ chord, scopes, commands, target })?.command.id;
  assert.equal(run('/', 'text'), undefined);
  assert.equal(run('/', 'other'), 'grid.find');
  assert.equal(run('Shift+N', 'text'), 'grid.note');
  assert.equal(run('Enter', 'text'), 'grid.advance');
  assert.equal(run('Enter', 'multiline'), undefined);
  assert.equal(run('Enter', 'control'), undefined);
  assert.equal(run('ArrowUp', 'text'), undefined);
  assert.equal(run('ArrowUp', 'other'), 'grid.up');
  assert.equal(run('Ctrl+S', 'multiline'), 'grid.save');
  // Printable chords run only in a focus-activated scope that holds focus (WCAG 2.1.4).
  assert.equal(run('/', 'other', [{ id: 'grid', focus: false }, app]), undefined);
  assert.equal(isPrintableChord('Shift+A'), true);
  assert.equal(isPrintableChord('Space'), true);
  assert.equal(isPrintableChord('Alt+A'), false);
  assert.equal(isPrintableChord('F2'), false);
});

test('user overrides replace or unbind keymap chords', () => {
  const classic = { 'voucher.save': 'Ctrl+A', 'voucher.payment': ['F5'], 'voucher.receipt': 'F6' };
  const merged = mergeKeymaps(classic, { 'voucher.payment': ['Alt+F5', 'Ctrl+5'], 'voucher.receipt': [] });
  assert.deepEqual(merged, { 'voucher.save': ['Ctrl+A'], 'voucher.payment': ['Alt+F5', 'Ctrl+5'], 'voucher.receipt': [] });
  assert.deepEqual(mergeKeymaps(undefined, classic)['voucher.save'], ['Ctrl+A']);
});

test('conflicts are chords bound to more than one enabled command in one scope', () => {
  const conflicts = findChordConflicts([
    command('a', 'screen', ['F2']), command('b', 'screen', ['F2', 'F3']), command('c', 'grid', ['F2']), command('d', 'screen', ['F3'], { enabled: false }),
  ]);
  assert.deepEqual(conflicts, [{ scope: 'screen', chord: 'F2', commands: ['a', 'b'] }]);
});

test('browser-reserved and browser-owned chords are listed so apps can offer alternates', () => {
  assert.equal(reservedChord('Ctrl+N')?.kind, 'reserved');
  assert.equal(reservedChord('ctrl+w')?.kind, 'reserved');
  assert.equal(reservedChord('Alt+F4')?.kind, 'reserved');
  assert.equal(reservedChord('F11')?.kind, 'reserved');
  assert.equal(reservedChord('F5')?.kind, 'browser');
  assert.equal(reservedChord('Ctrl+P')?.kind, 'browser');
  assert.equal(reservedChord('Mod+W', 'apple')?.kind, 'reserved');
  assert.equal(reservedChord('F2'), undefined);
  assert.equal(reservedChord('Ctrl+Enter'), undefined);
  assert.deepEqual(findReservedChords({ 'voucher.new': ['Ctrl+N', 'Alt+N'], 'voucher.post': 'Ctrl+Enter' }).map(({ command, chord, kind }) => [command, chord, kind]), [['voucher.new', 'Ctrl+N', 'reserved']]);
});

test('chord labels follow the platform with a spoken form', () => {
  assert.deepEqual(formatChord('Mod+Shift+S'), { keys: ['Ctrl', 'Shift', 'S'], text: 'Control+Shift+S' });
  assert.deepEqual(formatChord('Mod+Shift+S', 'apple'), { keys: ['⇧', '⌘', 'S'], text: 'Shift+Command+S' });
  assert.deepEqual(formatChord('Escape'), { keys: ['Esc'], text: 'Escape' });
  assert.deepEqual(formatChord('Alt+ArrowDown'), { keys: ['Alt', '↓'], text: 'Alt+Down arrow' });
  assert.deepEqual(formatChord('Ctrl++'), { keys: ['Ctrl', '+'], text: 'Control+Plus' });
});

test('KeyHint renders key caps, a spoken label and no live region; scopes add no box', () => {
  const html = renderToStaticMarkup(h(KeyHint, { chord: 'Ctrl+Enter' }));
  assert.match(html, /^<kbd class="t98-key-hint">/);
  assert.match(html, /<span class="t98-key-hint__keys" aria-hidden="true"><kbd class="t98-key-hint__key">Ctrl<\/kbd><kbd class="t98-key-hint__key">Enter<\/kbd><\/span>/);
  assert.match(html, /<span class="t98-visually-hidden">Control\+Enter<\/span>/);
  assert.doesNotMatch(html, /role=|aria-live/);
  assert.equal(renderToStaticMarkup(h(KeyHint, { command: 'missing' })), '');
  function Save() { useCommand({ id: 'save', label: 'Save', run() {} }); return null; }
  const scoped = renderToStaticMarkup(h(ShortcutProvider, { keymaps: { classic: { save: 'Ctrl+S' } }, children: h(ShortcutScope, { name: 'Voucher', children: h(Save) }) }));
  assert.match(scoped, /^<div data-t98-shortcut-scope="[^"]+" style="display:contents"><\/div>$/);
  // Server rendering registers nothing and shows no chord before the client registry exists.
  assert.equal(renderToStaticMarkup(h(ShortcutProvider, { keymaps: { classic: { save: 'Ctrl+S' } }, children: h(KeyHint, { command: 'save' }) })), '');
});

test('KeyHint styles exist and stay left to right in right-to-left pages', () => {
  const css = readFileSync(new URL('../../src/lib/shortcuts.css', import.meta.url), 'utf8');
  for (const name of ['t98-key-hint', 't98-key-hint__keys', 't98-key-hint__key']) assert.ok(css.includes(`.${name}`), name);
  assert.match(css, /\.t98-key-hint \{[^}]*direction: ltr;[^}]*unicode-bidi: isolate;/);
});
