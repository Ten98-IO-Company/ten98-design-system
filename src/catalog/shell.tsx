import { SearchField, SidebarNav, WorkspaceProjectSwitcher } from '../lib';
import { tsx, type ComponentEntry } from './model';

const noop = () => undefined;
const navCode = tsx(['SidebarNav'], `<SidebarNav
  label="Main"
  filter={filter}
  groups={[
    { id: 'work', label: 'Work', items: [
      { id: 'overview', label: 'Overview', icon: 'home', href: 'overview', current: true },
      { id: 'inbox', label: 'Inbox', icon: 'inbox', onSelect: () => openInbox(), badge: 3, badgeLabel: 'unread', keywords: ['messages'] },
    ] },
    { id: 'manage', label: 'Manage', items: [{ id: 'settings', label: 'Settings', icon: 'settings', href: 'settings' }] },
  ]}
  emptyFilter={query => \`No pages match "\${query}"\`}
  onNavigate={() => closeDrawer()}
/>`, "const filter = '';\nconst openInbox = () => undefined;\nconst closeDrawer = () => undefined;");
const switcherCode = tsx(['WorkspaceProjectSwitcher'], `<WorkspaceProjectSwitcher
  workspaces={[{ id: 'acme', name: 'Acme', roleLabel: 'Admin' }, { id: 'labs', name: 'Labs' }]}
  projects={[{ id: 'launch', name: 'Spring launch' }]}
  workspaceId="acme"
  projectId="launch"
  onWorkspaceChange={id => setWorkspace(id)}
  onProjectChange={id => setProject(id)}
  create={{ onSelect: () => openCreateProject() }}
/>`, 'const setWorkspace = (id: string) => undefined;\nconst setProject = (id: string) => undefined;\nconst openCreateProject = () => undefined;');
const searchCode = tsx(['SearchField'], `<SearchField
  label="Search pages"
  hideLabel
  placeholder="Search"
  shortcut="/"
  value={query}
  onValueChange={setQuery}
  onClear={() => setQuery('')}
  clearLabel="Clear search"
  status="3 results"
/>`, "const [query, setQuery] = useState('');", ['useState']);

const nav = (jsx: string, setup = '') => tsx(['SidebarNav'], jsx, setup);
const switcher = (jsx: string) => tsx(['WorkspaceProjectSwitcher'], jsx, "const noop = () => undefined;");
const search = (jsx: string) => tsx(['SearchField'], jsx, "const noop = () => undefined;");

const linkContract = 'With a linkComponent, `href` is a key your component resolves (for example a route id), not necessarily a URL. The component receives href, className, children, aria-current and onClick.';
const presentation = 'Presentation only: routing, authorization, data loading and draft guards stay in the application.';

