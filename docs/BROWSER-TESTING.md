# Browser regression gate

Run these commands from the repository root. Playwright is a development dependency; install its official Chromium once:

```sh
npm ci
npx playwright install chromium
npm run check:all
```

`npm run test:browser` runs only the browser suite; `npx playwright test --ui` opens its development runner. The configuration starts the catalogue when needed, or reuses the local server on port 5198 outside CI. It caps concurrency at two workers, disables retries, and retains screenshots/traces on failures. `playwright-report/index.html` is the local report. `npx playwright show-trace <path>` opens a failure trace.

The suite tests real rendered React in English, left-to-right: a 1440px desktop with the default light theme, and a 320px viewport with the dark theme. It browses every component's state page, checks page reflow, exercises shared controlled-state invariants, and covers each Campaign C1–C8 and Discover D1–D17 flow. Separate checks cover hierarchy, templates, copyable source and focus return. The 200% text check snapshots computed font sizes and line heights before doubling them, including isolated app preview frames, and verifies that a visible heading actually doubles. It restores the original inline styles between cases, avoiding compounded inheritance and cross-page contamination. This is text enlargement, not browser page zoom. Native regression fixtures are retained for focused component and cross-product interactions.

The legacy theme spec checks the actual compatibility styles in explicit and system light/dark themes, semantic token inheritance, translucent header text, disabled-input contrast and native editable/read-only/disabled behavior. Its negative control restores the two previous fixed light fills and reproduces the dark contrast failures. Authentication class geometry is compared in a synthetic fixture; consuming apps verify their complete login screens separately.

The same theme matrix covers workspace text/avatar and normal/hover/selected action/navigation states, both button class aliases, danger, primary and navigation counts. It measures rendered colors after finite CSS transitions finish; it does not weaken a contrast threshold to accommodate an in-progress theme transition. The negative control restores the original action/navigation fills and reproduces dark contrast failures. Primary and disabled behavior remain covered. Consuming apps must reconcile later native overrides and recheck their visible shell.

The native topbar reflow case preserves normal wide/narrow heights, snapshots computed header/heading fonts and numeric line heights before doubling, and verifies exact visible heading enlargement, complete breadcrumb/menu/profile containment and adaptive header height at 320px. Browser scale and body/root zoom remain 1. Restoring only fixed mobile height and nowrap breadcrumb constraints reproduces overflow. This is rendered text enlargement, not a browser preference setting; the actual app receives a separate full-body check.

The native form-grid spec mounts actual AppField/AppSelect components in a settings panel and dialog. It verifies visible labels/control bounds, narrow stacking, real text doubling and native values, constraints and FormData. Restoring the original grid rules must reproduce overflow. Browser picker contents and internal date/time segment scrolling are outside this fixture.

The AppField spec mounts the actual component with a held synthetic article response. It verifies asynchronous prefill, typed text matching controller review and native FormData, edit invalidation, read-only state, forwarded identity/ARIA/row attributes and narrow reflow. A second case verifies edited uncontrolled drafts survive later default metadata, required validation, read-only submission and disabled exclusion. Queries use native accessible roles, including the existing required asterisk; no label markup is altered to fit a test. These are synthetic form checks, not article persistence or publishing acceptance.

Design-consistency checks measure actual table/status colors and contrast, catalogue metric sizing and intrinsic specimens, and panel-driven audience wrapping. Detail-focus checks preserve initial/app/desktop focus, recover hidden focus and retain guarded drafts. Analytics-layout checks keep primary results full width on desktop while containing keyboard-scrollable tables on narrow screens. Visual-evidence checks preserve the default accessible heading, show custom coordinate evidence labels, omit unknown-alignment overlays and keep copied TSX consistent. The visual critique and direct product captures are documented in [the review](reviews/2026-10-19/README.md); screenshots support design comparison, while these tests verify behavior.

Specs live in `tests/browser/`. When running bounded workers concurrently, give each invocation a distinct output folder and disable the shared HTML reporter, for example: `npx playwright test tests/browser/campaign.spec.ts --output=.qa/campaign --reporter=line`. Otherwise one process can delete another's trace artifacts. The final release gate runs the complete suite in one process.

For every new component or flow: add or extend its meaningful browser case, verify the primary interaction and its consequential failure/recovery boundary, then run its owned spec before the full gate. Keep test assertions independent of cosmetic implementation. A browser test with synthetic data does not establish provider acceptance, complete accessibility compliance or real consumer integration; app sessions run their own actual application checks.
