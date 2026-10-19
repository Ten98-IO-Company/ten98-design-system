# Shared component and layout consolidation

This review covers the remaining shared foundations, domain presentation, 28 reference flows and five fixed templates. Campaign's logo, icons and login remain authoritative. Three bounded audits selected concrete repetition; independent cross-reviews checked the resulting changes. Domain-specific permission, retention, uncertain-outcome and recovery rules remain explicit.

## Changes

- ActivityFeed uses the existing semantic tone variables and retains its old class hooks. Compatibility badge states share their existing palette rules. Field and Tooltip reuse the existing string-join helper without changing ARIA ordering.
- Identical product root, heading and metadata declarations share selector groups. Component-specific grids, spacing and evidence rules stay separate.
- The original connection, investigation and mutation recipes use EditorTemplate, OverviewTemplate and SettingsTemplate. Their existing controllers, native validation, drafts, receipts, uncertainty and focus recovery remain intact. The other 25 recipes already used fixed templates.
- Template previews and copied TSX now use one source. Each copied file includes the local five-template demonstration and a selected invocation; it is self-contained, with no new public helper or runtime dependency. The recipe registries also share their existing public-import rewrite.
- Connect now combines automation, integrations, wiki/docs and research. The current suite has nine apps. Discover keeps its SEO and analytics research. The dated Researcher proposal and legacy coverage fragment remain available.

## Verification and screenshot comparison

Typecheck, library/catalogue build, **59 native checks** and **511 strict standalone TSX examples** pass. A new check compiles the copied template states and compares their rendered content with the live previews. Public component coverage remains **73 components, 406 states and 28 flows**.

The frozen runtime/style gate passes **174/174 Playwright cases in 3.3 minutes**, one worker and zero retries. Screenshot review then found a catalogue-only regression: the investigation refresh action stretched across its full filter row. A local wrapper restores the content-sized button. The final build/native/example gate passes again, followed by **6/6 targeted recovery, copy-navigation and enlarged-text checks in 19.1 seconds**. No shared runtime or stylesheet changed after the complete gate; a second monolithic final-source run is not claimed.

Playwright captured **56 final comparison images** across light/dark and 1440/320px. Sixteen sampled ActivityFeed, AudienceSummary, ReportPanel and ReplayControls pairs are byte-identical after restoring the prior CSS over current markup. This verifies the sampled style consolidation, not every possible application composition. Three flow pairs use the prior recipe source and current shared primitives; their changed framing was inspected directly. The investigation's eight affected captures were refreshed after the action correction. There were zero page errors or unexpected requests. Static default-state screenshots complement the interaction checks; they do not prove alternate states, measured contrast or live providers.

| Flow | Prior framing, dark 320px | Final fixed template, dark 320px |
| --- | --- | --- |
| Connection setup | [Before](images/dry-kiss/connection-before-dark-320.png) | [After](images/dry-kiss/connection-after-dark-320.png) |
| Data investigation | [Before](images/dry-kiss/investigation-before-dark-320.png) | [After](images/dry-kiss/investigation-after-dark-320.png) |
| Mutation review | [Before](images/dry-kiss/mutation-before-dark-320.png) | [After](images/dry-kiss/mutation-after-dark-320.png) |

The final [desktop investigation](images/dry-kiss/investigation-after-light-1440.png) retains an intrinsic refresh action and full-width results. Narrow tables retain their labelled, keyboard-focusable local scroll region; a static image showing only the first columns does not establish scrolling access by itself. The browser interaction and enlarged-text gates cover that behavior. Seven representative figures are published; the [evidence receipt](dry-kiss-evidence.json) records hashes and boundaries for the complete capture set.

The retained [official template figures](../2026-10-19/visual-templates.md) inform fixed task structure, grouped controls and section hierarchy. The [Campaign reference register](../2026-10-19/visual-campaign.md) and [Discover comparison](../2026-10-19/visual-discover.md) remain task-specific references. They are captured public vendor UI figures, not authenticated vendor interactions or proof of current dark-theme parity. No fresh external reference capture is claimed for this implementation-only consolidation.

## Consumer ownership

Campaign's four repeated recovery/replacement field wrappers can use AppField while keeping all native names, constraints, values and warning text. Controlled selects retain their native implementation because the compatibility selector does not expose their full event/disabled contract. Discover's existing brand wrapper is already a minimal shared re-export; replacing it again would add churn.

The immutable candidate and each app's original browser checks must pass before final adoption is recorded. Separate app-owned feature work is not evidence for this shared patch. The existing human Campaign OOH tab is preserved.
