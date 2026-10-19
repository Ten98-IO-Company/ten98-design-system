# Auth and Wiki proposals for decision

Snapshot: **19 October 2026**. Evidence: [evidence.md](evidence.md). Detailed observed and proposed flows: [flows.md](flows.md). These are recommendations, not approved requirements or implementation claims. The human owner and parent design-system session decide the flows and shared UI; application sessions implement their domain behavior.

## Recommended reference strategy

Use a task-specific reference set. Auth combines authentik's application/provider setup, JumpCloud's resource relationships, Auth0's authentication/recovery separation, Keycloak's session scopes and Entra's policy evaluation. Wiki starts from Docmost's tree/editor model, using Notion for search/navigation, Confluence for discussion/comparison, Outline for revision restoration and BookStack for changed comment anchors. Neither review scores nor repository stars justify copying a whole application.

Campaign remains the logo, icon and login baseline. Keep all proposals modular: reuse named `@ten98/ui` imports and semantic tokens, compose current foundations first, and add a specialized export only after an app has an approved use case and a precise behavior contract. The sidebar must have no visible scrollbar while retaining scrolling and focus access.

## Auth priorities

| Proposal | Scope status | Priority and confidence | Decision needed before implementation |
| --- | --- | --- | --- |
| Application/provider setup with explicit audience and review | Existing identity-protocol scope; proposed flow A1 | P0, high task fit | Initial protocols, deployment/environment model, draft/test/active semantics and default access rule |
| Campaign-pattern sign-in with named provider/challenge/recovery states | Existing authentication/credential scope; A2/A4 | P0, high | Local accounts, organization discovery, allowed factors and recovery policy; no new branding |
| Directory list and person detail with direct/inherited access | Existing team/role/directory scope; A3 | P0, high | Authoritative source for each attribute, group nesting, membership scale and edit permissions |
| Scoped session investigation and truthful revocation results | Existing session/investigation scope; A5 | P0, high | Backend revocation guarantees by protocol, current-session behavior and metadata disclosure |
| Per-resource provisioning/offboarding results | Existing provisioning scope; A6 | P0, high | Supported connector capabilities, reconcile/retry rules, deletion semantics and retained data |
| Form-based policy authoring plus explanation | Matrix-listed specialized extension; A7 | P1, high need / medium implementation certainty | Policy schema, rule precedence, validation, protected-admin behavior and simulation guarantees |
| Effective-access paths as a table before a graph | Matrix-listed specialized extension; A8 | P1, medium | Which investigative questions require paths, disclosure limits, source freshness and scale |
| Scheduled activation/offboarding | **New explicit feature suggestion** within broader lifecycle domain | P2, medium | Human need, timezone rules, cancellation, scheduling precision and affected integrations |
| Access certifications, time-limited access requests, agent identities, advanced device compliance | **New suggestions**, beyond the initial row's explicit features | Defer | Concrete product need, ownership across Auth/Connect/Monitor, enforcement and audit models |

P0 means the first design work **if the app is started**, not permission to implement a product feature now. Auth's first iteration should not require a generic policy canvas or access-graph library. Tables, native fields, review summaries and observable results cover the first useful flows.

## Wiki priorities

