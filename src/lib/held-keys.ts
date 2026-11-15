// Internal to the package: not exported from the index.

/** The keys that activate a focused button or submit a form from a field. */
export const isActivationKey = (key: string) => key === 'Enter' || key === ' ';

const textInputTypes = new Set(['text', 'search', 'email', 'url', 'tel', 'password']);
/** A field that takes typed text, where Space only types and never activates anything. */
export const isTextEntry = (target: EventTarget | null) => target instanceof HTMLTextAreaElement
  || (target instanceof HTMLInputElement && textInputTypes.has(target.type))
  || (target instanceof HTMLElement && target.isContentEditable);
/** A field that takes several lines of text, where Enter only types a line break and never submits. */
export const isMultilineEntry = (target: EventTarget | null) => target instanceof HTMLTextAreaElement
  || (target instanceof HTMLElement && target.isContentEditable);

const modifierKeys = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'OS', 'Fn', 'CapsLock']);
const chordOf = (event: KeyboardEvent) => [event.shiftKey && 'Shift', event.ctrlKey && 'Control', event.altKey && 'Alt', event.metaKey && 'Meta'].filter(Boolean) as string[];
/** A held key with no keydown for this long is taken as released: its keyup went missing. Auto-repeat comes far sooner. */
const releaseAfter = 1000;

/**
 * Each held activation key with the number of the press holding it, so a later press of the same key is told apart, and
 * the modifiers held when it went down. A keyup can go missing (on macOS no keyup is sent for a key released while Cmd is
 * down), so a press also ends when a different key that is not a modifier goes down, when a modifier of its chord is
 * released, after `releaseAfter` with no keydown of it, and when the window loses focus.
 */
const held = new Map<string, { press: number; chord: string[]; timer: ReturnType<typeof setTimeout> }>();
let presses = 0;
let tracking = false;
function release(key: string) {
  const entry = held.get(key);
  if (!entry) return;
  clearTimeout(entry.timer);
  held.delete(key);
}

/**
 * Starts tracking which activation keys are held down, once per page. It runs when this module loads in a browser, so the
 * press that opens a page's first dialog is already known, and again from the components that rely on it, which does
 * nothing once started. Server rendering has no document and skips it. Capture listeners on the document see every key
 * event before it reaches a target. A keydown of a key already held, repeat or not, continues the same press.
 */
export function trackHeldKeys() {
  if (tracking || typeof document === 'undefined') return;
  tracking = true;
  // These three listeners are never removed, by design: they are registered once per page and track key state for the
  // whole page, so there is no component whose unmount should end them.
  document.addEventListener('keydown', event => {
    const { key } = event;
    if (!modifierKeys.has(key)) for (const other of [...held.keys()]) if (other !== key) release(other);
    if (!isActivationKey(key)) return;
    const current = held.get(key);
    if (current) clearTimeout(current.timer);
    held.set(key, { press: current?.press ?? ++presses, chord: current?.chord ?? chordOf(event), timer: setTimeout(() => held.delete(key), releaseAfter) });
  }, true);
  document.addEventListener('keyup', event => {
    release(event.key);
    if (modifierKeys.has(event.key)) for (const [key, entry] of [...held]) if (entry.chord.includes(event.key)) release(key);
  }, true);
  window.addEventListener('blur', () => { for (const key of [...held.keys()]) release(key); });
}
trackHeldKeys();

/** The activation keys held down right now and their presses, for example the Enter whose keydown is opening a dialog. */
export const heldPresses = (): ReadonlyMap<string, number> => new Map([...held].map(([key, entry]) => [key, entry.press]));
/** Whether `key` is still held by the press recorded in `snapshot`, with no release since. */
export const stillHeld = (snapshot: ReadonlyMap<string, number>, key: string) => snapshot.has(key) && held.get(key)?.press === snapshot.get(key);
