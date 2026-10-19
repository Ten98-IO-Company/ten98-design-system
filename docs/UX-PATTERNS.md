# Shared UX patterns and suite coverage

## System principles

Use a stable outer application frame and let the current task determine the content. Keep product identity, workspace scope, navigation, page title and primary action in predictable places. Show the scope of an action before asking the user to perform it.

Use the existing purple internal-app identity across the suite. Color carries meaning through semantic tokens, while product names and icons distinguish tools. Keep surfaces quiet so tables, status and actions are easy to scan. Avoid adding decorative complexity to operational screens.

Prefer a readable task flow over maximum information density. Comfortable density is the default; compact density supports desktop comparison and monitoring. Maintain a usable touch path when density changes. Preserve clear focus indicators, visible labels and native keyboard behavior.

## State model

| State | What the interface should communicate |
| --- | --- |
| Loading | Work is in progress; keep the surrounding context and identify what is loading |
| Empty | There are no records yet; explain the next useful action |
| Filtered empty | Records exist, but none match; offer clearing or adjusting filters |
| Zero | A confirmed measurement is zero; display `0` rather than an empty-state message |
| Unavailable | No reliable value was returned; use a label such as “Unavailable” or an explained dash |
| Error | Explain what failed and give a safe next action |
| Partial | Show the usable data and identify the missing or failed portion |
| Stale | Identify the timestamp and the fact that refresh is pending or failed |
| Read only | Explain the user's access while retaining readable content |

Do not turn an unknown metric into zero or erase a user's draft when a request fails. Keep asynchronous feedback close to the affected task. Use a persistent alert for a failure requiring attention and status feedback for successful, nonblocking completion.

The application owns request cancellation, idempotency, reconciliation and retry policy. A library retry button invokes a callback; it cannot establish whether a previous server operation succeeded. If an action's result is uncertain, show that uncertainty and provide a way to reload or reconcile before repeating it.

## Forms, settings and destructive actions

Every field needs a visible label. Link help and errors to its control, and use native input types and constraints where they fit. Retain user input on failed submission. Put a concise error next to the field and a summary when the form has several errors.

Group settings by the user's task and name the scope: your account, this workspace, this project or this resource. Make save behavior explicit. Surface unsaved changes when closing or changing scope would discard a draft.

Reserve confirmation for actions with a real consequence. Name the resource and state the result in plain language: deleting a server, revoking a key, disconnecting an account and ending a call have different consequences. The application decides whether the action is reversible and whether stronger confirmation is required. Do not present a successful toast until the server outcome is confirmed.

Keep cancel and close paths available unless closing would itself cause a loss. Dialogs need a title, an accessible close control, an intentional initial focus and restored focus when they close. Avoid stacking dialogs for routine editing.

## Navigation and authorization

Let each app's router own URLs, active routes, browser history and search state. Use links for navigation and buttons for actions. Preserve direct links to resources and a clear path back to their parent scope.

The design system can show disabled controls, access explanations, role badges and permission matrices. The server must enforce authorization at every relevant boundary, including jobs, exports and integrations. Hiding a control is presentation, not authorization. Recheck permissions when a long-lived screen submits an action.

An empty workspace, missing project, expired session and forbidden resource are different states. Explain the current condition without exposing private resource details to a user who lacks access.

## Tables, charts and activity

Tables should have meaningful headers, stable row identifiers and an accessible name. Keep numeric columns aligned and formats consistent. Distinguish filtering and sorting controls from column labels. Tell users the scope of bulk selection and preserve selection only while that scope remains valid.

The application owns server filtering, pagination, exports and large-dataset virtualization. Do not load an entire dataset merely to match a catalogue example. When paginating, communicate total/loaded counts only when known and use a stable server sort.

Charts should include a visible title, units, time range and text or tabular access to the values. Show a useful zero state and an explicit unavailable state. Avoid conveying series or status by color alone. Respect reduced motion and avoid turning frequent refreshes into attention-grabbing animation.

Activity streams should identify actor, action, resource and timestamp when that information is available. Logs may contain untrusted or sensitive content: render text safely and let the application apply redaction, access restrictions and retention rules.

## Typography, language and layout

Use the body, heading and monospace tokens rather than per-screen font stacks. Keep metadata readable and avoid shrinking dense screens until labels become difficult to read. Allow long project names, translated labels and unbroken identifiers to wrap or truncate with a usable way to inspect the full value.

