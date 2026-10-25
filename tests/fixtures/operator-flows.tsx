import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OidcProvidersFlow, ProviderCredentialsFlow, Stack, Text, type OidcProviderConfig, type OidcTestReview, type ProviderConnection } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. The log shows what the flows hand the app.
const params = new URLSearchParams(location.search);
const vault = params.get('vault') !== 'missing';
const providers: OidcProviderConfig[] = [{ id: 'p1', revision: 3, enabled: true, activeRevision: 2, testedRevision: 3, testedAt: '2030-01-15T12:00:00Z',
  settings: { name: 'Company SSO', issuer: 'https://sso.example.test', clientId: 'ten98', authentication: 'basic', allowedOrigins: [], allowedAddresses: [], trustVerifiedEmail: false } }];
const connections: ProviderConnection[] = [{ id: 'c1', name: 'Research model', provider: 'openrouter', revision: 1, checkStatus: 'error', diagnostic: 'The key was rejected.',
  lastCheckedAt: null, createdAt: '2030-01-01T00:00:00Z', updatedAt: '2030-01-15T12:00:00Z' }];

function Screen() {
  const [log, setLog] = useState<string[]>([]);
  const record = (entry: string) => setLog(current => [...current, entry]);
  const [review, setReview] = useState<OidcTestReview>();
  return <Stack as="main" gap={6}>
    <OidcProvidersFlow providers={providers} callbackUrl="https://app.example.test/auth/oidc/callback" vaultConfigured={vault}
      onSaveDraft={values => record(`save:${JSON.stringify(values)}`)} onDisable={({ id }) => record(`disable:${id}`)}
      onStartTest={proof => { record(`test:${JSON.stringify(proof)}`); setReview({ state: 'ready', identity: { providerId: 'p1', providerName: 'Company SSO', issuer: 'https://sso.example.test', subject: 'subject-123', email: 'owner@example.test', emailVerified: true, expiresAt: '2030-01-15T12:00:00Z' } }); }}
      review={review} onEnableTested={({ id }) => { record(`enable:${id}`); setReview(undefined); }} onDismissReview={() => setReview(undefined)} />
    <ProviderCredentialsFlow state={params.get('state') === 'uncertain' ? 'uncertain' : 'ready'} onReload={() => record('reload')} connections={connections} vaultConfigured={vault} paused={false}
      onAdd={values => record(`add:${JSON.stringify(values)}`)} onCheck={({ id }) => record(`check:${id}`)} onRotate={values => record(`rotate:${JSON.stringify(values)}`)}
      onDisconnect={({ id }) => record(`disconnect:${id}`)} onSavePause={({ paused }) => record(`pause:${paused}`)}
      budget={{ month: '2026-10', spentUsd: '0.000123', reservedUsd: '12.5', uncertainUsd: '0' }} ledger={[{ id: 'l1', operation: 'Keyword search', status: 'settled', estimateUsd: '0.0004', actualUsd: null }]} />
    <Text id="log">{log.join(' | ')}</Text>
  </Stack>;
}
createRoot(document.getElementById('operator-fixture')!).render(<Screen />);
