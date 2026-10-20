# Campaign and Discover integration

## Reuse existing presentation

Version 0.3.16 consolidates ActivityFeed tone styling, compatibility badge rules and identical domain styles without changing public props, tokens, branding or behavior. Native text and multiline fields should use the existing AppField when it forwards their complete contract. Preserve names, values, handlers, constraints and help; keep a controlled native select when AppSelect does not expose its required callbacks or disabled state.

Use the fixed templates instead of recreating their page framing. The catalogue's live template demonstration and copied TSX now share a source; forms, review state, permissions and recovery remain app-owned. Do not collapse different evidence or uncertain-outcome contracts into a generic renderer merely because their markup looks similar. See the [consolidation review](reviews/2026-10-20/dry-kiss.md).

## One authentication presentation

Version 0.3.15 makes the main `AuthLayout` use the established Campaign login composition. Its six props and public export stay unchanged. The Brand & login reference and component catalogue call that same wrapper and reuse the same story content. Canonical brand/auth CSS lives in one source and is included in both stylesheet entry points; standalone consumers need only `styles.css`. Native authentication controllers, product stories and page landmarks remain app-owned; use the shared layout for authentication geometry and spacing.

Generic aside instructions and recovery links remain visible on narrow screens. Only Campaign's explicitly marked decorative story summary/footnote collapse with its existing mobile presentation. Do not hide required guidance inside decorative content. A padded `.settings-panel` also owns the inset of its direct `.panel-heading`; avoid adding a second header inset in a native override. Its `.form-grid` gap owns spacing between direct `.field` children, preventing the old extra top margin from staggering dates in Calendar and Account reports.

## Authentication and validation theme ownership

Version 0.3.11 pairs the compatibility authentication story and form-error colors using the existing theme roles. Keep the package styles before native overrides, then remove fixed native fills or foregrounds that split these pairs. Badge state classes similarly own their foreground and surface together; native color-only overrides must not replace one half. Preserve Campaign's existing mark, icons, light palette and split layout. Check actual installed login, modal errors and badges in both themes at desktop and 320px.

Version 0.3.13 also pairs noninteractive tags, shortcut hints, native tab counts and default integration initials. Version 0.3.14 completes the shared count/avatar backgrounds. Campaign adopts those backgrounds together with its native semantic dark count/avatar foregrounds; either half alone is insufficient. Keep shared fills as the owner and inspect consumer-specific foreground/background pairs together. These patches change no public API or token palette.

`light-dark()` follows the used `color-scheme`. Supply `data-theme="light"`, `"dark"` or `"system"` at the app's theme boundary; the library's explicit system contract follows the operating-system preference. A consumer supplying its own dark roles must supply the matching color scheme. Do not infer theme controls or saved-preference behavior from a CSS probe. See the [native screenshot baseline and repair](reviews/2026-10-19/campaign-dark.md).

## Controlled saved-record pickers

Compose app-owned server pagination and selection with controlled native checkboxes or `Checkbox`. The shared `DataTable` searches and pages loaded rows and owns its selection internally; it is not a controlled server-selection API. Never interpret zero selected rows as all matching records. Distinguish loaded, selected and not-yet-loaded counts, and preserve selection only across compatible appended pages.

