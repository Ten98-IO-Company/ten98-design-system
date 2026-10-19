# Release validation

## Consumer capability and disabled values: 0.3.3

`npm run check:all` passes: 56 native tests, 507 strict public TSX examples and 108 Playwright cases. The catalogue now has 402 state specimens across the same 73 components and 28 reference flows. The new replay specimens cover an unsupported inactivity preference and a supported read-only preference. Browser checks verify omitted controls, retained play/seek/speed requests, disabled preferences and existing editable checkbox behavior. The native regression also covers both read-only boolean values and a callback without a preference.

The compatibility input uses its semantic disabled-text role even when a consumer supplies an older muted-text override. The light role reuses the established muted palette color, preserving the field's previous contrast; dark keeps its existing disabled-text color. Browser checks measure at least 4.5:1 for these fixture values. Restoring the consumer's inherited purple foreground fails that same dark contrast check. Fresh independent review found no actionable defect in the optional API, copied examples, token change or regression checks. Native player execution and full app acceptance remain app-owned.

The inspected immutable archive SHA256 is `587D396D36E6CD654A6E451F9EB778062267FEC2D96AF90AED6800F1AA8C3B25`. Of 30 emitted JavaScript/declaration files, only `inspection.js` and `inspection.d.ts` differ from 0.3.2. MIT license, version, optional declarations and disabled role CSS are verified. Both active app owners received this exact archive for adoption; prior archives remain unchanged.

## Existing application dark themes: 0.3.2

The full `npm run check:all` gate passes: 55 native tests, 505 strict public TSX examples and 104 Playwright cases. The patch changes two established compatibility fills to existing semantic roles: the translucent topbar uses the surface token, and disabled field inputs use the disabled-surface token. Component APIs, JavaScript, declarations and authentication markup are unchanged.

Twelve added browser cases cover explicit themes overriding the operating system, both system themes, canonical token inheritance, rendered text contrast, native field behavior and light geometry. Restoring only the old fixed light fills reproduces both dark contrast failures. The authentication comparison covers class styling and geometry in a synthetic fixture; complete app screens and product operations remain separate consumer checks. Independent source review found no actionable defect in the scoped patch or checks.

The immutable 0.3.2 archive SHA256 is `A49025981CFF0E1BD4DD936A90B644B437B8120852CA9D012B0D12BD14F45069`. All 30 emitted JavaScript/declaration files are byte-identical to 0.3.1. The inspected package includes the MIT license, current version and corrected compatibility CSS. Both active app owners received this exact archive and hash for adoption.

The source catalogue's setup guide now includes the required browser gate and the full existing-app stylesheet order. Its focused desktop/narrow Playwright cases caught and fixed literal newline escapes in the command snippet, then passed with real multiline values. This catalogue-only follow-up leaves the released archive unchanged.

## Actual text enlargement: 0.3.1

The complete `npm run check:all` gate passes: 55 native tests, 505 strict public TSX examples and 92 Playwright cases. The stronger text test snapshots every computed font size and numeric line height before doubling them, includes isolated app-preview documents, verifies visible headings at exactly 2× and restores styles between hash-route cases. It checks all 73 component state pages at 320px, all 28 flows at desktop and 320px, open modal controls, typed confirmation and focus return. It is text enlargement rather than full page zoom; horizontal reflow is tested, with no blanket certification of all possible clipping or overlap.

This independent validation improvement found nowrap Button labels across multiple patterns. The fix lives once in the shared Button rule: constrained width and wrapping preserve readable labels without changing its API. Catalogue long descriptions/acceptance text and the installation snippet now wrap as well. The original 0.3.0 archive remains immutable. Fresh source review found no further actionable defect in the scoped changes.

The 0.3.1 archive SHA256 is `9F41F5E616E525D70767EDCF138BF6131BC9BC14D86AEA45B8C3A0C3D9C73EB8`. All 30 emitted JavaScript/declaration files are byte-identical to the 0.3.0 archive; the library behavior change is CSS only. Both app owners received this new immutable artifact for the next safe adoption batch.

## Product components, fixed layouts and Playwright: 0.3.0

