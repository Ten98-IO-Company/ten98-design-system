import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Card, Grid, Heading, Link, SearchField, SidebarNav, Stack, Text, WorkspaceProjectSwitcher, type NavLinkComponent, type SidebarNavGroup } from '@ten98/ui';
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
      <Card title="Workspace and project"><Switchers /></Card>
      <Card title="Search"><Searches /></Card>
    </Grid>
  </Stack>;
}

const fixtureRoot = document.getElementById('shell-fixture');
if (!fixtureRoot) throw new Error('Shell fixture root is missing.');
createRoot(fixtureRoot).render(<Fixture />);
