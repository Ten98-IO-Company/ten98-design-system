# Ten98 Design System

One consistent, accessible interface for every Ten98 app.

`@ten98/ui` gives Ten98 apps a shared set of design tokens, React components, interaction patterns, feature flows and page templates, so every screen looks and behaves the same way. It's for Ten98 apps and their developers: Campaign and Discover build their screens from it, and new tools start from it.

## Why the Ten98 Design System

- **One look across the suite.** Brand, colour, type, spacing, light and dark themes, and comfortable or compact density all come from the same tokens.
- **Accessible by default.** Keyboard support, visible focus, 44px touch targets, reduced-motion support, and layouts that reflow at 320px and at 200% text. Every release is checked in real browsers.
- **Complete building blocks.** Components, plus full feature flows and page templates, with a live catalogue that shows every state and its copyable source.
- **Plain React and TypeScript.** Named imports with TypeScript declarations. No styling runtime, router or Tailwind required.
- **Reproducible releases.** Each release is a byte-reproducible archive with a SHA-256 checksum and a verification record.
- **Open source** under the MIT licence.

## Use it

Install a release archive from [Releases](https://github.com/Ten98-IO-Company/ten98-design-system/releases), after checking it against its `.sha256` file:

```sh
npm install ./vendor/ten98-ui-<version>.tgz
```

```tsx
import '@ten98/ui/styles.css';
import { Button } from '@ten98/ui';

export function CreateProjectButton({ onCreate }: { onCreate: () => void }) {
  return <Button onClick={onCreate}>New project</Button>;
}
```

- Set `data-theme` (`light`, `dark` or `system`) and `data-density` (`comfortable` or `compact`) on the app root.
- Existing Campaign and Discover screens use `@ten98/ui/app` with `app-tokens.css`, `app.css` and `product.css`.
- Peer dependencies: React and React DOM `^18.3.0 || ^19.0.0`.
- Every export's props are documented in the TypeScript declarations shipped in `dist/`.
- Apps don't author their own UI elements or shared styles. A missing piece is added here first, then adopted.

## Get started

Running the catalogue, framework examples, the full component reference, upgrade notes and the integration contract are in the [wiki](https://github.com/Ten98-IO-Company/ten98-design-system/wiki).

## Community

- Questions and ideas: [Discussions](https://github.com/Ten98-IO-Company/ten98-design-system/discussions)
- Bugs and adoption gaps: [Issues](https://github.com/Ten98-IO-Company/ten98-design-system/issues), tracked on the [Ten98 project](https://github.com/orgs/Ten98-IO-Company/projects/1)
- Releases: [GitHub Releases](https://github.com/Ten98-IO-Company/ten98-design-system/releases)
- Contributing: [contributing guide](https://github.com/Ten98-IO-Company/.github/blob/main/CONTRIBUTING.md) and [Code of Conduct](https://github.com/Ten98-IO-Company/.github/blob/main/CODE_OF_CONDUCT.md)

## Security

Please report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/Ten98-IO-Company/ten98-design-system/security/advisories/new), not in public issues. See the [security policy](https://github.com/Ten98-IO-Company/.github/blob/main/SECURITY.md).

## Legal

- Licence: [MIT](https://github.com/Ten98-IO-Company/ten98-design-system/blob/main/LICENSE). Third-party components and their licences: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- Ten98 and the Ten98 logo are trademarks of Ten98 Technologies Ltd. The MIT licence covers the code, not the name or logo: forks must use their own name and branding.
- The hosted apps at *.ten98.io are covered by the [Ten98 privacy policy](https://ten98.io/legal/privacy). Self-hosted installs are run by their operator and send no data to Ten98.
- Provided "as is", without warranty, as stated in the licence.