Validated on 19 October 2026 using Node.js 24, React 19.2.8 and Playwright 1.64.1 with its official Chromium build. `npm run check:all` passed: project typecheck, emitted declarations/modules, catalogue production build, 55 native tests, 505 standalone strict TSX examples and 88 browser cases. The inventory gate covers every public export exactly once: 73 components and 400 state specimens. All C1–C8 and D1–D17 research IDs appear exactly once among 28 interactive flow recipes, each with references and concrete acceptance cases.

Playwright runs the actual React surfaces in a 1440px default-light desktop and 320px dark English left-to-right layout. It browses all 73 state pages without page errors or document overflow; tests native forms, exact account/media identity, mounted drafts, permissions, filters, evidence disclosure and payload gating; and exercises each flow's primary and consequential recovery paths. It checks fixed templates, hierarchy, search, focus return, hidden sidebar scrollbars, source links and text enlargement. Root font size 200% was used in the initial gate, distinct from page zoom; 0.3.1 replaces this limited check with verified actual font doubling. See [the runnable browser gate](BROWSER-TESTING.md).

The first broad browser run caught long status text overflowing PublishingAgenda; the shared Badge wrapping rule fixes the root cause. Fresh independent source review caught prompt draft saving bypassing a collecting/uncertain execution lock. The repaired D16 Playwright case passes for both states; temporarily removing the guard fails its disabled-action assertion. Stale prior receipts are also hidden during a new D12/D16 quote review. Test authors' local simulations are not independent provider truth; native app contracts, primary references and app-session regression checks provide separate evidence. No live paid/provider operation was used to validate these local flows.

The immutable MIT archive handed to both app owners has SHA256 `F73229FC6B2C7E14348A1DC77709D60E7110756D8EA5B4DA30BE5047BA05033F`. It contains modules, declarations, `product.css`, notices, license and documentation. Both owners verified and pinned it. Consumer adapter acceptance is tracked in [the completion ledger](CAMPAIGN-DISCOVER-COMPLETION.md), independently of the library gate. The public source documentation and browser tests continue to record final review findings; the handed-off archive is never replaced in place.

## Component catalogue

The reference documents every public component export: 38 main components and seven existing-app adapters. `npm run check` runs 23 native checks, including catalogue inventory/link integrity, rendering all 204 state specimens, compiling all 256 standalone TSX examples against the public declarations, URL/search behavior and token/alias references against shipped CSS. The TSX check includes component examples, state examples, three flow recipes, the getting-started form, the Campaign brand/login compositions and token usage. Flow recipes copy the exact rendered source with public imports.

Browser checks cover copy feedback and copied TSX, search by task, global search navigation, typed confirmation guards and rejected actions, table search/sort/pagination, and live token values (38px comfortable, 32px compact; dark surface values). The isolated Campaign login form validates and submits locally; owner setup is available as a separate reference state. Local specimen anchors focus their own targets, and the catalogue skip link keeps the current route while focusing the main content.

All three flow recipe pages also fit a 320px viewport without page-wide horizontal overflow. The real catalogue was measured inside 320px, 360px, 760px and 1440px browser viewports with no page-wide horizontal overflow. Narrow views expose a drawer with inert background and Escape dismissal. LTR/RTL checks at 320px and 360px retain the same document width. The component rail is scrollable with computed `scrollbar-width: none`. These checks are representative acceptance evidence; screen-reader, forced-colors and complete consuming-app route coverage remain outside this validation.

## Shared flow recipes

Run the catalogue, open `/tests/flow-recipes.html` and choose **Run checks**. This native browser regression check mounts the actual React recipes and reports PASS/FAIL. It verifies connection required validation, configured/unverified status, failed verification preserving input, successful synthetic evidence and historical evidence after edits; measured zero versus unavailable; failed refresh retaining the prior result, applied dates and draft dates; filtered-empty recovery; review cancellation preserving a draft; stable focus after confirmation; unknown outcomes without blind retry; inconclusive reconciliation; and a reviewed retry only after confirmed not-applied.

The fixture passed against the final source. A separate fresh-context review found the confirmation focus loss; retaining the same action button across the pending transition corrected it, and the fixture now asserts focus restoration. No backend, provider, physical device or product mutation is exercised by these local simulations.

## Sidebar patch 0.2.2