Keep bulk controls before a bounded, labelled keyboard-scrollable result list. Use compact checkbox glyphs inside large clickable labels; verify the effective label target rather than enlarging the glyph. Use the checkbox layout for boolean options, keeping the label beside its control instead of inheriting text-field width. A local copy/append action preserves edited draft text, announces its result and focuses the destination draft; the existing explicit save remains separate. The [D13 saved-keyword contract](research/campaign-discover/flows.md#d13-saved-keyword-selection-contract) records the native read route, precise reset/pagination rules and regression requirements.

## Report identity and native style boundaries

In 0.3.10, use ReportPanel's optional standard `aria-label` when an existing report has a stable region name and a custom visible heading. Keep the heading in `title`; supply the original app-owned report name once through `aria-label`. Blank labels keep the existing title-based name. This preserves one region without nested wrappers or hidden-label substitutions. The catalogue's “Separate region name” state supplies complete TSX; [validation](VALIDATION.md#independent-report-names-0310) records the qualified browser evidence and consumer acceptance.

Keep legacy action-column widths, cell colors and hover surfaces scoped to native tables. They must not override the shared `.t98-review-table`. A native `td:last-child` action rule compressed Campaign's After column; correct that selector before widening or truncating a shared review. Check the actual composed foreground/background in normal and hover states, and actual doubled text inside the existing local scroller. Preserve the native rules' specificity and behavior for their remaining callers.

When a shared component replaces a native tag, keep the app-owned boundary class, opaque surface and required stretch behavior. Tag-dependent selectors such as direct-child `section` rules may no longer match a shared Card root. Reconcile that boundary once in the app; preserve the shared component's own padding and border rather than adding duplicate card chrome. Run the original native layout and access assertions before closing adoption.

## Header text reflow: 0.3.8

The compatibility topbar keeps its usual 69px, 60px and 58px breakpoint sizes as minimum heights. Its breadcrumb can shrink and wrap, so enlarged text can increase the header height while keeping context and profile/menu controls visible. No content is truncated or hidden to force a fit. The header remains in layout and sticky behavior is preserved. JavaScript, declarations and APIs are unchanged.

Remove conflicting native `height`/`white-space` overrides if they replace this shared behavior. Verify the actual app at 320px with computed text enlarged to 2× and zoom left at 1; a root-font setting alone does not prove fixed-pixel labels doubled.

## Legacy action and navigation colors: 0.3.7

Existing `.button`/`.btn` controls use the primary text and control-border roles; hover uses the subtle surface. Danger actions use the danger pair. Navigation hover, selection and counts use the existing accent pair. Geometry, primary/disabled behavior, JavaScript, declarations and APIs are unchanged.

When adopting, remove redundant application color overrides that replace these shared roles with fixed light-theme colors. Check visible native shell text and enabled actions in light/dark, normal/hover/selected states. Preserve intentional paired avatar and visualization colors where appropriate. An installed package cannot correct an application stylesheet that overrides it later.

## Controlled multiline correction: 0.3.6

`AppField` now forwards controlled textarea values and native change handlers, read-only state, identity, ARIA descriptions and textarea sizing. An asynchronous response can populate a controlled field, and user edits reach the controller used by review and persistence. Existing uncontrolled `defaultValue` callers retain their native drafts; later default metadata does not overwrite edits. The app still owns review invalidation and saving.

Literal `multiline={true}` accepts `React.TextareaHTMLAttributes<HTMLTextAreaElement>` and infers textarea events. Existing input calls and dynamic boolean calls retain the previous input-attribute signature. Input-only attributes, including a legacy `type="url"` supplied with dynamic multiline, are omitted from the textarea. No input markup, styling, dependencies, routing or persistence changes. Pin the new immutable 0.3.6 archive; 0.3.5 remains unchanged.

## Design consistency patch: 0.3.5

Compatibility tables, status badges, empty-state tiles and native field borders use existing semantic theme roles. Audience counts adapt to their panel width rather than the viewport. `DetailWorkspace` recovers focus to the visible pane heading only when selection hides or removes its focused control; the app still owns guards and restoration to the originating record. Initial focus and visible app-selected targets are preserved. Existing callback signatures are unchanged.

`VisualEvidenceFrame` adds optional `rankedListLabel`. Use a truthful label such as `Coordinate groups and depth bands` for numeric coordinate evidence. Omission preserves the exact existing heading and region name. This changes presentation only: unknown alignment does not authorize an overlay, page readiness is not alignment proof, and an unavailable element identity must not be invented.

The catalogue preserves intrinsic specimens and metric typography, keeps template section links inside their preview, and provides a compact template picker. Explorer and attribution use full-width overview results; the funnel keeps its editor and places saved results below it. These examples remain local simulations. Review [the full critique](reviews/2026-10-19/README.md) and verify affected app screens when adopting the new immutable archive.

## Native form grid patch: 0.3.4

The established `.form-grid` keeps two constrained columns on wider screens and stacks into one column at viewport widths of 480px or less. Direct children can shrink within their tracks, preventing native date and date-time fields from widening the page. Native inputs, labels, values, constraints and form submission remain unchanged. Consumer-specific layouts keep their existing overrides. Adopt the new immutable archive and recheck actual calendar/settings forms before closing the consumer gate.

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

`product.css` imports the canonical tokens and the same component styles assembled in `styles.css`. Established apps use the compatibility import order above and keep local overrides last. Keep native application forms, controllers, routed guards, provider rules and specialized renderers. `DetailWorkspace` requests selection/back through callbacks; the app guards navigation and restores the originating control, while the shared hidden-focus fallback keeps selection transitions usable. `ConversationThread` keeps its supplied composer mounted, but the app owns draft identity and authorization. `ConfirmDialog` is controlled by `open`/`onOpenChange`; invalidate the app's reviewed action when its draft, resource or request identity changes. Never treat an old review as authorization for a newer draft.

Useful first consumers are `AppliedFilters` with optional `removeLabel`, compact `EvidenceSummary` (`variant="compact"`, optional basis/details), exact receipt stages in `OperationResults`, and `MediaStrip`'s neutral `unverified` metadata state. `FunnelBreakdown` and `JourneyPath` accept `countLabel` for app-native units. Keep branching graphs and provider-specific previews where they express more than the generic presentation.

Compact `EvidenceSummary` omits reasons for current freshness and complete coverage. Put interpretation-critical qualifications in its always-visible `reason`, including unknown capture coverage when retained query rows are complete. Retention completeness, ingestion time and capture coverage describe separate facts. Use `basis` and `details` for secondary explanations.

Every C1–C8 and D1–D17 reference flow has a complete local TSX example, research references and acceptance cases in the catalogue. These are synthetic presentation/controller examples; app sessions validate their actual adapters and existing features. Paid/provider operations, billing, database work and deployment remain outside this integration wave.

Campaign and Discover consume `@ten98/ui` through a versioned archive committed in `vendor`, with a matching `file:vendor/ten98-ui-<version>.tgz` dependency. The initial adoption used 0.2.0. Current app acceptance is recorded in the [completion ledger](CAMPAIGN-DISCOVER-COMPLETION.md). Their builds require no sibling repository at runtime or during dependency installation.

Version 0.2.1 fixes ResourceCard status wrapping at narrow widths without changing its API. Existing 0.2.0 archives remain immutable. Each app session owns adopting the new `vendor/ten98-ui-0.2.1.tgz` archive and regenerating its lockfile before its release.

## Shared components

Import the application-compatible components from `@ten98/ui/app`. They preserve existing native markup and class names so applications can remove duplicate presentation without replacing their domain controllers. The emitted `dist/app.d.ts` declarations define the exact prop types; see also the [component inventory](COMPONENTS.md#existing-application-components).

| Export | Contract |
| --- | --- |
| `AppIcon` | Decorative SVG; `name` and optional `size`. Unknown names use the grid icon. Label the containing control when needed. |
| `AppBrand` | Product wordmark; `product`, optional `href`, `onClick` and `className`. The default class is `brand`. |
| `AppField` | Labelled native input or textarea. Controlled value/change and native uncontrolled defaults are supported; literal multiline accepts textarea attributes. |
| `AppSelect` | Labelled uncontrolled native select; `label`, `name`, initial `value` and readonly `[value, label]` options. |
| `AppBadge` | Existing status class and text; `value` and optional application-formatted `label`. |
| `AppEmpty` | Empty-state presentation; `title`, explanation children, optional `icon` and `action`. |
| `AppStat` | Metric presentation; application-formatted `label`, `value`, `caption` and `icon`. |

The applications retain form submission, validation, domain vocabulary, loading/error state, permissions, route navigation and data fetching. Keep an app's local `AuthLayout` only as a thin adapter around the main `@ten98/ui` export: supply its established `AppBrand`, product story and page landmark while delegating geometry and spacing to the shared layout. Omit `title` when the native form already owns its h1, as shown in the [documented API](COMPONENTS.md) and [sidebar/auth adoption guide](SIDEBAR.md). Preserve the existing forms and controllers; do not maintain a second authentication shell. Qualify this presentation adoption in each application's native screens before updating its accepted package pin.

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
3. Copy the new immutable archive into each affected application's `vendor` directory and update the dependency path. An app with no affected consumer may retain its accepted compatible pin; record the reason in the completion ledger.
4. Regenerate the application's lockfile with its existing package manager: npm for Campaign and pnpm for Discover. Commit the manifest, archive and lockfile together.
5. Ensure container builds copy `vendor` into the build context before dependency installation. A frozen or clean install must resolve the archive from that checkout alone.
6. Run each application's required type, test and build checks, then verify its actual navigation, forms, pending states and responsive screens. Library checks alone do not establish consumer correctness.

See [VALIDATION.md](VALIDATION.md) for recorded release evidence. Do not infer production service coverage from the catalogue's sample data.

Patch 0.2.2 hides visible scrollbar tracks/thumbs in both shared sidebar APIs while retaining native scrolling and keyboard access. It includes the 0.2.1 ResourceCard wrapping fix. Adoption remains an explicit app-owned dependency update; existing archives are unchanged.
