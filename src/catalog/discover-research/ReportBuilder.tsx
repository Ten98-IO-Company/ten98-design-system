'use client';

import { useId, useState } from 'react';
import { Alert, Badge, Button, Dialog, EditorTemplate, Field, Input, ReportPanel, Select } from '../../lib';

type Widget = { id: number; title: string; source: string; value: string };

/** Local specimens only. Saving, authorization and public sharing belong to Discover. */
export default function ReportBuilder() {
  const id = useId();
  const [source, setSource] = useState('Native analytics');
  const [kind, setKind] = useState('Page views');
  const [title, setTitle] = useState('Traffic overview');
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const [scenario, setScenario] = useState('Editable');
  const [share, setShare] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const readOnly = scenario === 'Read only';
  const compatible = source === 'Native analytics' ? kind === 'Page views' : kind === 'Estimated search volume';
  const value = kind === 'Page views' ? '418 page-view events' : '1,200 estimated monthly searches';
  function move(index: number, offset: number) {
    const next = [...widgets];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setWidgets(next); setDirty(true); setReviewed(false);
  }
  return <EditorTemplate title="Build a research report" description="Synthetic local board · Atlas project · 12–18 October 2026 · UTC"
    scope={<p>Reader scope: two bounded synthetic sources. No public link is issued.</p>}
    feedback={<><Field label="Demo state" htmlFor={`${id}-state`}><Select value={scenario} onChange={e => setScenario(e.target.value)}>{['Editable', 'Revision conflict', 'Read only', 'Share expired', 'Share revoked'].map(s => <option key={s}>{s}</option>)}</Select></Field>{dirty && <Alert title="Unsaved board edits">Save a revision before reviewing sharing. Your widget draft is retained.</Alert>}{scenario === 'Revision conflict' && <Alert tone="warning" title="Revision changed">This local save is blocked. Keep the draft and compare with the newer revision in the application.</Alert>}</>}
    preview={<section aria-label="Board preview"><h3>Board preview</h3>{widgets.length === 0 && <p>Empty board. Configure a widget and add it.</p>}{widgets.map((widget, index) => <ReportPanel key={widget.id} title={widget.title} scope="12–18 October 2026 · UTC · Atlas" source={widget.source} asOf="18 October 2026, 23:00 UTC (synthetic snapshot)" status={failed === widget.id ? 'error' : 'ready'} reason={failed === widget.id ? 'Only this widget failed. Other widgets remain usable.' : undefined}
      retry={<Button variant="ghost" onClick={() => setFailed(failed === widget.id ? null : widget.id)}>{failed === widget.id ? 'Restore local widget' : 'Simulate widget failure'}</Button>}
      actions={<><Button variant="secondary" disabled={readOnly || index === 0} onClick={() => move(index, -1)} aria-label={`Move ${widget.title} earlier`}>Move earlier</Button><Button variant="secondary" disabled={readOnly || index === widgets.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${widget.title} later`}>Move later</Button><Button variant="ghost" disabled={readOnly} onClick={() => { setWidgets(widgets.filter(w => w.id !== widget.id)); setDirty(true); setReviewed(false); }}>Remove widget</Button></>}>{widget.value}</ReportPanel>)}</section>}
    footer={<><Badge>Saved local revision: {revision}</Badge><Button disabled={readOnly || !dirty || scenario === 'Revision conflict'} onClick={() => { setRevision(revision + 1); setDirty(false); setReviewed(false); }}>Save local revision</Button><Button variant="secondary" disabled={dirty || revision === 0 || readOnly} onClick={() => setShare(true)}>Review reader sharing</Button></>}>
    <Field label="Source" htmlFor={`${id}-source`}><Select value={source} disabled={readOnly} onChange={e => setSource(e.target.value)}><option>Native analytics</option><option>Keyword research</option></Select></Field>
    <Field label="Widget" htmlFor={`${id}-widget`}><Select value={kind} disabled={readOnly} onChange={e => setKind(e.target.value)}><option>Page views</option><option>Estimated search volume</option></Select></Field>
    <Field label="Widget title" htmlFor={`${id}-title`}><Input value={title} maxLength={100} disabled={readOnly} onChange={e => setTitle(e.target.value)} /></Field>
    {readOnly && <p>Report editor permission is required to add, arrange, save or share widgets.</p>}
    {!compatible ? <Alert title="Unsupported source and widget combination">Choose Page views for native analytics, or Estimated search volume for keyword research.</Alert> : <p>Configured preview: {title || 'Untitled widget'} · {value}. Retrieval does not establish provider index freshness.</p>}
    <Button disabled={readOnly || !compatible || !title.trim()} onClick={() => { setWidgets([...widgets, { id: Math.max(0, ...widgets.map(w => w.id)) + 1, title, source, value }]); setDirty(true); setReviewed(false); }}>Add widget to board</Button>
    <Dialog open={share} onOpenChange={setShare} title="Review saved reader scope" description={`Local revision ${revision} · Atlas · 12–18 October 2026 · UTC`} footer={<Button onClick={() => { setReviewed(true); setShare(false); }} disabled={scenario === 'Share expired' || scenario === 'Share revoked'}>Record local scope review</Button>}>
      <p>{widgets.length} widgets; bounded synthetic snapshots only. This review contains no credentials, public token or share URL.</p><p>Exports would need source, filters, timezone, as-of time and coverage. The application must authorize and issue any real share.</p>{(scenario === 'Share expired' || scenario === 'Share revoked') && <Alert tone="warning" title={scenario}>Saved report reading remains separate from access to its share.</Alert>}
    </Dialog>
    {reviewed && <p role="status">Reader scope reviewed locally for revision {revision}. No public link was created.</p>}
  </EditorTemplate>;
}
