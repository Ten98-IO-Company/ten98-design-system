import { createRoot } from 'react-dom/client';
import { SettingsLayout, TeamFlow } from '@ten98/ui';
import '@ten98/ui/styles.css';
// Discover's stylesheet set: the library styles plus the app compatibility sheets.
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only. TeamFlow's members table sits in the settings
// main column, as in Discover's team settings, where it widened a 320px page to 672px.
const noop = () => {};
createRoot(document.getElementById('settings-template-fixture')!).render(
  <SettingsLayout title="Team" current="team" items={[
    { id: 'profile', label: 'Your account', group: 'account', href: '#profile' }, { id: 'security', label: 'Security', group: 'account', href: '#security' },
    { id: 'team', label: 'Team', group: 'workspace', href: '#team' }, { id: 'api', label: 'API access', group: 'workspace', href: '#api' },
    { id: 'retention', label: 'Retention', group: 'project', href: '#retention' }]}>
    <TeamFlow currentUserId="me" onRoleChange={noop} onRemove={noop} onInvite={noop} onRevokeInvitation={noop} invitations={[]}
      roles={[{ value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }]} assignableRoles={() => ['editor', 'viewer']}
      members={[{ id: 'me', name: 'Ada Lovelace', email: 'ada.lovelace@example.test', role: 'owner', twoFactor: true },
        { id: 'b', name: 'Grace Hopper', email: 'grace.hopper@example.test', role: 'editor', twoFactor: false }]} />
  </SettingsLayout>,
);