| Proposal | Scope status | Priority / confidence | Decision still needed |
| --- | --- | --- | --- |
| Space/page tree, editor shell and explicit save state | Existing matrix | P0; high task-fit confidence, actual usability untested | Autosave-only vs draft/publish, permitted nesting depth, expected document size and concurrency |
| Scoped keyword search with path/freshness metadata | Existing matrix | P0; high | Ranking/filter requirements; how indexing delay and restricted content are handled |
| Access explanation with inherited/direct grants | Existing matrix | P0; high need, model undecided | Docmost-style restrictive ancestry, broader-grant model, or another explicit policy; guest/public scope |
| Inline comments with recoverable resolve/reopen and orphaned-anchor state | Existing matrix extension | P1; high | Whether resolution requires editor rights, commenter rights or moderation rights; behavior when quoted text is removed |
| History comparison and restore-as-new-version | Existing matrix | P1; high | Retention, who can view history, atomic restore behavior with concurrent editors, non-text diff support |
| Import/export/trash recovery | Storage-lifecycle proposal; not enumerated as separate features in matrix | P1; medium | Formats and guarantees; migration fidelity; retention and purge policy |
| Page owner, review due date and verification workflow | **New suggestion**, inspired by enterprise governance | P2; medium | Approval roles, status transitions, reminder delivery, whether verification expires after edits |
| AI answers, MCP, structured databases/Kanban, synced blocks | **New suggestions**, outside initial row | Deferred pending product decision; insufficient need evidence for this app | Concrete task, source attribution, permission boundaries, cost/latency and relationship to Connect |
| Read confirmation | **New suggestion**; Docmost current pricing marks it coming soon | Deferred; low implementation-reference confidence | Human need and reliable meaning of acknowledgment; do not infer reading from opening a page |

## Shared component opportunities

| Candidate | Reuse today | Promotion trigger and boundary |
| --- | --- | --- |
| Effective-access explanation | `Badge`, `DataTable`, `Breadcrumb`, `Alert` | Auth and Wiki need the same presentation for source, inheritance, scope and timestamp. They must supply their own access calculations; do not share a permission engine. |
| Operation result list | `ResourceCard`, `ActivityFeed`, `Badge`, `Alert` | At least one concrete provisioning/import flow needs per-target pending/partial/error states. A second consumer in Connect/Monitor may justify a small shared composition. |
| Searchable member/resource picker | Native `Select` for small known lists; existing dialog/input foundations | Async search, multiple selection or large directories make the native control inadequate. Define keyboard behavior, loading and missing selections before adding a combobox dependency. |
| Hierarchical navigation and move picker | Shell slots, nested links/disclosures, breadcrumbs | Approved tree scale and keyboard requirements for Wiki/Auth/Server. The component receives nodes and callbacks; it does not load data, authorize moves or decide inheritance. |
| Investigation/detail panel | `Card`, `Tabs`, `ActivityFeed`, `Dialog` | Repeated session/document/incident inspection with a concrete narrow-screen and focus contract. Avoid a generic drawer merely to imitate a screenshot. |
| Revision comparison / anchored discussion | Existing buttons, tabs, badges and fields for chrome | Wiki defines its editor document model, stable revision IDs and anchoring semantics. Share presentation only after those contracts exist. |

These are candidate gaps, not a mandate to add six components. `DataTable` currently handles local data; `PermissionMatrix` is controlled checkbox presentation; `Stepper` is display-only; `SecretField` already receives the secret. None provides server queries, authorization, workflow execution or secure storage.

## Decisions to bring to the parent and owner

1. Auth's primary audience: internal workforce first, developer/application identity first, or separate admin surfaces for both. This controls navigation and the first setup flow.
2. Auth's default access and source model: explicit assignments versus any-user access, local versus federated attributes, and what “suspended” guarantees downstream.
3. Wiki's permission algebra: restrictive ancestor intersection, highest grant wins, or another explicit rule. Show it consistently in access panels, moving pages, search and history.
4. Wiki's save model: autosave-only versus draft/publish, concurrent edit behavior and recovery when permission changes while a draft is open.
5. The first real shared gap requested by an app. Build and document that gap here before asking app sessions to integrate it.

## Acceptance of any approved implementation

Each component request should name the user task, route/scope, data contract, existing components that fall short, complete applicable states, keyboard/responsive behavior and application-owned guarantees. The parent implements the smallest reusable TSX contract and catalogue examples. The app verifies its real authorization/data flows. Review uses the linked competitor flow and the ten98 brand baseline, not a generic “looks like competitor” verdict.

No research finding certifies accessibility, concurrency correctness, migration fidelity or security of a future implementation. Those remain measurable acceptance work once a concrete flow exists.
