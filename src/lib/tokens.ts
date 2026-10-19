/** Names reference the CSS source of truth; values follow the active theme. */
export const tokens = {
  color: { canvas: 'var(--t98-bg)', surface: 'var(--t98-surface)', subtle: 'var(--t98-subtle)', text: 'var(--t98-text)', muted: 'var(--t98-muted)', border: 'var(--t98-border)', accent: 'var(--t98-accent)', success: 'var(--t98-success)', warning: 'var(--t98-warning)', danger: 'var(--t98-danger)', info: 'var(--t98-info)' },
  font: { body: 'var(--t98-font)', heading: 'var(--t98-heading)', mono: 'var(--t98-mono)' },
  space: { 1: 'var(--t98-space-1)', 2: 'var(--t98-space-2)', 3: 'var(--t98-space-3)', 4: 'var(--t98-space-4)', 6: 'var(--t98-space-6)', 8: 'var(--t98-space-8)', 12: 'var(--t98-space-12)' },
  radius: 'var(--t98-radius)', controlHeight: 'var(--t98-control-height)'
} as const;
export type Theme = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';
