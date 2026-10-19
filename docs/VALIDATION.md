# Release validation

Validated locally on 19 October 2026 using Node.js 22.14 for the library and Node.js 24.19 for consuming applications, with React 19.2.8.

Run `npm run check` for TypeScript checking, the library and catalog production builds, and 18 native Node tests. The tests cover table transformations, field associations, confirmation prerequisites, permission role edge cases, secret labels, date boundaries, chart numeric ranges, semantic palette contrast, standalone sizing/fonts, theme and density resets, package exports, retained client directives, native application field defaults/constraints, brand markup and the Campaign inbox icon.

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
