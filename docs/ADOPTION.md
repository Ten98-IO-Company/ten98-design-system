# Adopt @ten98/ui

## Build and install

In this repository, run:

```sh
npm install
npx playwright install chromium
npm run check:all
npm pack
```

The emitted archive is `ten98-ui-0.18.0.tgz`. Copy that archive into the consuming application's `vendor` directory, then run:

```sh
npm install ./vendor/ten98-ui-0.18.0.tgz
```

Commit the archive and updated lockfile together. Use `file:vendor/ten98-ui-0.18.0.tgz` in the application's dependency manifest. An installed archive gives the application a fixed build without requiring a sibling checkout or registry publication. Generate a new versioned archive for an update rather than changing an archive in place. See [the Campaign and Discover integration contract](INTEGRATION.md) for the application-compatible entry points and release workflow.

The package's public entry points are:

| Import | Purpose |
| --- | --- |
| `@ten98/ui` | React components, patterns and token references |
| `@ten98/ui/styles.css` | Complete tokens and component styles; import once at the app root |
| `@ten98/ui/tokens.css` | Tokens only, for surfaces that do not use the React components |
| `@ten98/ui/tokens` | Typed CSS variable references plus `Theme` and `Density` types |
| `@ten98/ui/app` | Native-markup application components shared by Campaign and Discover |
| `@ten98/ui/app-tokens.css` | Canonical tokens and aliases for existing application variable names |
| `@ten98/ui/app.css` | Shared application base and existing class-name styles |
| `@ten98/ui/product.css` | Scoped product components and fixed templates for existing apps |

Use `styles.css` for the main component API. Importing only `tokens.css` does not style component classes. Existing Campaign and Discover screens use `app-tokens.css` followed by `app.css` and their remaining local styles instead; see [INTEGRATION.md](INTEGRATION.md). The package supplies ESM and declarations, and expects the consuming application's React and React DOM installation to satisfy the peer range.

## Next.js App Router

Import the shared CSS in the root layout. Set the theme on the server-rendered root so the browser can apply system mode through CSS without waiting for JavaScript. This follows Next.js's [external stylesheet](https://nextjs.org/docs/app/getting-started/css#external-stylesheets) guidance.

```tsx
// app/layout.tsx
import '@ten98/ui/styles.css';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="system" data-density="comfortable">
      <body>{children}</body>
    </html>
  );
}
```

Interactive pages and event handlers belong in a Client Component, following Next.js's [server and client component](https://nextjs.org/docs/app/getting-started/server-and-client-components) model. The emitted interactive component modules retain their client boundary.

```tsx
// app/projects/new-project-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@ten98/ui';

export function NewProjectButton() {
  const [creating, setCreating] = useState(false);
  return (
    <>
      <Button onClick={() => setCreating(true)}>New project</Button>
      {creating && <p role="status">Your application opens its project form here.</p>}
    </>
  );
}
```

Pass callbacks from a Client Component. Let Next.js own navigation, route data, server actions and authorization. Use your application's `Link` for links rather than making a button imitate navigation.

## TanStack Router and TanStack Start

Load the same stylesheet in the application root. With TanStack Router file-based routes, a root route can render the shared components alongside the [route outlet](https://tanstack.com/router/latest/docs/guide/outlets):

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import '@ten98/ui/styles.css';

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
  return <Outlet />;
}
```

Set `data-theme` and `data-density` on the host document's `html` element. In a browser-only application, this is usually `index.html`; in TanStack Start, use the existing document/root component that owns `<html>`. Preserve Start's document head, scripts and server rendering configuration rather than replacing them with the small Router example above.

Use the same component imports inside route components:

```tsx
import { Button } from '@ten98/ui';

