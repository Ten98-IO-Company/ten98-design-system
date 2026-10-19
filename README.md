# ten98 Design System

`@ten98/ui` is the shared React and TypeScript foundation for ten98 internal tools. It brings the suite's branding, controls, application layouts and recurring work patterns into one installable library, with a working component catalogue alongside it.

The system is modular: canonical design tokens feed small typed components, which compose into reusable patterns. Use named imports such as `import { Button, Card, Alert } from '@ten98/ui'`; routing, data and business behavior stay in the application. New shared UI is designed, built and validated in this project, then integrated by each consuming app.

The starting point is the existing Campaign and Discover interface: a purple accent, quiet surfaces, compact application navigation and clear information hierarchy. This repository does not implement the applications' authentication services, campaign engines, workflow runtimes, building controls, hypervisors or telephony servers.

## Run the catalogue

Requires Node.js 22.14 or newer.

```sh
npm install
npm run dev
```

Open [the local catalogue](http://127.0.0.1:5198). It is a reference application with illustrative data; its examples do not connect to production services.

Browse all 73 component exports by category, name, use or state. Each component has Overview, Examples, Props, Tokens and States pages, a shareable URL, and complete copyable TSX. The catalogue includes 402 state specimens, all 96 canonical tokens and 85 existing-app aliases. Token values update with appearance and density. Use `Ctrl/Cmd K` to find components, tokens and guides. Sidebar menus scroll with wheel, touch and keyboard without a visible scrollbar. Twenty-eight interactive flow recipes cover C1–C8, D1–D17 and three cross-product tasks. Each includes copyable rendered source; researched flows also provide reference links and acceptance cases. Five fixed templates include hierarchy and behavior rules.

The [Brand & login reference](http://127.0.0.1:5198/#brand) uses Campaign's existing 98 mark, wordmark, icon geometry and login composition. The catalogue favicon also comes from Campaign. App adapter previews are isolated so their existing global styles do not alter the documentation interface.

```sh
npx playwright install chromium
npm run check:all
npm pack
```

`check:all` typechecks the project, emits the library into `dist`, builds the catalogue into `site-dist`, runs the native checks and executes Playwright. See [browser testing](docs/BROWSER-TESTING.md) for development and failure traces. `npm pack` creates `ten98-ui-0.3.3.tgz` for installation in another tool. These checks are development evidence, not an accessibility certification or a guarantee about a consuming application.

## Use in an application

After building and packing this repository, copy the archive into the consuming application's `vendor` directory and install it:

```sh
npm install ./vendor/ten98-ui-0.3.3.tgz
```

Commit the archive and the application's lockfile together. Campaign and Discover initially adopted the same 0.2.0 archive as `file:vendor/ten98-ui-0.2.0.tgz`; their builds do not require a sibling checkout. See [the integration contract](docs/INTEGRATION.md) for the shared application components and update workflow.

For new screens, use the main component API and `styles.css` shown below. Existing Campaign and Discover screens use the compatible `app` API and load `app-tokens.css`, `app.css` and `product.css` before local overrides, as described in the integration contract.

```tsx
import '@ten98/ui/styles.css';
import { Button } from '@ten98/ui';

export function CreateProjectButton({ onCreate }: { onCreate: () => void }) {
  return <Button onClick={onCreate}>New project</Button>;
}
```

Set `data-theme="light"`, `"dark"` or `"system"` on your application root, and `data-density="comfortable"` or `"compact"` to control density. The default palette is light and the default density is comfortable. Use semantic `--t98-*` tokens and `t98-` class names when extending the system.

React and React DOM are peer dependencies; the supported range for each is `^18.3.0 || ^19.0.0`. The package ships ESM JavaScript and TypeScript declarations. It does not require Tailwind, a particular router, or a component styling runtime.

## Documentation

- [Adoption and framework examples](docs/ADOPTION.md): Next.js, TanStack Router, themes, local installation and migration.
- [Campaign and Discover integration](docs/INTEGRATION.md): shared application exports, stylesheet order, ownership and reproducible updates.
- [Component inventory and API](docs/COMPONENTS.md): exports, ownership boundaries and intended use.
- [UX patterns and suite coverage](docs/UX-PATTERNS.md): shared interaction rules and coverage for all ten tools.
- [Decisions and source evidence](docs/DECISIONS.md): the interpretation, audited baseline and maintenance rules.
- [Bounded swarm workflow](docs/SWARM.md): worker ownership, acceptance gates and stop rules.
- [Competitive research](docs/research/README.md): the initial ten-tool scope and proposed flow decisions.
- [Fixed layouts and usage](docs/LAYOUTS-AND-USAGE.md): template selection, hierarchy, slot order and consistent behavior.
- [Campaign and Discover completion](docs/CAMPAIGN-DISCOVER-COMPLETION.md): flow coverage and consumer acceptance.
- [Release validation](docs/VALIDATION.md): automated and browser checks, package verification and integration limits.

Start with the shared shell, field, button, table and state patterns. Keep routing, data fetching, permissions enforcement and product-specific business logic in each application. Add a new shared pattern when a real tool needs it and its behavior can be named clearly.

## License

Released under the [MIT license](LICENSE). Source provenance and retained notices are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
