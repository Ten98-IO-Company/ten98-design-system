# Campaign and Discover integration

## Replay capability and disabled text patch: 0.3.3

`ReplayControls` accepts an optional `skipInactive` preference and callback. Omit the preference when the player does not support it. A supplied boolean without `onSkipInactiveChange` renders a disabled readable preference; supplying both retains the controlled interaction. Existing callers keep their behavior. Native player validation, isolated rendering, payload loading and millisecond/second conversion remain app-owned.

Disabled compatibility inputs use the existing disabled-text role, so an app's older muted-text override cannot recolor their values. The light disabled-text role reuses the existing muted color to retain the previous field contrast; dark uses its established semantic value. Use `ten98-ui-0.3.3.tgz` from the [0.3.3 release](https://github.com/Ten98-IO-Company/ten98-design-system/releases/tag/v0.3.3) and retain earlier archives.

## Shared application theme patch: 0.3.2

Version 0.3.2 makes the established `.topbar` and disabled `.field input` fills follow the existing semantic surface tokens in explicit and system themes. The header retains its translucent treatment. JavaScript, declarations, native field behavior and authentication markup are unchanged. Pin `ten98-ui-0.3.2.tgz` from the [0.3.2 release](https://github.com/Ten98-IO-Company/ten98-design-system/releases/tag/v0.3.2) using the [adoption steps](ADOPTION.md), and retain previous archives. Run the application's dark-theme checks after adoption; app-specific panels and controls remain owned by each app.

## Text reflow patch: 0.3.1

Version 0.3.1 preserves the 0.3.0 API and lets main-API Button labels wrap within their container at enlarged text sizes. It updates the catalogue's long description/list wrapping and installation snippet presentation. Existing application compatibility selectors remain unchanged. Both apps should pin the same new archive and preserve the earlier 0.3.0 archive. The browser gate now verifies actual computed text doubling, including open dialogs, every component state page and every reference flow.

## Additive product batch: 0.3.0

Version 0.3.0 adds 28 typed presentation components and fixed templates. The public declarations in `dist/index.d.ts` and the linked module declarations are the exact contract. Named imports remain `import { AppliedFilters, EvidenceSummary } from '@ten98/ui'`; the established `@ten98/ui/app` exports retain their APIs.

Existing apps add the scoped product stylesheet after their compatibility stylesheet, before local overrides:

```css
@import '@ten98/ui/app-tokens.css';
@import '@ten98/ui/app.css';
@import '@ten98/ui/product.css';
/* Existing application overrides follow. */
```

`product.css` includes tokens and the scoped component rules, without the main stylesheet's global reset. Keep native application forms, controllers, routed guards, provider rules and specialized renderers. `DetailWorkspace` requests selection/back through callbacks; the app guards navigation and restores focus. `ConversationThread` keeps its supplied composer mounted, but the app owns draft identity and authorization. `ConfirmDialog` is controlled by `open`/`onOpenChange`; invalidate the app's reviewed action when its draft, resource or request identity changes. Never treat an old review as authorization for a newer draft.

Useful first consumers are `AppliedFilters` with optional `removeLabel`, compact `EvidenceSummary` (`variant="compact"`, optional basis/details), exact receipt stages in `OperationResults`, and `MediaStrip`'s neutral `unverified` metadata state. `FunnelBreakdown` and `JourneyPath` accept `countLabel` for app-native units. Keep branching graphs and provider-specific previews where they express more than the generic presentation.

Every C1–C8 and D1–D17 reference flow has a complete local TSX example, research references and acceptance cases in the catalogue. These are synthetic presentation/controller examples; app sessions validate their actual adapters and existing features. Paid/provider operations, billing, database work and deployment remain outside this integration wave.

Campaign and Discover consume `@ten98/ui` through a versioned archive committed in `vendor`, with a matching `file:vendor/ten98-ui-<version>.tgz` dependency. The initial adoption used 0.2.0. Current app acceptance is recorded in the [completion ledger](CAMPAIGN-DISCOVER-COMPLETION.md). Their builds require no sibling repository at runtime or during dependency installation.

Version 0.2.1 fixes ResourceCard status wrapping at narrow widths without changing its API. Existing 0.2.0 archives remain immutable. Each app session owns adopting the new `vendor/ten98-ui-0.2.1.tgz` archive and regenerating its lockfile before its release.

## Shared components

Import the application-compatible components from `@ten98/ui/app`. They preserve existing native markup and class names so applications can remove duplicate presentation without replacing their domain controllers. The emitted `dist/app.d.ts` declarations define the exact prop types; see also the [component inventory](COMPONENTS.md#existing-application-components).

| Export | Contract |
| --- | --- |
| `AppIcon` | Decorative SVG; `name` and optional `size`. Unknown names use the grid icon. Label the containing control when needed. |
| `AppBrand` | Product wordmark; `product`, optional `href`, `onClick` and `className`. The default class is `brand`. |
| `AppField` | Labelled native input; input attributes and optional `multiline`. Multiline preserves the existing uncontrolled textarea contract. |
| `AppSelect` | Labelled uncontrolled native select; `label`, `name`, initial `value` and readonly `[value, label]` options. |
| `AppBadge` | Existing status class and text; `value` and optional application-formatted `label`. |
| `AppEmpty` | Empty-state presentation; `title`, explanation children, optional `icon` and `action`. |
| `AppStat` | Metric presentation; application-formatted `label`, `value`, `caption` and `icon`. |

The applications retain form submission, validation, domain vocabulary, loading/error state, permissions, route navigation and data fetching. Discover's `AuthLayout` stays local because its authentication layout and controller remain part of that application. The package's main `AuthLayout` export remains available for new screens with its [documented API](COMPONENTS.md); it does not replace Discover's existing component.

## Styles and tokens

Load styles in this order at the existing application stylesheet boundary:

```css
@import '@ten98/ui/app-tokens.css';
@import '@ten98/ui/app.css';

/* Remaining application-specific styles follow. */
```

`app-tokens.css` imports the canonical `--t98-*` variables and maps legacy names such as `--color-accent`, `--font-sans` and `--space-4` to them. Theme values remain owned by the canonical token file. `app.css` contains the common application base and established selectors such as `.brand`, `.field`, `.badge`, `.button` and `.btn`. It includes global base rules, so load it deliberately once rather than treating it as an isolated component stylesheet.

Keep product-specific layouts and overrides in each application's stylesheet. New components can use the main `@ten98/ui` exports and `styles.css`. Combining both stylesheet APIs on one page requires case-by-case visual checks: the main styles use `t98-` classes, while the compatibility styles also set global element rules. Keep the token imports first and application overrides last; verify native controls and headings in each theme and viewport.

## Updating a consumer

1. Update the library version and run `npm run check:all` in this repository.
2. Run `npm pack` and inspect the emitted archive. Keep an already released archive immutable.
3. Copy the same new archive into each application's `vendor` directory and update the dependency path.
4. Regenerate the application's lockfile with its existing package manager: npm for Campaign and pnpm for Discover. Commit the manifest, archive and lockfile together.
5. Ensure container builds copy `vendor` into the build context before dependency installation. A frozen or clean install must resolve the archive from that checkout alone.
6. Run each application's required type, test and build checks, then verify its actual navigation, forms, pending states and responsive screens. Library checks alone do not establish consumer correctness.

See [VALIDATION.md](VALIDATION.md) for recorded release evidence. Do not infer production service coverage from the catalogue's sample data.

Patch 0.2.2 hides visible scrollbar tracks/thumbs in both shared sidebar APIs while retaining native scrolling and keyboard access. It includes the 0.2.1 ResourceCard wrapping fix. Adoption remains an explicit app-owned dependency update; existing archives are unchanged.