Both shared sidebar APIs retain `overflow-y: auto` and hide their visible scrollbar using standard `scrollbar-width: none` plus the WebKit pseudo-element. Catalogue navigation uses the same behavior. Version 0.2.2 includes the prior ResourceCard fix; the 0.2.1 archive remains unchanged. The full build and 23 native checks pass. Native browser specimens with 80 menu links confirm both APIs have computed `scrollbar-width: none`, retain `overflow-y: auto`, and scroll to the final links through keyboard focus.

## ResourceCard patch 0.2.1

The patch changes only ResourceCard status wrapping; its API is unchanged. The icon retains its dimensions, the status row can wrap, and long badges remain fully readable. All 18 library checks pass. The real component and stylesheet pass the native browser fixture at a 320px iframe viewport with body zoom 2 in LTR and RTL, including “Events received”, “Waiting for events”, “Check unavailable” and an unbroken identifier. Restoring the original nowrap rules fails the same fixture with document and status overflow.

Run the catalogue and open `/tests/resource-card.html?zoom=2&dir=ltr` or `dir=rtl` at 320px. The page reports PASS/FAIL. `&baseline=1` restores the original layout as a regression control. Consumer app acceptance remains owned by the app session.

## Initial application adoption 0.2.0

Validated locally on 19 October 2026 using Node.js 22.14 for the library and Node.js 24.19 for consuming applications, with React 19.2.8.

Run `npm run check` for TypeScript checking, the library and catalog production builds, and the native Node tests. The original 18 library tests cover table transformations, field associations, confirmation prerequisites, permission role edge cases, secret labels, date boundaries, chart numeric ranges, semantic palette contrast, standalone sizing/fonts, theme and density resets, package exports, retained client directives, native application field defaults/constraints, brand markup and the Campaign inbox icon.

The catalog was also exercised in the browser:

- Table search, natural sorting, pagination, and selection across pages.
- Arrow-key tabs; dialog submission, Escape/close paths and focus restoration.
- Global search, component filtering, all documentation pages and product recipes.
- Light/dark appearance and measured input heights of 38px comfortable and 32px compact.
- Mobile navigation and no page-wide horizontal overflow at 360px; tablet layout at 760px and desktop at the browser's normal width.
- Secret visibility, clipboard success feedback, controlled permission changes and toast feedback.
- Confirmation disabled before exact text entry, enabled afterward, and closing disabled while pending.
- Native date entry rejecting a start date after the end date.

`npm pack` produces `ten98-ui-0.2.0.tgz`, including emitted modules, declarations, CSS, license, retained third-party notices and documentation. Both consuming applications pin the same archive in `vendor`, together with their lockfiles. Their Dockerfiles copy it before dependency installation.

The Campaign and Discover migrations were checked in isolated copies of the current working sources, preserving their in-progress application changes:

- Campaign: TypeScript, production build and all 531 native tests passed.
- Discover: TypeScript, production build, plan checks and 895 native tests passed; three platform-dependent checks were skipped on Windows (FIFO, environment-file symlink and host Docker helper).
- Browser comparison: representative native fields, buttons, tables, status, empty states and authentication headings retained baseline layout and typography at 360px, 760px and 1440px in light and dark contexts. All 100 existing Discover custom properties, including the 85-token public contract, matched the original computed values in both themes.
- Native required validation blocked an empty project name. Edited text, a decimal budget, multiline text and a changed select value submitted through `FormData` correctly. The Discover dark RTL specimen also rendered with native form controls.
- Independent source review found a missing Campaign inbox icon and a nonsplit authentication heading cascade change; both were corrected before application.

These browser comparisons used synthetic markup with the actual application styles and shared components. They do not establish complete route, provider or production service coverage. No database/provider integration suite or live publishing operation was run. Container build inputs were checked; Docker images were not built here.

The catalog build is a browser application and may report that bundled `use client` directives are removed. The installable library uses a separate module build; its emitted client boundaries are checked directly by the test suite.

React 18.3 is included in the declared peer range based on the APIs used; local runtime verification used React 19. Discover's TanStack application was typechecked and built with the shared package. Next.js adoption is documented, but a complete Next.js application was not built here. These checks do not certify accessibility or domain behavior.
