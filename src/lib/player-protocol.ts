/* Protocol v1 for IsolatedPlayerFrame: the isolated document, the handshake and the message checks.
 * Pure functions, so they can be tested without a browser. Not exported from the package entry; the
 * component and the protocol types are. See docs/COMPONENTS.md and issue #17 (U25 threat model). */

export const PLAYER_PROTOCOL = 1;
export const PLAYER_CONNECT = 'ten98-player-connect';

/** App to player, over the port. */
export type PlayerCommand =
  | { type: 'init'; protocol: 1; payload: unknown }
  | { type: 'play' | 'pause'; offset: number }
  | { type: 'speed'; value: 0.5 | 1 | 1.5 | 2 }
  | { type: 'position'; axis: 'x' | 'y'; value: number }
  | { type: 'destroy' };

/** Player to app, over the port. `hello` must come first and echo this mount's token. */
export type PlayerMessage =
  | { type: 'hello'; token: string }
  | { type: 'ready'; duration: number }
  | { type: 'tick'; time: number; playing: boolean }
  | { type: 'ended' }
  | { type: 'error' };

const SPEEDS = [0.5, 1, 1.5, 2];
const keys = (value: object, expected: string) => Object.keys(value).sort().join(',') === expected;
const time = (value: unknown, max = Infinity): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;

/** Validates a message from the untrusted player. Anything malformed is null, which the frame treats as a failure. */
export function parsePlayerMessage(data: unknown, duration: number | null): PlayerMessage | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const message = data as Record<string, unknown>;
  switch (message.type) {
    case 'hello': return keys(message, 'token,type') && typeof message.token === 'string' ? { type: 'hello', token: message.token } : null;
    case 'ready': return keys(message, 'duration,type') && time(message.duration, 86_400_000) ? { type: 'ready', duration: message.duration } : null;
    case 'tick': return duration !== null && keys(message, 'playing,time,type') && time(message.time, duration) && typeof message.playing === 'boolean' ? { type: 'tick', time: message.time, playing: message.playing } : null;
    case 'ended': case 'error': return keys(message, 'type') ? { type: message.type } : null;
    default: return null;
  }
}

/** Validates a command before it is sent, so the app cannot ask the player for out-of-range work either. */
export function validCommand(command: PlayerCommand, duration: number | null, positionMax?: { x: number; y: number }): boolean {
  switch (command.type) {
    case 'play': case 'pause': return duration !== null && time(command.offset, duration);
    case 'speed': return SPEEDS.includes(command.value);
    case 'position': return !!positionMax && (command.axis === 'x' || command.axis === 'y') && time(command.value, positionMax[command.axis]);
    case 'destroy': return true;
    case 'init': return command.protocol === PLAYER_PROTOCOL;
  }
}

/** Only an http(s) URL or a root-relative path may supply the player script; blob:, data: and javascript: are refused. */
export function playerScriptUrl(src: string, base: string): string | null {
  if (!/^(https?:\/\/|\/(?!\/))/i.test(src)) return null;
  try { const url = new URL(src, base); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null; } catch { return null; }
}

export interface PlayerDocumentOptions { scriptUrl: string; nonce: string; token: string; integrity?: string; workers?: boolean }

const attr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The isolated player document. The CSP is its first element, so nothing in it can load, connect or run before the policy. */
export function playerDocument({ scriptUrl, nonce, token, integrity, workers = false }: PlayerDocumentOptions) {
  const policy = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; worker-src ${workers ? 'blob:' : "'none'"}; frame-src about:; font-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="${attr(policy)}"><meta charset="utf-8"><div id="ten98-player-root"></div>`
    + `<script nonce="${attr(nonce)}" src="${attr(scriptUrl)}" data-ten98-token="${attr(token)}" referrerpolicy="no-referrer"${integrity ? ` integrity="${attr(integrity)}" crossorigin="anonymous"` : ''}></script>`;
}

/** The frame source is always a data: URL, whose origin is opaque: never srcdoc, blob: or a same-origin URL, each of which
 * would share the app's origin and, with allow-scripts and allow-same-origin, let the document remove its own sandbox. */
export const playerFrameSource = (document: string) => `data:text/html;charset=utf-8,${encodeURIComponent(document)}`;

export const randomToken = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
};
