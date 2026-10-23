import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, AccountMenu, AppShell, AppTopbar, Banner, Card, Grid, Heading, Link, SearchField, SectionNav, SidebarFooter, SidebarNav, SidebarStatus, Stack, Text, WorkspaceProjectSwitcher, type NavLinkComponent, type SidebarNavGroup } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';

/* Stands in for a router link: `href` is a route key, resolved here to a hash URL. */
const RouterLink: NavLinkComponent = ({ href, ...props }) => <Link {...props} href={`#/${href}`} variant="quiet" />;
const noop = () => undefined;

function discoverGroups(current: string): SidebarNavGroup[] {
  const item = (id: string, label: string, icon: 'home' | 'search' | 'settings' | 'inbox', keywords?: string[]) => ({ id, label, icon, href: id, current: current === id, keywords });
  return [
    { id: 'research', label: 'Research', items: [item('overview', 'Overview', 'home'), item('searches', 'Saved searches', 'search', ['queries']), { ...item('alerts', 'Alerts', 'inbox'), badge: 4, badgeLabel: 'new' }] },
    { id: 'manage', label: 'Manage', items: [item('settings', 'Settings and billing preferences for the whole organisation', 'settings')] },
  ];
}

function DiscoverNav() {
  const [filter, setFilter] = useState('');
  const [current, setCurrent] = useState('overview');
  const groups = discoverGroups(current);
  const total = groups.flatMap(group => group.items).length;
  const q = filter.trim().toLowerCase();
  const shown = groups.flatMap(group => group.items).filter(item => !q || [item.label, ...(item.keywords ?? [])].some(text => text.toLowerCase().includes(q))).length;
  return <Stack gap={3}>
    <SearchField label="Filter pages" value={filter} onValueChange={setFilter} onClear={() => setFilter('')} clearLabel="Clear filter" status={q ? `${shown} of ${total} pages` : undefined} />
    <SidebarNav label="Discover" groups={groups} linkComponent={RouterLink} filter={filter} onNavigate={item => setCurrent(item.id)} emptyFilter={query => `No pages match "${query}"`} />
  </Stack>;
}

function CampaignNav() {
  const [current, setCurrent] = useState('campaigns');
  const select = (id: string) => () => setCurrent(id);
  return <Stack gap={3}>
    <SidebarNav label="Campaign" groups={[
      { id: 'main', items: [
        { id: 'campaigns', label: 'Campaigns', icon: 'megaphone', onSelect: select('campaigns'), current: current === 'campaigns' },
        { id: 'audiences', label: 'Audiences', icon: 'users', onSelect: select('audiences'), current: current === 'audiences', badge: 12, badgeLabel: 'segments' },
        { id: 'billing', label: 'Billing', icon: 'settings', onSelect: select('billing'), disabled: true },
        { id: 'secret', label: 'Hidden admin', onSelect: noop, hidden: true },
      ] },
    ]} />
    <Text as="p" role="status" aria-label="Selected page" size="sm" tone="muted">Selected: {current}</Text>
  </Stack>;
}

/* Real hrefs plus a guarded onSelect, as Campaign uses: an unsaved draft cancels navigation. */
function GuardedNav() {
  const [dirty, setDirty] = useState(true);
  const [selected, setSelected] = useState(0);
  const [navigated, setNavigated] = useState(0);
  return <Stack gap={3}>
    <SidebarNav label="Guarded" onNavigate={() => setNavigated(count => count + 1)} groups={[{ id: 'g', items: [
      { id: 'guarded-a', label: 'Guarded page', href: '#/guarded-a', onSelect: (_item, event) => { setSelected(count => count + 1); if (dirty) event.preventDefault(); } },
    ] }]} />
    <Button variant="secondary" onClick={() => setDirty(value => !value)}>{dirty ? 'Discard draft' : 'Restore draft'}</Button>
    <Text as="p" role="status" aria-label="Guard counters" size="sm" tone="muted">selected {selected}, navigated {navigated}</Text>
  </Stack>;
}

function Sections() {
  const [dirty, setDirty] = useState(true);
  const [current, setCurrent] = useState(params.get('section') ?? 'overview');
  const [log, setLog] = useState('none');
  const items = ['overview', 'audience', 'creative assets', 'delivery schedule', 'reports', 'billing and invoices', 'settings'].map(label => ({ id: label, label: label[0].toUpperCase() + label.slice(1), href: label, current: current === label, badge: label === 'reports' ? 3 : undefined }));
  return <Stack gap={3}>
    <SectionNav label="Page sections" items={items} linkComponent={RouterLink}
      onSelect={(item, event) => { setLog(`select ${item.id}`); if (dirty) event.preventDefault(); else setCurrent(item.id); }} />
    <Button variant="secondary" onClick={() => setDirty(value => !value)}>{dirty ? 'Discard section draft' : 'Restore section draft'}</Button>
    <Text as="p" role="status" aria-label="Section log" size="sm" tone="muted">{log}</Text>
  </Stack>;
}

