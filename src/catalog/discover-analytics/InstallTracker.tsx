'use client';

import { useId, useState } from 'react';
import { Alert, Button, Checkbox, EditorTemplate, Field, Select, TrackerStatus, type InstallationState, type ReceiptState } from '../../lib';

export default function InstallTrackerExample() {
  const id = useId();
  const [method, setMethod] = useState('script');
  const [deployed, setDeployed] = useState(false);
  const [installation, setInstallation] = useState<InstallationState>('not-checked');
  const [receipt, setReceipt] = useState<ReceiptState>('waiting');
  const [copied, setCopied] = useState('Not copied.');
  const [opened, setOpened] = useState(false);
  const snippet = method === 'script'
    ? '<script defer src="https://analytics.example.invalid/tracker.js" data-project="demo-store"></script>'
    : '<!-- Configure your consent platform to load the tracker only under the app policy. -->';
  async function copySnippet() {
    try { await navigator.clipboard.writeText(snippet); setCopied('Snippet copied. Deployment and event receipt remain unverified.'); }
    catch { setCopied('Clipboard unavailable. Select the visible snippet and copy it manually.'); }
  }
  return <EditorTemplate title="Install website analytics" description="Synthetic setup exercise · Store website" scope="Workspace North · project demo-store · shop.example.invalid" feedback={<Alert title="Evidence boundary">Discover currently confirms installation through accepted events; it has no installation scanner. The optional scanner states below are a synthetic presentation proposal. No website is contacted.</Alert>} preview={<TrackerStatus resource="Store website" installation={{ state: installation, observedAt: installation === 'installed' ? '2026-10-19T09:05:00Z' : undefined, reason: installation === 'installed' ? 'Synthetic scanner result only; it does not prove counted traffic.' : 'External deployment is a separate manual task.' }} receipt={{ state: receipt, observedAt: receipt === 'received' || receipt === 'stale' ? '2026-10-19T09:06:00Z' : undefined, reason: receipt === 'stale' ? 'Last accepted event is older than the requested report scope.' : 'Only the application ingestion receipt can establish that an event was accepted.' }} />}>
    <Field label="Installation method" htmlFor={`${id}-method`}><Select value={method} onChange={event => setMethod(event.target.value)}><option value="script">Script snippet</option><option value="consent">Existing consent platform</option></Select></Field>
    <pre dir="ltr" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}><code>{snippet}</code></pre>
    <Button onClick={copySnippet}>Copy installation snippet</Button><p role="status">{copied}</p>
    <Checkbox label="I deployed the configuration outside this example" checked={deployed} onChange={event => setDeployed(event.target.checked)} />
    <p>Deployment confirmation is your checklist entry; it does not establish an accepted event.</p>
    <Button variant="secondary" disabled={!deployed || installation === 'checking'} onClick={() => setInstallation('checking')}>Try synthetic installation check</Button>
    {installation === 'checking' && <><Button variant="secondary" onClick={() => setInstallation('installed')}>Supply synthetic detected result</Button><Button variant="ghost" onClick={() => setInstallation('unavailable')}>Supply inconclusive result</Button></>}
    <Field label="Local accepted-event scenario" htmlFor={`${id}-receipt`}><Select value={receipt} onChange={event => { setReceipt(event.target.value as ReceiptState); setOpened(false); }}><option value="waiting">Waiting for events</option><option value="received">Accepted event received</option><option value="stale">Stale receipt</option><option value="unavailable">Receipt read failed</option><option value="disabled">Collection disabled by app policy</option></Select></Field>
    <Button disabled={receipt !== 'received'} onClick={() => setOpened(true)}>Open first useful report</Button>
    {opened && <Alert title="Accepted event detail">Synthetic pageview /pricing · accepted 19 October 2026, 09:06 UTC. Open the application overview with this project scope; one event does not establish coverage.</Alert>}
  </EditorTemplate>;
}
