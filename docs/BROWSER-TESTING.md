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

The native form-grid spec mounts actual AppField/AppSelect components in a settings panel and dialog. It verifies visible labels/control bounds, narrow stacking, real text doubling and native values, constraints and FormData. Restoring the original grid rules must reproduce overflow. Browser picker contents and internal date/time segment scrolling are outside this fixture.

Specs live in `tests/browser/`. When running bounded workers concurrently, give each invocation a distinct output folder and disable the shared HTML reporter, for example: `npx playwright test tests/browser/campaign.spec.ts --output=.qa/campaign --reporter=line`. Otherwise one process can delete another's trace artifacts. The final release gate runs the complete suite in one process.

For every new component or flow: add or extend its meaningful browser case, verify the primary interaction and its consequential failure/recovery boundary, then run its owned spec before the full gate. Keep test assertions independent of cosmetic implementation. A browser test with synthetic data does not establish provider acceptance, complete accessibility compliance or real consumer integration; app sessions run their own actual application checks.
