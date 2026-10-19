import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import tokensCss from '../lib/app-tokens.css?inline';
import appCss from '../lib/app.css?inline';
import type { Density, Theme } from '../lib/tokens';

const frameSource = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${tokensCss}\n${appCss}\n:root{font-family:var(--font-sans);font-size:14px;color:var(--color-text);background:var(--color-surface)}body{padding:16px}.specimen{display:grid;gap:16px;min-width:0}.specimen form{display:grid;gap:16px}.specimen .brand{padding-bottom:8px}.specimen output{overflow-wrap:anywhere}.specimen>.auth-shell{min-height:600px}a,button,input,select,textarea{max-width:100%}</style></head><body></body></html>`;

/** Keep specimen links inside their preview, including working local skip targets. */
export function previewLink(event: MouseEvent<HTMLElement>): string | undefined {
  const href = (event.target as Element).closest('a')?.getAttribute('href');
  if (!href) return;
  event.preventDefault();
  const target = href.startsWith('#') && [...event.currentTarget.querySelectorAll<HTMLElement>('[id]')].find(element => element.id === href.slice(1));
  if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'nearest' }); return; }
  return `Preview link: ${href}. Connect this destination in your application.`;
}

/** Isolate the established app's global selectors from the reference interface. */
export function AdapterPreview({ children, title, theme, density, large = false }: { children: ReactNode; title: string; theme: Theme; density: Density; large?: boolean }) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [height, setHeight] = useState(large ? 700 : 180);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!doc) return;
    doc.documentElement.dataset.theme = theme;
    doc.documentElement.dataset.density = density;
    const resize = () => setHeight(Math.max(large ? 650 : 100, doc.body.scrollHeight + 4));
    const observer = new ResizeObserver(resize);
    observer.observe(doc.body);
    resize();
    return () => observer.disconnect();
  }, [doc, theme, density, large]);
  return <><iframe className="reference-app-frame" title={title} sandbox="allow-same-origin allow-forms" srcDoc={frameSource} onLoad={event => setDoc(event.currentTarget.contentDocument)} style={{ height }}/>{doc && createPortal(<div className="specimen" onClickCapture={event => setMessage(previewLink(event) ?? '')}>{children}{message && <p role="status">{message}</p>}</div>, doc.body)}</>;
}
