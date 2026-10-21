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
export function prefixDocument(doc: string, prefix: string) {
  const doctype = /^[\t\n\f\r ]*<!doctype[^>]*>/i.exec(doc);
  return doctype ? doctype[0] + prefix + doc.slice(doctype[0].length) : prefix + doc;
}
