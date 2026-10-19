# Design system decisions

## 001 — Purpose and boundary

Understood as: build a reusable, installable React and TypeScript design system for the ten98 internal-tool suite, grounded in existing Campaign and Discover interfaces, with common branding, components and UX patterns that work in TanStack and Next.js applications and reduce repeated implementation.

The deliverable is a design-system foundation with a working catalogue, reusable UI, adoption instructions and explicit product coverage. It is not a claim that all ten planned applications or their specialized runtimes have been implemented.

The package is `@ten98/ui`, version `0.2.2`. React and React DOM remain peer dependencies. The library ships ESM modules and declarations, with client boundaries retained for interactive modules. Consumer apps own routing and data orchestration.

## 002 — Brand baseline

The local audit found a shared internal-app appearance in Campaign and Discover: purple `#5943CE`, pale lavender highlights, neutral backgrounds, compact navigation, Segoe UI body text and Aptos Display headings. Discover already contains a semantic token layer and adopted Campaign visual elements.

Use that internal-app direction as the baseline. The public ten98.io website uses a blue accent and a marketing layout; it is source context rather than the internal application's visual template. A future rebrand should change the shared semantic tokens and branding component, then be reviewed across actual product screens.

The font stacks use fonts available on the host and fallbacks; the package does not ship proprietary font files. Check typography on the target platforms because local font availability changes metrics.

## 003 — Source evidence

Paths below are relative to the common parent directory containing the sibling repositories. They identify the audit snapshot of 19 October 2026, not dependencies that consumers must install.

| Existing source | Evidence |
| --- | --- |
| `ten98-campaign/package.json` | React 19, TypeScript and Vite; no existing component framework dependency |
| `ten98-campaign/src/styles.css` | Internal palette, shell proportions, typography, controls and cards |
| `ten98-campaign/src/main.tsx` | Existing Icon, Badge, Empty, Stat and Field patterns; native dialog with draft protection |
| `ten98-discover/package.json` | React, TypeScript and TanStack Router/Start |
| `ten98-discover/src/design-tokens.css` | Semantic color, theme, type, spacing, control, focus and motion token precedent |
| `ten98-discover/src/components/CampaignUI.tsx` | Shared internal branding/icon precedent, with Campaign attribution |
| `ten98-discover/src/routes/index.tsx` | Workspace/project scope, grouped navigation, mobile drawer, breadcrumbs and account surface |
| `ten98-discover/src/components/AuthLayout.tsx` | Shared branded authentication layout precedent |
| `ten98-discover/tests/design-system-browser.mjs` | Prior acceptance criteria for contrast, focus, forced colors, motion and screen geometry |
| `ten98-io/public/styles.css` | Distinct public-site palette and content-oriented layout |

The audit found stale `ten98-monitor` naming in Discover's package and contributor title. That does not change the owner's intended Discover product scope and is not corrected in this repository.

## 004 — Reuse with a clear ceiling

Start with native HTML semantics and the React patterns already needed by real tools. Keep the package independent of a router, backend, account provider and CSS utility framework. Do not create a generic engine for every planned domain.

Share how a connection, status, form, list, confirmation or activity appears and behaves. Keep its business rules in the application. Introduce a specialized editor, graph canvas, terminal, telephony client or building-plan viewer only when a concrete application and its accessibility requirements justify one.

Use `--t98-*` variables and `t98-` classes to make the library's styling identifiable. Semantic token values live in `src/lib/tokens.css`; `src/lib/tokens.ts` supplies typed references, not a second palette. The component inventory belongs in [COMPONENTS.md](COMPONENTS.md), suite coverage and interaction rules in [UX-PATTERNS.md](UX-PATTERNS.md), and consumer setup in [ADOPTION.md](ADOPTION.md).

## 005 — Maintenance and acceptance

Change the smallest shared layer that owns a problem. Inspect every affected caller when changing behavior. Preserve source attribution and license notices when reusing external or sibling-project code.

New components need a real use case, a named owner for behavior, a complete state model, a keyboard path, responsive behavior and a meaningful runnable check for nontrivial logic. A visual example alone does not prove accessibility or integration correctness.

Before a release, run `npm run check`, inspect package contents with `npm pack --dry-run`, and review the catalogue in light/dark themes and both densities. An application adopting the update must also verify its actual data and navigation flows. Publish or deploy only through the owner's authorized release process.

## 006 — Application adoption and public source

Understood as: integrate the shared library into Campaign and Discover while preserving their functionality and ongoing changes, rename the planned knowledge tool to `ten98-wiki`, and publish the design system as its own public MIT-licensed repository in the ten98 organization.

The shared application entry point preserves existing SVG, class-name and native form contracts while repeated components and base styles move into the library. Application controllers, routing, authentication flows and domain behavior remain in their applications; Discover's `AuthLayout` remains application-owned. The [integration contract](INTEGRATION.md) defines the boundary.

The source repository is [Ten98-IO-Company/ten98-design-system](https://github.com/Ten98-IO-Company/ten98-design-system). Each consumer pins a checked-in versioned archive and lockfile, allowing its normal build and container context to work independently of this checkout. The planned knowledge product is `ten98-wiki`; upstream project names and attribution retain their original names.

Owner direction: keep the library modular, with a single design-token source, easy named component imports and composable typed APIs. This project owns shared UI design, implementation and validation; application projects request missing elements here and integrate the released components with their own behavior. Existing application adapters preserve compatibility while new screens use the main component API. Released archives stay immutable; component changes receive a new package version.
