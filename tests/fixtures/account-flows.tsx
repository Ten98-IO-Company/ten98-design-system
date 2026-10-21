import { useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountProfileFlow, LinkedIdentitiesFlow, PasswordChangeFlow, SessionListFlow, Stack, Text, TwoFactorSetupFlow, type TwoFactorSetupStage } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements, className or style.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
const noop = () => undefined;
const qr = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const codes = ['a1b2-c3d4-e5f6', 'g7h8-i9j0-k1l2', 'm3n4-o5p6-q7r8', 's9t0-u1v2-w3x4'];
const sessions = [
  { id: 's1', device: 'Chrome on Windows with a deliberately long device description', location: 'Dubai, United Arab Emirates', lastActiveAt: '2030-01-15T12:00:00Z', current: true },
  { id: 's2', device: 'Safari on iPhone', location: 'Doha, Qatar', lastActiveAt: '2030-01-14T08:30:00Z', current: false },
  { id: 's3', device: 'Firefox on Linux', lastActiveAt: '2030-01-10T08:30:00Z', current: false },
];
const identities = [
  { id: 'i1', providerName: 'Microsoft', email: 'a.very.long.address.for.a.narrow.screen@example.test', linkedAt: '2030-01-10T09:00:00Z' },
  { id: 'i2', providerName: 'Google', linkedAt: '2030-01-11T09:00:00Z' },
];
const proof = { providerName: 'Google', issuer: 'https://accounts.example.test/a/very/long/issuer/path', subject: 'subject-1234567890-abcdefghijklmnopqrstuvwxyz', email: 'member@example.test', expiresAt: '2030-01-15T12:00:00Z' };
const zones = ['Asia/Dubai', 'Asia/Qatar', 'Europe/London', 'UTC'];
const locales = [{ value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }];

/** Shows what each handler received so the browser spec can assert it only ran after confirmation. */
function Probe({ render }: { render: (log: (entry: string) => void) => ReactNode }) {
  const [entries, setEntries] = useState<string[]>([]);
  return <Stack gap={4}>
    {render(entry => setEntries(current => [...current, entry]))}
    <Text id="log" size="sm" tone="muted">{entries.length ? entries.join(' | ') : 'No calls'}</Text>
  </Stack>;
}

/** A background error that arrives while the person is typing must not move focus. */
function LateError() {
  const [error, setError] = useState<string>();
  useEffect(() => { const timer = setTimeout(() => setError('Preferences could not be refreshed.'), 600); return () => clearTimeout(timer); }, []);
  return <PasswordChangeFlow hasPassword error={error} onSubmit={noop} />;
}

function TwoFactor({ initial }: { initial: TwoFactorSetupStage }) {
  const [stage, setStage] = useState<TwoFactorSetupStage>(initial);
  return <Probe render={log => <TwoFactorSetupFlow stage={stage} enrolment={{ qrDataUrl: qr, manualKey: 'JBSWY3DPEHPK3PXP-LONG-SETUP-KEY-FOR-WRAPPING' }} recoveryCodes={codes} downloadName="team-codes.txt"
    onStart={({ password }) => { log(`start:${password}`); setStage('enrolling'); }} onVerify={({ code }) => { log(`verify:${code}`); setStage('codes'); }}
    onAcknowledgeCodes={() => { log('acknowledged'); setStage('on'); }} onRegenerate={({ password }) => { log(`regenerate:${password}`); setStage('codes'); }} onDisable={({ password }) => { log(`disable:${password}`); setStage('off'); }} />} />;
}

const screens: Record<string, ReactNode> = {
  'profile': <Probe render={log => <AccountProfileFlow email="member@example.test" emailHref="#email" defaultValues={{ name: 'Sam Rivera', theme: 'system', locale: 'en', timeZone: 'Asia/Dubai' }} localeOptions={locales} timeZones={zones} onDetectTimeZone={() => 'Europe/London'} onSubmit={values => log(JSON.stringify(values))} onDirtyChange={dirty => log(`dirty:${dirty}`)} />} />,
  'profile-disabled': <AccountProfileFlow email="member@example.test" defaultValues={{ name: 'Sam Rivera', theme: 'dark', locale: 'ar', timeZone: 'Asia/Qatar' }} localeOptions={locales} timeZones={zones} onSubmit={noop} disabled notice={{ tone: 'info', text: 'Only owners can edit profiles.' }} />,
  'late-error': <LateError />,
  'password': <Probe render={log => <PasswordChangeFlow hasPassword onSubmit={values => log(JSON.stringify(values))} />} />,
  'password-error': <PasswordChangeFlow hasPassword onSubmit={noop} error="The password could not be changed." fieldErrors={{ currentPassword: 'The current password is incorrect.' }} unconfirmed="We could not confirm whether your password changed. Reload this page before trying again." />,
  'password-none': <PasswordChangeFlow hasPassword={false} setPasswordHref="#set-password" onSubmit={noop} />,
  '2fa-off': <TwoFactor initial="off" />,
  '2fa-enrolling': <TwoFactor initial="enrolling" />,
  '2fa-codes': <TwoFactor initial="codes" />,
  '2fa-on': <TwoFactor initial="on" />,
  'sessions': <Probe render={log => <SessionListFlow sessions={sessions} onRevoke={({ id }) => log(`revoke:${id}`)} onRevokeOthers={() => log('revoke-others')} />} />,
  'identities': <Probe render={log => <LinkedIdentitiesFlow identities={identities} providers={[{ id: 'github', name: 'GitHub' }]} hasPassword onLink={id => log(`link:${id}`)} onUnlink={({ id, password }) => log(`unlink:${id}:${password}`)} />} />,
  'identities-last': <LinkedIdentitiesFlow identities={identities.slice(0, 1)} providers={[]} hasPassword={false} onLink={noop} onUnlink={noop} />,
  'identities-proof': <LinkedIdentitiesFlow identities={identities} providers={[{ id: 'github', name: 'GitHub' }]} hasPassword onLink={noop} onUnlink={noop} pendingProof={proof} onConfirmProof={noop} onDismissProof={noop} />,
};

createRoot(document.getElementById('account-flows-fixture')!).render(<Stack gap={6} as="main" aria-label="Account settings">{screens[params.get('screen') || 'profile'] ?? screens.profile}</Stack>);
