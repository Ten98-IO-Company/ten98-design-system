# Existing application sidebars

## Account controls and the sidebar footer

Place one `AccountMenu` in the top-right page header. The trigger opens a compact dropdown with the person's name/email and the app's existing account links and sign-out action. Remove the duplicated sidebar profile block. Keep `SidebarFooter` at the bottom of the sidebar for Settings, optional connection links and the actual application version supplied by the build. The UI library version is not the app version.

```tsx
<AccountMenu name={user.name} email={user.email} avatar={existingAvatar} linkComponent={RouterLink} items={[
  { id: 'profile', kind: 'link', label: 'Profile and appearance', icon: 'user', href: 'account' },
  { id: 'security', kind: 'link', label: 'Account security', icon: 'shield', href: 'account/security' },
  { id: 'sep', kind: 'separator' },
  { id: 'out', kind: 'button', label: 'Sign out', busyLabel: 'Signing out…', busy: signOutBusy, danger: true, onSelect: signOut },
]} />
```

`items` render the same native links and buttons as `children`, so every dismissal rule below applies unchanged. `children` still works but is deprecated in favour of `items`; if both are given, items render first. A busy item is disabled, sets `aria-busy` and shows `busyLabel`.

```tsx
<SidebarFooter version={appVersion}>
  <SidebarStatus tone="connected" label="Channels connected" action={{ label: 'Manage', href: 'connections' }} linkComponent={RouterLink} />
</SidebarFooter>
```

The code illustrates slots; keep the application's real router, routes, labels and handlers. Campaign retains its guarded `setPage` and `signOut`; Discover retains its native TanStack links, session-generation guard and logout/reset/redirect order. Do not add a generic sign-out guard over those controllers. Preserve role-gated account/security/identity choices and app-owned errors. The menu invokes no authentication request and creates no route.

Load `styles.css` for new applications or the existing `app-tokens.css`, `app.css`, `product.css` sequence for Campaign and Discover. The `avatar` slot accepts the app's non-interactive existing initials or image. Supplied children retain native link, button and form semantics. Prevented router-link activations still dismiss the disclosure without changing their event or moving focus away from an app-owned guard dialog. Invalid native form submission keeps its fields available; a successful submit event dismisses it.

This is a nonmodal disclosure with ordinary Tab navigation, not an ARIA application menu. Escape closes and returns focus to its trigger. Outside interaction and Tab exit close without stealing focus. Identity text wraps; disabled and busy actions cannot dispatch. Keep the sidebar free of a second profile/sign-out block and preserve its wheel, touch and keyboard scrolling without a visible scrollbar.

The catalogue's **AccountMenu** and **SidebarFooter** entries provide complete TSX, props, tokens, and open, closed, long-content and busy examples. Verify native account navigation, draft cancellation, sign-out success/failure and permission gates in the consuming app, in light/dark and narrow/wide layouts.

## Complete application shell

`AppShell` provides the whole frame, so the application writes no elements, class names or styles. Pass `navigation` and `AppShell` runs `useSidebarNavigation` itself: it labels the sidebar, adds the shade (only while the drawer is modal) and a labelled close button, and shares its state with `AppTopbar menuToggle` (`aria-controls`, `aria-expanded`, focus return). The top bar sits in a `header` outside `main`; `banners` stack above the content; the skip link targets `main`.

```tsx
import { AccountMenu, AppShell, AppTopbar, Banner, SearchField, SidebarFooter, SidebarNav, SidebarStatus, WorkspaceProjectSwitcher, type NavLinkComponent } from '@ten98/ui';

// TanStack-style wrapper: `href` is the app's key, mapped to `to` and `search`. It must honour event.defaultPrevented.
const routes = { overview: { to: '/', search: {} }, alerts: { to: '/alerts', search: { view: 'new' } } };
const RouterLink: NavLinkComponent = ({ href, ...props }) => <Link {...routes[href]} {...props} />;

<AppShell
  sidebarLabel="Workspace" mainLabel="Page content"
  navigation={{ open, onOpenChange: setOpen }}
  sidebar={<>
    <WorkspaceProjectSwitcher workspaces={workspaces} projects={projects} workspaceId={workspaceId} projectId={projectId}
      onWorkspaceChange={setWorkspaceId} onProjectChange={setProjectId} create={{ href: 'projects/new' }} linkComponent={RouterLink} />
    <SidebarNav label="Primary" linkComponent={RouterLink} onNavigate={() => setOpen(false)} groups={groups} />
    <SidebarFooter version={appVersion}>
      <SidebarStatus tone="connected" label="Channels connected" />
    </SidebarFooter>
  </>}
  topbar={<AppTopbar menuToggle breadcrumb={{ icon: 'home', scope: workspace.name, current: 'Overview' }}
    search={<SearchField variant="topbar" label="Search" hideLabel shortcut="/" value={query} onValueChange={setQuery} />}
    actions={<AccountMenu name={user.name} email={user.email} linkComponent={RouterLink} items={accountItems} />} />}
  banners={needsTwoFactor && <Banner tone="warning" live icon="shield" title="Two-factor authentication required"
    action={{ label: 'Set up two-factor authentication', href: 'account/security' }} linkComponent={RouterLink}>This workspace requires it.</Banner>}
>
  {page}
</AppShell>
```

