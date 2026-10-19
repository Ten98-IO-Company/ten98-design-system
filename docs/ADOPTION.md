# Adopt @ten98/ui

## Build and install

In this repository, run:

```sh
npm install
npx playwright install chromium
npm run check:all
npm pack
```

The emitted archive is `ten98-ui-0.3.5.tgz`. Copy that archive into the consuming application's `vendor` directory, then run:

```sh
npm install ./vendor/ten98-ui-0.3.5.tgz
```

Commit the archive and updated lockfile together. Use `file:vendor/ten98-ui-0.3.5.tgz` in the application's dependency manifest. An installed archive gives the application a fixed build without requiring a sibling checkout or registry publication. Generate a new versioned archive for an update rather than changing an archive in place. See [the Campaign and Discover integration contract](INTEGRATION.md) for the application-compatible entry points and release workflow.

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

Use semantic variables when adding a product-specific surface:

```css
.project-note {
  color: var(--t98-text);
  background: var(--t98-surface);
  border: 1px solid var(--t98-border);
  border-radius: var(--t98-radius);
  padding: var(--t98-space-4);
  font-family: var(--t98-font);
}
```

Typed references resolve to CSS variables rather than fixed colors:

```tsx
import { tokens } from '@ten98/ui/tokens';

export function ProjectNote() {
  return <p style={{ color: tokens.color.muted }}>Last checked a moment ago.</p>;
}
```

Keep the standard accent across products. Differentiate products through their name, icon and task navigation. Use semantic success, warning, danger and information colors for meaning. A local override must be checked in both themes, interaction states and forced-colors mode.

## Incremental migration

1. Build and install a fixed package version; import its CSS once.
2. Replace local color, spacing and typography literals with `--t98-*` tokens.
3. Adopt the shared shell and page hierarchy without changing the app's route behavior.
4. Replace repeated controls and states one screen at a time.
5. Adopt table, settings, integration and activity patterns where they fit real flows.
6. Verify the actual consumer at narrow and desktop widths, with keyboard navigation and realistic long content.

Remove a local duplicate only after its callers use the shared component. Avoid loading an old global component stylesheet over the new one: broad selectors such as `button`, `input`, `table` and `.sidebar` can change the result. Prefix new shared selectors with `t98-` and keep application selectors local.

The catalogue is the visual benchmark; the consuming application is the acceptance environment. Check route links, pending requests, permission changes, unsaved forms and external provider failures in that application before shipping a migration.