export function ProjectActions({ onCreate }: { onCreate: () => void }) {
  return <Button onClick={onCreate}>New project</Button>;
}
```

The library does not install TanStack Router, Start, Query or Table into a consumer. Let the app's existing router create navigation links, loaders, search state and pending transitions. Data presented by the library can come from the application's existing query or server layer.

## Theme, density and customization

```html
<html lang="en" data-theme="dark" data-density="compact">
```

Theme values are `light`, `dark` and `system`. `system` follows the browser's color-scheme preference. Density values are `comfortable` and `compact`; compact suits information-heavy desktop work. Keep comfortable spacing for touch-oriented tasks and forms. The consuming app owns storing the user's preference and rendering the chosen attributes consistently across server and client.

Applications do not add their own surfaces, CSS or inline styles. When a screen needs something the library lacks, add it here as a component, flow section or template, release a version, and import it. The typed `tokens` export exists for library code and charts that need a CSS variable reference in JavaScript, not for styling app elements.

Keep the standard accent across products. Differentiate products through their name, icon and task navigation. Use semantic success, warning, danger and information colors for meaning. A local override must be checked in both themes, interaction states and forced-colors mode.

## Applications write no elements

`@ten98/ui` is the only place frontend elements are authored. Application source composes library components, flow sections and templates and never renders raw JSX elements (`div`, `button`, `svg`…), passes `className` or `style`, or imports its own stylesheets. Layout and text come from `Stack`, `Inline`, `Grid`, `FormGrid`, `FormActions`, `FeatureControls`, `Text`, `Heading`, `Link`, `Image`, `List` and `DescriptionList`; router links pass the router's link component to `Link`. The `@ten98/runtime` architecture check enforces this in each app's `test` and `build` scripts, with a per-app baseline that can only go down until it reaches zero.

## Upgrading across releases

Apps can jump several versions at once; every release body lists breaking and behaviour changes first. The ones to check when moving from 0.5.x to 0.13.0:

| Since | Change | What to do |
|---|---|---|
| 0.6.0 | `TimeSeriesChart` stretches to its container width instead of a fixed natural width | Check layouts that sized a wrapper around a chart. |
| 0.6.0, 0.7.0 | Skip these as pins: their `ReplayViewer` content policy could be bypassed by a document starting with `<!--<head>-->` | Use 0.8.0 or later. |
| 0.8.0 | `Progress` with a non-finite value is indeterminate instead of 0% | Pass a finite number to show a percentage. |
| 0.9.0 | `DateRangeField` calls `onChange(range, problem)` on every edit, including an invalid range | Keep the second argument and block submission while it is non-null. |
| 0.9.0 | TypeScript: `ShareSegment.count` is `number \| null` | Handle `null` where you read counts back. |
| 0.9.0 | `AppTopbar` `wrap` clamps the scope to two lines, with the full name in its `title` | Check screens with long workspace or project names. |
| 0.11.0 | `Image` replaces a failed image with a fallback ("Image unavailable") | Pass `fallback` for your own wording. |

## Replace these app patterns

| App pattern | Library component (release) |
|---|---|
| Raw `form` with a busy flag | `Form` (0.11.0); `Dialog` `onSubmit` for modal forms (0.13.0) |
| `label` + `span` + `input`, help text, counters | `Field` (with `count`, 0.11.0), `Input`, `Textarea`, `Select` |
| Inline "I reviewed … then Confirm" blocks | `ReviewConfirm` (0.12.0); `ConfirmDialog` for modal confirmation |
| Pre-publish checks per destination | `ValidationSummary` (0.12.0) |
| "Load more" / "Load older" cursor buttons | `LoadMore` (0.11.0); `ConversationThread` `onLoadOlder` (0.13.0) |
| Inbox or contact lists beside a detail pane | `SelectableList` (0.13.0) with `DetailWorkspace` |
| Message history, comments and replies | `ConversationThread` (`direction`, `actions`, `removed` 0.7.0; `replies` 0.13.0) |
| Editor modals with unsaved changes | `Dialog` `dirty` (0.13.0) |
| Social post, thread, poll and story previews | `ContentPreview` `chrome`, `thread`, `captionLimit`, `poll`, `firstComment` (0.9.0, 0.13.0) |
| Email HTML previews | `SandboxedPreview` (0.8.0) |
| Asset thumbnails and image placeholders | `ResourceCard` `media`/`tags`, `Image` `fallback` (0.11.0); `MediaStrip` facts (0.8.0) |
| Audio, video and quotes in messages | `MediaPlayer`, `Blockquote` (0.7.0) |
| Searchable selects, async results, tags | `Combobox` (async 0.7.0, option `description` 0.11.0), `MultiCombobox` (0.7.0) |
| Hand-drawn SVG charts | `TimeSeriesChart`, `BarList`, `ShareChart`, `WeekdayHourGrid` (0.9.0) |
| Session replay players | `IsolatedPlayerFrame` (0.10.0); `ReplayViewer` for simple `srcDoc` players |

Import `@ten98/ui/app-tokens.css`, `@ten98/ui/app.css` and `@ten98/ui/product.css` once: component styles live in `product.css`.

`product.css` loads every component sheet. To load only what a screen family uses, import the sheets directly from `@ten98/ui/css/<sheet>.css` instead (keep `app-tokens.css` and `app.css` first):

| Sheet | Styles |
|---|---|
| `tokens.css`, `primitives.css`, `structure.css` | Always needed: tokens, Button, Field, Dialog, Alert, Badge, layout and text primitives |
| `patterns.css` | DataTable, MetricCard, ResourceCard, AppShell, PageHeader, Stepper |
| `workspace.css` | ConfirmDialog, ReviewConfirm, CopyButton, DateRangeField, AuthLayout |
| `products.css` | Evidence, composition, coordination and analytics components (ConversationThread, SelectableList, ContentPreview, SandboxedPreview, ValidationSummary, OperationResults …) |
| `navigation.css`, `shell.css` | Sidebar, AppTopbar, SectionNav, search and banners |
| `controls.css` | Form, Combobox, MultiCombobox, Popover, FieldList, FileField, MediaPlayer, LoadMore and other controls |
| `account-flows.css`, `workspace-flows.css` | Settings and workspace flows |
| `charts.css` | TimeSeriesChart, BarList, ShareChart, ProportionBar, WeekdayHourGrid |
| `spatial.css` | CountryMap, heatmaps, ReplayViewer, IsolatedPlayerFrame, CalendarMonth |

For example, an app with no maps, heatmaps, replays or calendar can leave out `spatial.css` (about 10.9 KB minified, 1.5 KB gzip in Campaign's build). Removing unused rules inside the sheets an app does load is a build-time purge in the app.

## Incremental migration

1. Build and install a fixed package version; import its CSS once.
2. Replace local elements, `className`/`style` props and app CSS with library components, starting from the layout primitives (`Stack`, `Inline`, `Grid`, `Text`, `Heading`, `Link`) and the gaps listed for the app.
3. Adopt the shared shell and page hierarchy without changing the app's route behavior.
4. Replace repeated controls and states one screen at a time.
5. Adopt table, settings, integration and activity patterns where they fit real flows.
6. Verify the actual consumer at narrow and desktop widths, with keyboard navigation and realistic long content.

Remove a local duplicate only after its callers use the shared component. Avoid loading an old global component stylesheet over the new one: broad selectors such as `button`, `input`, `table` and `.sidebar` can change the result. Prefix new shared selectors with `t98-` and keep application selectors local.

The catalogue is the visual benchmark; the consuming application is the acceptance environment. Check route links, pending requests, permission changes, unsaved forms and external provider failures in that application before shipping a migration.
