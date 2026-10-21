/* Internal helpers for hosting untrusted HTML in srcdoc frames. Not exported from the package entry. */

const attribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** A meta element that applies `policy` as the document's Content-Security-Policy. */
export const contentPolicyMeta = (policy: string) => `<meta http-equiv="Content-Security-Policy" content="${attribute(policy)}">`;

/**
 * Puts `prefix` (head elements such as a CSP meta) before any of the untrusted document's content.
 * It goes at the very start, after a leading doctype only when nothing but HTML whitespace (tab, LF, FF, CR, space)
 * precedes it: JavaScript's \s also matches characters such as U+00A0 and U+FEFF that the HTML parser treats as
 * text, which would open <body> first and leave the policy ignored. Searching for the document's own <head> could
 * match inside a comment or attribute and leave the policy inert. A leading meta opens the head implicitly,
 * and the parser ignores a later <html> or <head> start tag, so the prefix always lands in the head.
 */
/** The sources that govern scripts in a policy: script-src, else default-src, else none given (scripts allowed). */
function scriptSources(policy: string): string[] | null {
  const directives = new Map(policy.split(';').map(part => part.trim().split(/\s+/)).filter(parts => parts[0]).map(([name, ...values]) => [name.toLowerCase(), values]));
  return directives.get('script-src') ?? directives.get('default-src') ?? null;
}
/** Whether a policy lets any script run. */
export function policyAllowsScripts(policy: string) {
  const sources = scriptSources(policy);
  return sources === null || !(sources.length === 1 && sources[0].toLowerCase() === "'none'");
}
/**
 * Whether scripts allowed by a policy are limited to ones the app vouches for. Only nonce and hash sources (optionally with
 * 'strict-dynamic') qualify: 'unsafe-inline', hosts, schemes and * would let recorded markup run script, and a running script
 * can navigate its own frame to send data out, which no content policy blocks.
 */
export function policyScriptsArePinned(policy: string) {
  const sources = scriptSources(policy);
  if (sources === null) return false;
  const pinned = sources.filter(source => /^'(nonce-[A-Za-z0-9+/_=-]+|sha(256|384|512)-[A-Za-z0-9+/_=-]+)'$/.test(source));
  return pinned.length > 0 && sources.every(source => pinned.includes(source) || source.toLowerCase() === "'strict-dynamic'");
}

export function prefixDocument(doc: string, prefix: string) {
  const doctype = /^[\t\n\f\r ]*<!doctype[^>]*>/i.exec(doc);
  return doctype ? doctype[0] + prefix + doc.slice(doctype[0].length) : prefix + doc;
}