export const shellEntries: ComponentEntry[] = [
  {
    name: 'SidebarNav', category: 'Navigation',
    description: 'Grouped navigation list with current-page state, badges and a client-side filter.',
    usage: `Place inside the sidebar. Items with href render links (through linkComponent when given); items with onSelect render buttons for guarded navigation. ${linkContract} ${presentation}`,
    props: [
      { name: 'label', type: 'string', required: true, description: 'Accessible name of the navigation landmark.' },
      { name: 'groups', type: '{ id; label?; items }[]', required: true, description: 'Each item has id, label, icon, current, badge, badgeLabel, hidden, keywords, disabled and either href or onSelect.' },
      { name: 'linkComponent', type: 'ComponentType<{ href; className?; children?; aria-current?; onClick? }>', description: 'Router link used for href items. Defaults to a native anchor.' },
      { name: 'filter', type: 'string', description: 'Case-insensitive match on label and keywords; other items get the hidden attribute.' },
      { name: 'onNavigate', type: '(item) => void', description: 'Called after the item’s own handler, for example to close a mobile drawer.' },
      { name: 'emptyFilter', type: '(query: string) => ReactNode', description: 'Content shown when the filter matches nothing.' },
    ],
    tokens: ['--t98-control-touch', '--t98-accent-soft', '--t98-accent', '--t98-muted', '--t98-focus'],
    accessibility: ['Rendered as a labelled nav landmark with one list per group.', 'The current item exposes aria-current="page".', 'The badge label is visually hidden text announced with the item.', 'Items are at least 44px tall and use logical properties, so the layout mirrors in right-to-left.'],
    related: ['SearchField', 'WorkspaceProjectSwitcher', 'SidebarFooter'],
    example: navCode,
    states: [{
      name: 'Default', description: 'Current page, badge and a button item.', code: navCode,
      preview: <SidebarNav label="Main" groups={[
        { id: 'work', label: 'Work', items: [
          { id: 'overview', label: 'Overview', icon: 'home', href: '#overview', current: true },
          { id: 'inbox', label: 'Inbox', icon: 'inbox', onSelect: noop, badge: 3, badgeLabel: 'unread' },
        ] },
      ]} />,
    }, {
      name: 'Filtered', description: 'Non-matching items are hidden.',
      code: nav(`<SidebarNav label="Filtered" filter="set" groups={[{ id: 'all', items: [
  { id: 'overview', label: 'Overview', icon: 'home', href: 'overview' },
  { id: 'settings', label: 'Settings', icon: 'settings', href: 'settings' },
] }]} />`),
      preview: <SidebarNav label="Filtered" filter="set" groups={[{ id: 'all', items: [
        { id: 'overview', label: 'Overview', icon: 'home', href: '#overview' },
        { id: 'settings', label: 'Settings', icon: 'settings', href: '#settings' },
      ] }]} />,
    }],
  },
  {
    name: 'WorkspaceProjectSwitcher', category: 'Navigation',
    description: 'Workspace and project selectors with loading, empty and create states.',
    usage: `Shows the signed-in user's current workspace and project (User > Workspace > Project). Pass create only when the user may create projects. ${linkContract} ${presentation}`,
    props: [
      { name: 'workspaces', type: '{ id; name; roleLabel? }[]', required: true, description: 'Empty renders text instead of a disabled select.' },
      { name: 'projects', type: '{ id; name }[] | null', required: true, description: 'null means loading.' },
      { name: 'workspaceId / projectId', type: 'string | null', required: true, description: 'Selected ids.' },
      { name: 'onWorkspaceChange / onProjectChange', type: '(id: string) => void', required: true, description: 'Called with the chosen id.' },
      { name: 'create', type: '{ label? } & ({ href } | { onSelect })', description: 'Absent means the user cannot create projects.' },
      { name: 'labels', type: '{ workspace; project; noWorkspaces; loading; choose; noProjects }', description: 'Localised copy.' },
      { name: 'disabled', type: 'boolean', description: 'Disables every control.' },
      { name: 'linkComponent', type: 'NavLinkComponent', description: 'Router link used for create.href.' },
    ],
    tokens: ['--t98-control-touch', '--t98-muted', '--t98-control-border', '--t98-focus'],
    accessibility: ['The role caption is connected to the workspace select with aria-describedby.', 'Loading sets aria-busy on the project select.', 'The create control’s accessible name includes the workspace name.'],
    related: ['SidebarNav', 'Select'],
    example: switcherCode,
    states: [{
      name: 'Default', description: 'Workspace with role caption and a create action.', code: switcherCode,
      preview: <WorkspaceProjectSwitcher workspaces={[{ id: 'acme', name: 'Acme', roleLabel: 'Admin' }, { id: 'labs', name: 'Labs' }]} projects={[{ id: 'launch', name: 'Spring launch' }]} workspaceId="acme" projectId="launch" onWorkspaceChange={noop} onProjectChange={noop} create={{ onSelect: noop }} />,
    }, {
      name: 'Loading', description: 'Projects are loading.',
      code: switcher(`<WorkspaceProjectSwitcher workspaces={[{ id: 'acme', name: 'Acme' }]} projects={null} workspaceId="acme" projectId={null} onWorkspaceChange={noop} onProjectChange={noop} />`),
      preview: <WorkspaceProjectSwitcher workspaces={[{ id: 'acme', name: 'Acme' }]} projects={null} workspaceId="acme" projectId={null} onWorkspaceChange={noop} onProjectChange={noop} />,
    }, {
      name: 'No projects', description: 'The project list is empty.',
      code: switcher(`<WorkspaceProjectSwitcher workspaces={[{ id: 'acme', name: 'Acme' }]} projects={[]} workspaceId="acme" projectId={null} onWorkspaceChange={noop} onProjectChange={noop} />`),
      preview: <WorkspaceProjectSwitcher workspaces={[{ id: 'acme', name: 'Acme' }]} projects={[]} workspaceId="acme" projectId={null} onWorkspaceChange={noop} onProjectChange={noop} />,
    }],
  },
  {
    name: 'SearchField', category: 'Navigation',
    description: 'Search input with an optional shortcut hint, clear button and polite status region.',
    usage: `Use in the top bar (variant="topbar") or inline above a list. Pair it with SidebarNav filter or a results list, and report counts through status. ${presentation}`,
    props: [
      { name: 'label', type: 'string', required: true, description: 'Accessible name.' },
      { name: 'value / onValueChange', type: 'string / (value: string) => void', required: true, description: 'Controlled value.' },
      { name: 'placeholder', type: 'string', description: 'Hint text.' },
      { name: 'hideLabel', type: 'boolean', description: 'Hides the label visually; it stays in the accessibility tree.' },
      { name: 'shortcut', type: 'string', description: 'Display-only keyboard hint, hidden from assistive technology. Register the key in the application.' },
      { name: 'inputRef', type: 'Ref<HTMLInputElement>', description: 'Ref to the input, for example to focus it from a shortcut.' },
      { name: 'status', type: 'ReactNode', description: 'Announced politely from a status region that exists before any text.' },
      { name: 'onClear / clearLabel', type: '() => void / string', description: 'The clear button appears only while there is a value.' },
      { name: 'variant', type: "'topbar' | 'inline'", defaultValue: "'inline'", description: 'Pill shape for the top bar.' },
    ],
    tokens: ['--t98-control-touch', '--t98-subtle', '--t98-muted', '--t98-radius-pill'],
    accessibility: ['A native type="search" input with a real label.', 'The status region is always in the DOM so later text is announced.', 'The clear button is at least 44px and named by clearLabel.'],
    related: ['SidebarNav', 'Input'],
    example: searchCode,
    states: [{
      name: 'Default', description: 'Hidden label with a shortcut hint.', code: searchCode,
      preview: <SearchField label="Search pages" hideLabel placeholder="Search" shortcut="/" value="" onValueChange={noop} />,
    }, {
      name: 'With value', description: 'Clear button and status.',
      code: search(`<SearchField label="Search results" value="launch" onValueChange={noop} onClear={noop} status="3 results" />`),
      preview: <SearchField label="Search results" value="launch" onValueChange={noop} onClear={noop} status="3 results" />,
    }],
  },
];
