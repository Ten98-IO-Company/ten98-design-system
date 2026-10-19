# Bounded parallel design and development

This design-system session and the human owner decide shared UX and components. App sessions own product implementation, integration and release. The initial research scope is the ten-tool coverage table in [UX-PATTERNS.md](UX-PATTERNS.md#coverage-for-all-ten-tools). A research suggestion is not an approved product requirement.

## Before dispatch

The coordinator selects one concrete outcome and checks existing components first. A worker receives only the relevant files, task, acceptance criteria, owned output paths and stop rules. Fresh workers use a compact brief instead of inheriting the entire conversation. Parallel workers must have disjoint write ownership. The coordinator owns shared registries, package changes, final review and publishing.

## Design challenge gate

The owner explicitly requires the same challenge-and-verify process for Campaign, Discover and every worker. Existing app code establishes compatibility and data contracts; its interaction choices are not automatically approved. For each flow, compare the proposed interaction to the task-specific references in the research, identify what should be retained or improved, and record why. Find a missing primary reference only when the existing evidence does not resolve the decision. Do not copy a competitor's unsupported policies or ten98's existing usability defects.

Acceptance requires concrete keyboard, narrow-screen, empty/error/partial/stale/unknown and draft-recovery cases where applicable. Use an old-behavior negative control for consequential fixes. Compilation or a source inventory alone is not UX acceptance, and local simulation is not live-provider validation. The coordinator and human decide unresolved tradeoffs. Workers return the comparison, checks and limits with their deliverable; they do not start an open-ended research pass.

## Hard gates

| Gate | Required evidence | If it fails |
| --- | --- | --- |
| Scope | Real consumer request or coordinator-approved reference composition; explicit app-owned behavior | Return the missing contract; do not invent a backend or add speculative features |
| Reuse | Existing exports and platform behavior checked before adding code | Compose existing components; explain a new export only when a concrete gap remains |
| Ownership | One assigned file or isolated directory; no sibling app writes, package changes, commits or releases | Stop and return the proposed cross-boundary change to the coordinator |
| Bounded work | Coding worker: at most 12 tool calls, one targeted check and at most two repair passes; no nested workers without coordinator assignment | Return results, exact blocker and smallest next action; do not loop or broaden the task |
| Contract | Typed props/callbacks, canonical tokens, complete TSX, applicable states, keyboard and narrow-screen behavior | Keep it out of the public API/catalogue until corrected |
| Verification | Typecheck/build, meaningful regression checks and Playwright for every new component/flow; catalogue inventory, all examples compile, previews render; primary interaction plus consequential recovery boundary at desktop and narrow English layouts | No merge, package or handoff marked complete |
| Review | Coordinator reviews diff, sources, ownership and browser behavior; independent review for nontrivial shared changes | Fix the concrete issue, then repeat only affected checks |
| Release | Versioned immutable archive for library changes; app session verifies and integrates its consumer | Do not overwrite a released archive or claim an app is deployed |

Research workers produce evidence, observed flows and recommendations inside their assigned directory. They must identify source dates, category fit, review counts and market-share denominators, distinguish adoption proxies from measured share, and label inference. Finish the requested matrix coverage, run one source/link consistency pass and stop. Conflicting or inaccessible evidence is a reported limitation, not a reason for an open-ended search. Research workers do not code or create further workers unless assigned.

## Current development wave

Three independent workers completed React/TypeScript reference compositions from existing exports: connection setup and verification, data investigation states, and consequential-change review with uncertain-outcome reconciliation. These are local catalogue examples with synthetic data. They establish reusable flow presentation without enabling application features or introducing new library exports. The coordinator integrated them, compiled all copied examples, obtained a fresh-context review and ran the native flow regression check before handoff.

Completion means the assigned outcome and checks are done. Passing work stops; repeated testing needs a new failure or a concrete unresolved concern. There is no background polling, recurring work or automatic new task dispatch after completion.
