# Campaign and Discover integration

Campaign and Discover consume `@ten98/ui` through a versioned archive committed at `vendor/ten98-ui-0.2.0.tgz`, with `file:vendor/ten98-ui-0.2.0.tgz` in their dependency manifests. Both applications use the same immutable archive. Their builds require no sibling repository at runtime or during dependency installation.

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

1. Update the library version and run `npm run check` in this repository.
2. Run `npm pack` and inspect the emitted archive. Keep an already released archive immutable.
3. Copy the same new archive into each application's `vendor` directory and update the dependency path.
4. Regenerate the application's lockfile with its existing package manager: npm for Campaign and pnpm for Discover. Commit the manifest, archive and lockfile together.
5. Ensure container builds copy `vendor` into the build context before dependency installation. A frozen or clean install must resolve the archive from that checkout alone.
6. Run each application's required type, test and build checks, then verify its actual navigation, forms, pending states and responsive screens. Library checks alone do not establish consumer correctness.

See [VALIDATION.md](VALIDATION.md) for recorded release evidence. Do not infer production service coverage from the catalogue's sample data.

Patch 0.2.2 hides visible scrollbar tracks/thumbs in both shared sidebar APIs while retaining native scrolling and keyboard access. It includes the 0.2.1 ResourceCard wrapping fix. Adoption remains an explicit app-owned dependency update; existing archives are unchanged.
