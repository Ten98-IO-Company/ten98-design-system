# Monitor and Server: proposed design decisions

Research date: **19 October 2026**. **All proposals await the human and parent design-system session's decision.** App sessions own product functionality, data and execution. This research changed only its three report files; it did not change a public API, package, catalogue, app or Git state.

Read [evidence.md](evidence.md) for ratings, adoption denominators, sources and observation limits; [flows.md](flows.md) maps the full Monitor/Server coverage to task sequences, states and component reuse. Work follows [the bounded swarm gates](../../SWARM.md).

## The proposed starting point

Use task-specific references: Grafana for investigation context, Sentry for error/event hierarchy, Zabbix for explicit problem actions, PagerDuty/JSM for incident ownership, Fleet/Intune/Jamf for device state, Proxmox for VM operations, Portainer/Komodo/Openship for container deployment, and OpenShift/Rancher for Kubernetes navigation. These selections combine fit with review and documentation evidence; they are not an overall market-share ranking. Preserve Campaign's branding, icons and authentication pattern throughout.

Three reusable compositions give the strongest initial return from existing exports:

1. **Connection setup and verification.** Separate saved configuration, connection, first data and optional notification verification. Useful to Monitor collectors, Server agents and other suite integrations. Build the presentation from `Stepper`, fields, `CopyButton`, `ResourceCard`, `Badge` and `Alert`; app callbacks supply actual results. References: GlitchTip/New Relic setup, Fleet enrollment, Komodo connection and Openship server setup, linked in M1/M7/S1.
2. **Investigation with explicit coverage.** Keep resource, environment, time and selected evidence stable across summary/results/detail. Show partial, stale, sampled, retained and filtered-empty data honestly. Use `PageHeader`, cards, badges, tabs and alerts first; defer specialized query/graph engines. References: Grafana/Datadog investigation and Sentry event context, linked in M2–M4/M8.
3. **Consequential operation review and outcome tracking.** Show exact resource/scope, preflight and effect; distinguish accepted, running, confirmed, partial and uncertain outcomes. Compose `Dialog`/`ConfirmDialog`, fields, `Badge`, `ActivityFeed` and persistent alerts. References: Fleet/Intune commands, Proxmox tasks and Openship restore, linked in M7/S5–S7. Reconciliation is an app callback, never a generic automatic retry.

These are **presentation recommendations within existing scope**. They need not add new exports. The root session may choose catalogue examples first so app teams can review a concrete interaction before asking for a library contract.

## Decision ledger

Priority describes proposed research/design order, not an approved build queue. “High confidence” means evidence for the interaction is strong; it does not mean ten98 product requirements are complete.

| Proposal | Scope classification | Evidence / inference | Priority and confidence | Decision needed |
| --- | --- | --- | --- | --- |
| Resource detail shows observed state, last receipt/contact, intended change and pending task separately | Existing collection/fleet/server responsibilities | Observed in several operational tools; unified ten98 presentation is synthesis | P0, high | Which states and timestamps can each backend actually supply? |
| Preserve scope/time/selection on investigative pivots | Existing investigation extension | Grafana correlation and Datadog scope observed; exact ten98 URL contract proposed | P0, high | Canonical project/service/environment identifiers and time-zone policy |
| Keep alert evaluation, incident/service state and notification delivery distinct | Existing alert/incident scope | Current Grafana/Sentry/PagerDuty semantics observed; ten98 taxonomy proposed | P0, high | Detection model, delivery engine and allowed incident transitions |
| Bulk action review shows eligible targets and per-target result | Existing fleet/incident actions | Zabbix mixed permission and Fleet batch behavior observed | P0, high | Selection semantics across server pages, scale and cancellation policy |
| Durable task details remain accessible after navigation | Existing Server task/recovery scope | Proxmox and Openship observed; shared UI contract proposed | P0, high | Persistent task identity, reconnect/reconciliation API, safe retry rules |
| Review restore mode, target and data consequences before confirmation | Existing recovery scope | Harvester/Openship distinctions observed | P0, high | Supported backup types, overwrite semantics and pre-restore protection |
| Graph and list share scope/selection, with independent availability | Existing specialized topology scope | Tempo table/graph and OpenShift graph/list observed; keyboard parity proposed | P1, medium-high | Real graph source, size, freshness and accessible interaction contract |
| Resource tree and VM editor | Existing specialized extension scope | Proxmox/Harvester observed; modular ten98 contract not yet defined | P1, medium | Backend schema, estate size and whether a nested list/native form is sufficient |
| Terminal/task output surface | Existing specialized extension scope | Portainer/Komodo/Proxmox observed; technology choice unmade | P1, medium | Exec/attach/console types, sessions, transcript, keyboard and redaction |
| Controlled remote table contract | Supporting need at larger scale, not an automatic API addition | Current `DataTable` limitation verified locally; scale need is inference | Triggered by real app request | Backend query/page/select contract and actual dataset size |
| Automated network rollback | **New suggestion** | Historical Cockpit safeguard; requires backend support | Later, medium | Connectivity proof, rollback deadline and recovery guarantees |
| GitOps change sync or staged parallel procedures | **New suggestions** | Komodo/Portainer demonstrate patterns | Later, medium | Product scope, approval model and source of truth |
| Saved investigations, cohort comparison or notification-policy visualizer | **New suggestions** | Grafana/Honeycomb/routing references; utility for ten98 untested | Later, medium-low | Actual repeated user task and expected benefit |
| Public status pages, advanced recurring maintenance, PIR editor or chat bridge | **New suggestions** beyond the initial broad rows | Competitors demonstrate these; implementation is not implied by this research | Later, medium | Human feature selection and which app owns each capability |
| Autonomous remediation or AI root-cause claims | **New suggestions; defer** | Popularity/marketing does not establish correctness or user trust | Defer, low for ten98 fit | Separate evidence, behavior limits and human decision required |

