import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../lib/primitives';

export function Code({ value, title = 'Example.tsx', label = 'Copy TSX' }: { value: string; title?: string; label?: string }) {
  const [status, setStatus] = useState('');
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => setStatus(''), [value]);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setStatus('Copied'); }
    catch {
      if (ref.current) { const range = document.createRange(); range.selectNodeContents(ref.current); const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range); }
      setStatus('Clipboard unavailable. Code selected; copy it manually.');
    }
  }
  return <div className="reference-code"><div className="reference-code-heading"><span>{title}</span><Button variant="ghost" size="sm" onClick={copy} aria-describedby={status ? id : undefined}>{status === 'Copied' ? 'Copied' : label}</Button></div><pre tabIndex={0} aria-label={title}><code ref={ref}>{value}</code></pre><span id={id} className="reference-copy-status" role="status">{status}</span></div>;
}
