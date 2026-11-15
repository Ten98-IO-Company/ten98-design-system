// Internal to the package: not exported from the index.

/** The keys that activate a focused button or submit a form from a field. */
export const isActivationKey = (key: string) => key === 'Enter' || key === ' ';

/** Each held activation key with the number of the press holding it, so a later press of the same key is told apart. */
const held = new Map<string, number>();
let presses = 0;
let tracking = false;

/**
 * Starts tracking which activation keys are held down, once per page. Called from effects, never at import, so server
 * rendering touches no document. Capture listeners on the document see every key event before it reaches a target. A
 * keydown of a key already held, repeat or not, continues the same press. A window blur clears the set, since the
 * matching keyup goes to another window.
 */
export function trackHeldKeys() {
  if (tracking || typeof document === 'undefined') return;
  tracking = true;
  document.addEventListener('keydown', event => { if (isActivationKey(event.key) && !held.has(event.key)) held.set(event.key, ++presses); }, true);
  document.addEventListener('keyup', event => { held.delete(event.key); }, true);
  window.addEventListener('blur', () => held.clear());
}

/** The activation keys held down right now and their presses, for example the Enter whose keydown is opening a dialog. */
export const heldPresses = (): ReadonlyMap<string, number> => new Map(held);
/** Whether `key` is still held by the press recorded in `snapshot`, with no release since. */
export const stillHeld = (snapshot: ReadonlyMap<string, number>, key: string) => snapshot.has(key) && held.get(key) === snapshot.get(key);
