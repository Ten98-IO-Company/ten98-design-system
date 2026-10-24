import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ApiKeysFlow, DangerZoneFlow, ProjectCreateFlow, SettingsLayout, Stack, TeamFlow, WorkspaceCreateFlow, createDateFormatter,
  type ApiKey, type TeamMember,
} from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
const calls: string[] = [];
(window as unknown as { __calls: string[] }).__calls = calls;
const log = (name: string, values: unknown) => { calls.push(`${name}:${JSON.stringify(values)}`); };

const longName = 'production-deployment-pipeline-credentials-for-the-regional-data-platform-team';
const keys: ApiKey[] = [
  { id: 'k1', name: longName, prefix: 't98_ab12cd', scopes: ['read', 'write'], createdAt: '2026-09-01', expiresAt: '2027-01-01', lastUsedAt: '2026-10-18', revoked: false },
  { id: 'k2', name: 'Retired key', prefix: 't98_zz99yy', scopes: ['read'], createdAt: '2026-01-05', revoked: true },
];
const roles = [{ value: 'owner', label: 'Owner' }, { value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }];
const members: TeamMember[] = [
  { id: 'u1', name: 'Amal Haddad', email: 'amal.haddad@example.com', role: 'owner', twoFactor: true },
  { id: 'u2', name: 'Sam Lee', email: 'sam.lee.with.a.deliberately.long.address@subdomain.example.com', role: 'member', twoFactor: false },
  { id: 'u3', name: 'Priya Nair', email: 'priya@example.com', role: 'admin' },
];
const items = [
  { id: 'profile', label: 'Profile', group: 'account' as const, href: '#profile' },
  { id: 'team', label: 'Team', group: 'workspace' as const, href: '#team' },
  { id: 'keys', label: 'API keys', group: 'project' as const, href: '#keys' },
  { id: 'billing', label: 'Billing', group: 'workspace' as const, href: '#billing', allowed: false },
  { id: 'ops', label: 'Operations', group: 'operator' as const, href: '#ops', allowed: false },
];

function Screen() {
  const [secret, setSecret] = useState<{ id: string; token: string }>();
  const [policy, setPolicy] = useState(false);
  const [link, setLink] = useState<{ id: string; url: string }>();
  const [unconfirmed, setUnconfirmed] = useState<string>();
  return <SettingsLayout title="Settings" scope="Acme workspace" items={items} current="team">
    <Stack gap={8}>
      <ApiKeysFlow keys={keys} scopes={[{ value: 'read', label: 'Read' }, { value: 'write', label: 'Write', description: 'Create and change records.' }]}
        expiryOptions={[{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: 'never', label: 'No expiry' }]}
        revealedSecret={secret} onDismissSecret={() => setSecret(undefined)}
        onCreate={values => { log('create', values); setSecret({ id: 'k9', token: 't98_live_0123456789abcdef0123456789abcdef' }); }}
        onRevoke={values => log('revoke', values)} />
      <TeamFlow currentUserId="u1" members={members} roles={roles} assignableRoles={member => member.id === 'u1' ? [] : ['admin', 'member']}
        onRoleChange={values => log('role', values)} onRemove={values => log('remove', values)}
        invitations={[{ id: 'i1', email: 'new.person@example.com', role: 'member', expiresAt: '2026-11-01', status: 'pending' }, { id: 'i2', email: 'old@example.com', role: 'admin', expiresAt: '2026-08-01', status: 'expired' }]}
        onInvite={values => { log('invite', values); setLink({ id: 'i3', url: 'https://app.example.com/invitations/accept?token=0123456789abcdef0123456789abcdef' }); }}
        onRevokeInvitation={values => log('revokeInvitation', values)} unconfirmed={unconfirmed} formatRelative={createDateFormatter({ locale: 'en', timeZone: 'UTC' }).relative}
        // The first resend has an unknown outcome, so the flow must offer only its exact retry; the retry then succeeds.
        onResendInvitation={values => { log('resend', values); setUnconfirmed(unconfirmed ? undefined : 'Result not confirmed. Retry to make sure it went through.'); }}
        onRenewInvitationLink={values => { log('renew', values); setLink({ id: 'i1-renewed', url: 'https://app.example.com/invitations/accept?token=fedcba9876543210fedcba9876543210' }); }} inviteLink={link} onDismissInviteLink={() => setLink(undefined)}
        policy={{ twoFactorRequired: policy, onChange: required => { log('policy', required); setPolicy(required); } }}
        ownership={{ candidates: [{ value: 'u2', label: 'Sam Lee' }, { value: 'u3', label: 'Priya Nair' }], onTransfer: values => log('transfer', values) }} />
      <WorkspaceCreateFlow mode="rename" defaultValues={{ name: 'Acme' }} onSubmit={values => log('workspace', values)} cancel={{ onClick: () => log('cancel', 'workspace') }} />
      <ProjectCreateFlow mode="create" defaultValues={{ name: '', origin: '' }} onSubmit={values => log('project', values)} />
      <DangerZoneFlow actions={[{ id: 'delete', title: 'Delete workspace', description: 'Removes every project and member. This cannot be undone.', confirmLabel: 'Delete workspace', confirmationText: 'DELETE' }]}
        onConfirm={values => log('danger', values)} />
    </Stack>
  </SettingsLayout>;
}

createRoot(document.getElementById('workspace-flows-fixture')!).render(<Screen />);