`SidebarNav` `href` is a key your `linkComponent` resolves, so Discover can map it to a router `to` and `search`. An item may have `href`, `onSelect` or both. With both, the anchor always renders. On a plain primary click `onSelect(item, event)` runs first; if it calls `event.preventDefault()` (for example while a draft is unsaved) navigation is cancelled and `onNavigate` is not called. Ctrl, meta, shift, alt and non-primary clicks skip both callbacks and keep the browser default. Items with only `onSelect` render buttons. `keywords` extend filter matching, and a group whose items are all hidden or filtered is hidden. Campaign passes real hrefs plus a guarded `onSelect`:

```tsx
{ id: 'drafts', label: 'Drafts', icon: 'file', href: 'drafts', onSelect: (_item, event) => { if (hasUnsavedDraft) { event.preventDefault(); askToDiscard('drafts'); } } }
```

`WorkspaceProjectSwitcher` accepts `initials` per workspace for a decorative avatar beside the select. `AppShell` keeps working without `navigation` (static stack below 760px), with `header` instead of `topbar`. The drawer breakpoint is `defaultSidebarMediaQuery`; a custom `navigation.mediaQuery` must match the stylesheet.

## Responsive navigation

Import `useSidebarNavigation` from `@ten98/ui` when an application already owns its shell and sidebar contents. `AppShell` remains the static stacking layout; the hook adds mobile drawer behavior without replacing routes, authorization or draft controllers.

The catalogue's **useSidebarNavigation** entry contains a complete copyable TSX file, scoped example CSS and responsive, mobile and desktop states. Load the package's existing stylesheet once for its theme tokens. Production apps may retain their established shell CSS.

```tsx
const sidebarRef = useRef<HTMLElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);
const [open, setOpen] = useState(false);
const navigation = useSidebarNavigation({
  open, onOpenChange: setOpen, sidebarRef, triggerRef,
});
```

The options interface is also exported as `SidebarNavigationOptions` for typed integrations.

Attach `sidebarRef` and all `navigation.sidebarProps` to the same labelled `aside`. Give it a unique ID. Attach `triggerRef` to a native menu button with `aria-controls` pointing to that ID and `aria-expanded={open}`. Keep a labelled close button inside the drawer. Render an app-owned backdrop only while `navigation.modal` is true and close it with `setOpen(false)`.

Spread `navigation.contentProps` onto the sibling content wrapper. Preserve the hook's `inert`, role, `aria-modal`, `tabIndex`, `data-sidebar-state` and visibility style. If the app adds an inline style, merge the supplied style instead of replacing it. Keep the application's single main landmark; the hook adds none.

The default media query is `(max-width:760px)`. A matching query plus `open` enables modal focus handling and content inertness. A closed mobile sidebar is inert and hidden; desktop remains interactive and clears a previously open mobile drawer. A custom `mediaQuery` must agree with the app's CSS breakpoint. The catalogue forces matching/nonmatching queries only to demonstrate the two modes at any gallery width.

Start closed to keep server and initial client rendering aligned. The hook discovers the browser viewport after mounting; the shared app stylesheet hides closed mobile sidebars before that effect. Apps with custom markup or breakpoints must provide the equivalent initial closed visibility rule. The hook handles native `inert` serialization for the supported React 18 and React 19 peers.

Only visible, enabled controls enter the mobile Tab cycle. Escape requests closure, body scrolling is restored on cleanup, and a visible connected trigger regains focus. Native modal dialogs opened with `showModal()` keep their own Escape, Tab and focus behavior. A nonmodal `dialog.show()` does not release drawer containment.

The app must guard navigation before committing a route, record selection or draft discard. Closing a drawer does not discard a draft. Place app-owned native dialogs outside the inert content wrapper; the catalogue demonstrates a native `dialog` with Keep editing and explicit Discard actions. It performs no authentication, persistence or provider requests.

`AuthLayout.title` is optional. Supply it for the layout's h1, or omit it when the application's native form already contains its heading. Children retain their form, validation, autocomplete and submission contracts.
