# Existing application sidebars

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