function Switchers() {
  const [workspace, setWorkspace] = useState('acme');
  const [project, setProject] = useState<string | null>('launch');
  const workspaces = [{ id: 'acme', name: 'Acme International Holdings with a very long name', roleLabel: 'Workspace admin' }, { id: 'labs', name: 'Labs' }];
  return <Stack gap={4}>
    <WorkspaceProjectSwitcher workspaces={workspaces} projects={[{ id: 'launch', name: 'Spring launch' }, { id: 'brand', name: 'Brand refresh' }]} workspaceId={workspace} projectId={project} onWorkspaceChange={setWorkspace} onProjectChange={setProject} create={{ href: 'projects/new' }} linkComponent={RouterLink} />
    <WorkspaceProjectSwitcher workspaces={workspaces} projects={null} workspaceId="labs" projectId={null} onWorkspaceChange={noop} onProjectChange={noop} />
    <WorkspaceProjectSwitcher workspaces={workspaces} projects={[]} workspaceId="labs" projectId={null} onWorkspaceChange={noop} onProjectChange={noop} create={{ onSelect: noop, label: 'Create project' }} />
    <WorkspaceProjectSwitcher workspaces={[]} projects={[]} workspaceId={null} projectId={null} onWorkspaceChange={noop} onProjectChange={noop} />
  </Stack>;
}

function Searches() {
  const [topbar, setTopbar] = useState('');
  return <Stack gap={4}>
    <SearchField variant="topbar" label="Search everything" hideLabel placeholder="Search" shortcut="/" value={topbar} onValueChange={setTopbar} onClear={() => setTopbar('')} clearLabel="Clear search" status={topbar ? `Results for ${topbar}` : undefined} />
    <SearchField label="Inline search" value="" onValueChange={noop} placeholder="Type to search" />
  </Stack>;
}

function Fixture() {
  return <Stack as="main" gap={6}>
    <Heading level={1}>App shell navigation</Heading>
    <Grid minItemWidth="md" gap={4}>
      <Card title="Discover (link component)"><DiscoverNav /></Card>
      <Card title="Campaign (guarded callbacks)"><CampaignNav /></Card>
      <Card title="Guarded links"><GuardedNav /></Card>
      <Card title="Sections"><Sections /></Card>
      <Card title="Workspace and project"><Switchers /></Card>
      <Card title="Search"><Searches /></Card>
    </Grid>
  </Stack>;
}

/* A complete application frame composed only from library components. */
const longCrumbs = params.get('crumbs') === 'long' || params.get('crumbs') === 'unbroken';
// Discover's long-name case: one hyphenated 130-character token with no spaces.
const unbroken = params.get('crumbs') === 'unbroken';
function AppFixture() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [workspace, setWorkspace] = useState('acme');
  const [project, setProject] = useState<string | null>('launch');
  const [current, setCurrent] = useState('overview');
  const [signingOut, setSigningOut] = useState(false);
  const [banner, setBanner] = useState(true);
  const workspaces = [{ id: 'acme', name: 'Acme International', roleLabel: 'Workspace admin', initials: 'AI' }, { id: 'labs', name: 'Labs', initials: 'L' }];
  return <AppShell
    sidebarLabel="Workspace" mainLabel="Page content" skipLinkLabel="Skip to content"
    navigation={{ open, onOpenChange: setOpen }}
    sidebar={<>
      <Heading level={2}>Discover</Heading>
      <WorkspaceProjectSwitcher workspaces={workspaces} projects={[{ id: 'launch', name: 'Spring launch' }, { id: 'brand', name: 'Brand refresh' }]} workspaceId={workspace} projectId={project} onWorkspaceChange={setWorkspace} onProjectChange={setProject} create={{ href: 'projects/new' }} linkComponent={RouterLink} />
      <SidebarNav label="Primary" groups={discoverGroups(current)} linkComponent={RouterLink} onNavigate={item => { setCurrent(item.id); setOpen(false); }} />
      <SidebarFooter version="1.4.0">
        <SidebarStatus tone="connected" label="Channels connected" action={{ label: 'Manage', href: 'connections' }} linkComponent={RouterLink} />
        <Link href="#/settings" variant="quiet">Settings</Link>
      </SidebarFooter>
    </>}
    topbar={<AppTopbar menuToggle wrap={longCrumbs} breadcrumb={unbroken ? { icon: 'folder', scope: 'Project-' + 'long-name-'.repeat(12), current: 'Events' } : longCrumbs ? { icon: 'home', scope: 'Discover workspace with a complete retained observation context', current: 'Research / Saved keyword report with a very long project and website scope' } : { icon: 'home', scope: 'Acme', current: 'Overview' }}
      search={<SearchField variant="topbar" label="Search everything" hideLabel placeholder="Search" shortcut="/" value={query} onValueChange={setQuery} onClear={() => setQuery('')} clearLabel="Clear search" />}
      badge={{ label: 'Beta', hideOnMobile: true }}
      actions={<AccountMenu name="Alex Morgan" email="alex@example.test" linkComponent={RouterLink} items={[
        { id: 'profile', kind: 'link', label: 'Profile and appearance', icon: 'user', href: 'account' },
        { id: 'sep', kind: 'separator' },
        { id: 'out', kind: 'button', label: 'Sign out', busyLabel: 'Signing out…', busy: signingOut, danger: true, onSelect: () => setSigningOut(true) },
      ]} />} />}
    banners={banner && <Banner tone="warning" live icon="shield" title="Two-factor authentication required" action={{ label: 'Set up two-factor authentication', href: 'account/security' }} linkComponent={RouterLink} onDismiss={() => setBanner(false)}>This workspace requires it.</Banner>}
  >
    <Stack gap={4}>
      <Heading level={1}>Overview</Heading>
      <Text as="p">Page content for {project}.</Text>
    </Stack>
  </AppShell>;
}

const fixtureRoot = document.getElementById('shell-fixture');
if (!fixtureRoot) throw new Error('Shell fixture root is missing.');
createRoot(fixtureRoot).render(params.get('view') === 'app' ? <AppFixture /> : <Fixture />);