Use `Intl.NumberFormat` and `Intl.DateTimeFormat` in the application with an intentional locale, currency and time zone. Preserve machine-readable values for sorting and calculations. Label the reporting time zone when it affects interpretation; a relative timestamp should have access to its absolute value.

The current suite uses left-to-right layouts. RTL is outside the requested scope.

Use keyboard navigation, screen-reader checks, zoom, forced colors, reduced motion and narrow screens during acceptance. Automated checks can catch some failures; they do not certify an application as accessible.

<a id="coverage-for-all-ten-tools"></a>

## Suite coverage

The suite has nine current and planned apps. `ten98-connect` combines automation, integrations, wiki/docs and the research direction previously listed as `ten98-researcher`. Discover retains its existing SEO, AI-search and web-analytics research scope. Connect's research workspace records available foundations and pending product decisions, not approved features.

“Foundation” identifies implemented components and the screens they can compose. These compositions do not imply a separate domain-specific export. “Application owned” identifies behavior that must be implemented by the tool. “Specialized extension” names a future component that needs a concrete product requirement; it is not an implemented feature claim.

| Tool | Foundation to reuse | Application owned | Specialized extension when needed |
| --- | --- | --- | --- |
| `ten98-campaign` | Shell, metrics, tables, native date inputs, cards, fields, badges, dialogs and activity for campaign/approval screens | Provider authorization, campaign data, publishing, ad spend, validation and permissions | Publishing calendar, social composer, ad preview, media/DAM editor and inbox |
| `ten98-discover` | Shell, metrics/sparklines, searchable tables, fields, resource cards and status for analytics/research screens | SEO/AEO/GEO data, analytics attribution, research execution, usage accounting and consent | Query explorer, rank comparison, heatmap, replay and research/report editors |
| `ten98-auth` | Fields/cards for authentication layouts, tables/badges for team and role views, dialogs and activity | Identity protocols, sessions, credentials, recovery, provisioning and policy enforcement | Policy builder, directory tree, device/session investigation and access graph |
| `ten98-connect` — automation, integrations, wiki/docs and research | Shell/sidebar slot, resource cards for connections and documents, fields, access badges, activity, tables, detail cards and dialogs; existing `EvidenceSummary`, `EvidenceDetail`, `ReportPanel`, `AppliedFilters` and collection/detail layouts for a concrete research task | Connector runtime, credentials, scheduling, secrets, retries, workflow execution, document storage, collaboration, search, revision integrity and access enforcement; research tasks, data contracts, categories and any paid-provider policy await approval | Workflow canvas, node inspector, mapping editor, execution debugger, rich-text editor, document tree behavior, inline comments and version comparison; define a concrete research task before proposing a specialized extension |
| `ten98-construction` | Shell, resource tables, task/status badges, fields and activity | Project rules, procurement, budget calculations, approvals and field synchronization | Construction schedule, plan viewer, quantity/cost editor and field inspection workflow |
| `ten98-property` | Resource tables/cards for portfolios and devices, badges, settings, activity and dialogs | Property records, tenancy rules, device authorization, protocols and automation execution | Floor-plan/device map, building controls, automation editor and maintenance calendar |
| `ten98-monitor` | Metrics/sparklines, badges, searchable tables, alerts and activity for incidents | Collection, alert evaluation, incident state, fleet actions and retention | Log/trace explorer, topology graph, incident timeline and real-time investigation workspace |
| `ten98-server` | Resource tables, metrics, badges, configuration fields, dialogs and activity | Hypervisor/container orchestration, remote access, RBAC, task execution and recovery | Resource tree, terminal/console, VM editor, storage/network topology and task console |
| `ten98-voip` | Contact/queue tables, presence badges, fields, detail cards and activity | SIP/media, recording, routing, call state, contact-center logic and access | Softphone, live queue board, call controls, routing builder and recording player |

## Adding a shared pattern

Start from the real flow in an application. Identify which parts are presentation and which carry product rules. Reuse the existing component first, then extend its documented API only when that produces a clearer shared contract. A future domain possibility alone is not enough reason to add a dependency or engine.

When a specialized component becomes necessary, define keyboard behavior, empty/error/loading states, scale limits, data ownership and accessible alternatives before promoting it into this library. Keep [the component inventory](COMPONENTS.md) accurate about what exists today.