## Reuse before adding a component

The [current inventory](../../COMPONENTS.md) already supplies labelled native forms, semantic status, cards, dialogs and activity. Keep one design-token source and easy named imports. Compose those controls before extending an API.

| Need | First implementation to review | Limit that would justify a specialized request |
| --- | --- | --- |
| Resource inventory/detail | Existing header, cards, badges and application-owned links | Lazy hierarchical navigation across a real large estate |
| VM/connection/configuration form | `SettingsSection`, native fields, `Stepper` and review section | A specific backend schema that cannot be expressed clearly as those compositions |
| Job progress | Status text, phase list, activity and linked job detail | High-volume output, resumable stream or complex per-target filtering |
| Incident history | `ActivityFeed` with app-supplied event identity/time | Filtering, event/recorded timestamps, causal grouping or high-volume rendering |
| Query time scope | Native datetime inputs with app-owned timezone logic | Repeated relative/absolute comparison needs confirmed in the apps |
| Access editing | `PermissionMatrix` for editable draft and separate effective-access explanation | Inheritance/resource scope that needs a deliberate new presentation contract |

Do not use date-only `DateRangeField` for sub-day incident windows. Do not pass one remote page to `DataTable` and describe it as the full collection. Do not give `MetricCard` a favorable trend color merely because utilization increased. Do not supply secrets to `SecretField` before the app authorizes the operator to receive them. These are existing API boundaries, not new product behavior.

## Acceptance for a decided flow

The parent can review a synthetic catalogue composition without implementing an engine. Each composition should show the happy path plus empty, filtered-empty, loading, error, partial, stale, read-only, pending and unknown outcomes where applicable. The app then verifies those states against actual service behavior.

For operations, verify a lost response leads to reading the existing job/resource state, not blind resubmission. For collection, verify “waiting for data” never becomes zero/healthy. For fleet actions, verify queued server work is not displayed as confirmed device change. For recovery, verify release rollback and data restore have distinct consequences.

Keyboard users must be able to reach every action, inspect details, exit consoles and return from dialogs. Graphs need a list/table path. Live updates need bounded announcements. Test real narrow screens, 200% zoom, long labels, RTL and forced colors. The sidebar must remain scrollable and focus-reachable while showing no visible scrollbar, as the owner requested.

No new dependency is justified by this report alone. Terminal, graph, code-editor, virtualization and orchestration choices require a concrete accepted flow and constraints.

## Unresolved product decisions

- **Monitor scope:** Which platforms are managed first, how are fleets/projects related, and does “Jira-like” mean incident work, general issue planning, or both?
- **State ownership:** What are the incident transitions, escalation behavior, device command outcomes and authoritative freshness timestamps?
- **Server capability model:** Which hypervisors/container backends are supported first, and which operations differ by provider or resource type?
- **Recovery:** What can be rolled back, which data is overwritten, what stays recoverable, and what preflight evidence is available?
- **Scale and access:** What inventory/log volume, remote selection semantics, role inheritance and session limits must the UI support?
- **Optional features:** Which of the explicitly new suggestions should become requirements, and which app owns them?

These are decisions for the human and parent session, not blockers to completing this research. Public documentation supplied the assigned matrix coverage. Authenticated competitor operations, failure injection and accessibility audits were not performed; blocked/inaccessible material is recorded in the evidence file. The research stops after the single consistency pass below.

## Completion check

- All ten Monitor flow groups and eight Server flow groups map back to the two assigned matrix rows, including app-owned behavior and specialized extension boundaries.
- Owner-named references are present, with Openship separate from OpenShift and Jira's incident interpretation explicit.
- Review dates, counts and denominators are recorded; unavailable comparable market share is stated rather than inferred.
- Observed flows, live observations and ten98 proposals are distinguished; versioned/historical images are labelled.
- Component names and limits were checked against `docs/COMPONENTS.md`; only the assigned report directory was edited.
- One source/link consistency pass checked local references, flow coverage and the highest-risk current source claims. No further research wave, app edits or Git operations follow this report.
