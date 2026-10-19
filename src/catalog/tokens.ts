import canonicalCss from '../lib/tokens.css?raw';
import compatibilityCss from '../lib/app-tokens.css?raw';
import { tokens } from '../lib/tokens';

/** Names come from the shipped CSS; the catalogue reads values from computed styles. */
export const tokenNames = [...new Set(Array.from(canonicalCss.matchAll(/(--t98-[\w-]+)\s*:/g), match => match[1]))];

export const legacyAliases: Record<string, string> = Object.fromEntries(
  Array.from(compatibilityCss.matchAll(/(--(?!t98-)[\w-]+)\s*:\s*var\(\s*(--t98-[\w-]+)\s*\)/g), match => [match[1], match[2]])
);

/** CSS variable → existing typed token reference, where the public TS helper defines one. */
export const tokenReferences: Record<string, string> = {};
function collectReferences(value: unknown, path: string) {
  if (typeof value === 'string') {
    const name = value.match(/^var\((--t98-[\w-]+)\)$/)?.[1];
    if (name) tokenReferences[name] = path;
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) collectReferences(child, /^\d+$/.test(key) ? `${path}[${key}]` : `${path}.${key}`);
  }
}
collectReferences(tokens, 'tokens');

export function tokenGroup(name: string): string {
  const key = name.replace(/^--t98-/, '');
  if (/^(bg$|surface(?:-|$)|subtle$|text$|muted$|placeholder$|border$|control-border$|accent(?:-|$)|on-accent$|success(?:-|$)|warning(?:-|$)|danger(?:-|$)|info(?:-|$)|overlay$|disabled-|focus$|chart-)/.test(key)) return 'Colors';
  if (/^(font$|heading$|mono$|text-|leading-|weight-)/.test(key)) return 'Typography';
  if (key.startsWith('space-') || key === 'cell-padding') return 'Spacing';
  if (/^(control-|icon-)/.test(key)) return 'Sizing';
  if (/^(sidebar-|header-|content-|form-|auth-|reading-|z-)/.test(key)) return 'Layout';
  if (/^(radius|border-width$|focus-width$|focus-offset$)/.test(key)) return 'Borders';
  if (key.startsWith('shadow')) return 'Elevation';
  if (/^(motion|ease)/.test(key)) return 'Motion';
  return 'Other';
}

export function filterTokens(query: string, names: readonly string[] = tokenNames): string[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return names.filter(name => {
    const searchable = `${name} ${tokenGroup(name)} ${tokenReferences[name] ?? ''}`.toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
}
