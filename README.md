# Ten98 Design System

One consistent, accessible interface for every Ten98 app.

`@ten98/ui` gives Ten98 apps a shared set of design tokens, React components, interaction patterns, feature flows and page templates, so every screen looks and behaves the same way. It's for Ten98 apps and their developers: Campaign and Discover build their screens from it, and new tools start from it.

## Why Design System

- **One look across the suite.** Brand, colour, type, spacing, light and dark themes, and comfortable or compact density all come from the same tokens.
- **Accessible by default.** Keyboard support, visible focus, 44px touch targets, reduced-motion support, and layouts that reflow at 320px and at 200% text. Every release is checked in real browsers.
- **Complete building blocks.** Components, plus full feature flows and page templates, with a live catalogue that shows every state and its copyable source.
- **Plain React and TypeScript.** Named imports with TypeScript declarations. No styling runtime, router or Tailwind required.
- **Reproducible releases.** Each release is a byte-reproducible archive with a SHA-256 checksum and a verification record.
- Open source under the MIT licence.

## Get started

- Install a release archive from [GitHub Releases](https://github.com/Ten98-IO-Company/ten98-design-system/releases) after checking its `.sha256` file: `npm install ./vendor/ten98-ui-<version>.tgz`.
- Import `@ten98/ui/styles.css` once and components from `@ten98/ui`. Existing Campaign and Discover screens use `@ten98/ui/app` with `app-tokens.css`, `app.css` and `product.css`.
- Set `data-theme` (`light`, `dark` or `system`) and `data-density` (`comfortable` or `compact`) on the app root.
- Peer dependencies: React and React DOM `^18.3.0 || ^19.0.0`. Props are documented in the TypeScript declarations in `dist/`.
- Apps don't author their own UI elements or shared styles. A missing piece is added here first, then adopted.

Installation, configuration and guides are in the [wiki](https://github.com/Ten98-IO-Company/ten98-design-system/wiki):

- [Development](https://github.com/Ten98-IO-Company/ten98-design-system/wiki/Development): run the catalogue locally, run the tests and contribute code.
- [Usage](https://github.com/Ten98-IO-Company/ten98-design-system/wiki/Usage): install a release in an app, import styles and components, and set themes.
- [Releases](https://github.com/Ten98-IO-Company/ten98-design-system/wiki/Releases): cut, verify and upgrade a release.
- [Reference](https://github.com/Ten98-IO-Company/ten98-design-system/wiki/Reference): every export, its props and its intended use.

## Community

- Questions and ideas: [Discussions](https://github.com/Ten98-IO-Company/ten98-design-system/discussions)
- Bugs and feature requests: [Issues](https://github.com/Ten98-IO-Company/ten98-design-system/issues)
- Roadmap: [Ten98 Design System Project](https://github.com/orgs/Ten98-IO-Company/projects/4)
- Releases: [GitHub Releases](https://github.com/Ten98-IO-Company/ten98-design-system/releases)
- Contributing: [contributing guide](https://github.com/Ten98-IO-Company/.github/blob/main/CONTRIBUTING.md) · [Code of Conduct](https://github.com/Ten98-IO-Company/.github/blob/main/CODE_OF_CONDUCT.md)

## Security

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/Ten98-IO-Company/ten98-design-system/security/advisories/new); see the [security policy](https://github.com/Ten98-IO-Company/.github/blob/main/SECURITY.md). Please don't open public issues for security problems.

## Legal

- Licence: [MIT](LICENSE). Third-party components and their licences: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- Provided "as is", without warranty, as stated in the licence.
- Ten98 and the Ten98 logo are trademarks of Ten98 Technologies Ltd. The MIT licence covers the code, not the name or logo: forks must use their own name and branding.
- The hosted apps at *.ten98.io are covered by the Ten98 privacy policy (https://ten98.io/legal/privacy). Self-hosted installs are run by their operator and send no data to Ten98.
