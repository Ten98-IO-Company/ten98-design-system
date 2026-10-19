# ten98-voip decisions proposed for review

**19 October 2026 · Proposed only.** These recommendations use the [current coverage table](../../UX-PATTERNS.md), [evidence](evidence.md) and [flow study](flows.md). They do not expand the roadmap automatically. The **human and parent design-system session** have final feature/flow authority. The VoIP application session implements product behavior and integrates approved shared UI.

## Recommended direction

Use the existing Campaign identity in three task-oriented workspaces: **Calling**, **Queues** and **Administration**. Keep the active call reachable across navigation, show whether data is fresh, and distinguish requested actions from confirmed call state. Prioritize understandable calling and recovery over a large dashboard or graph editor.

This is a design inference. The evidence supports studying 3CX/FusionPBX/FreePBX for self-hosted concepts, Aircall for approachable controls, Genesys/NiCE/Amazon Connect for operational depth and Zoom for queue drill-down. Review volume and market position justified the research shortlist; they do not prove these are the best individual screens. See [selection evidence](evidence.md#feature-level-reference-choices).

## Decision register

Priority means order of design investigation, not an approved release plan. Confidence concerns the UX rationale; it does not establish implementation feasibility.

| ID | Proposal | Scope classification | Priority / confidence | Decision needed before implementation |
| --- | --- | --- | --- | --- |
| V01 | Preserve one persistent active-call summary/control surface when moving between directory, history and queues | Refinement of scoped softphone/call controls | P0 / high | First device target; single-call or multiple-call model; how navigation/session expiry affects media |
| V02 | Show connectivity, user presence, queue membership and call state separately | Refinement of scoped presence/call state | P0 / high | Authoritative event fields, stale timeout and effective availability rules |
| V03 | Offer clearly named immediate transfer and consultation; identify caller and consulted party throughout | Refinement of scoped call controls | P0 / high | Supported destinations, failure/return behavior, call-leg IDs and action capability matrix |
| V04 | Add wrap-up outcome/notes only with explicit policy; distinguish call ended from work completed | New detailed requirement within broad contact-center scope | P1 / medium | Whether required at all; code taxonomy; timer/auto-completion and draft-retention rules |
| V05 | Build queue administration with ordinary forms, member list and fallback sections first | Refinement of scoped queue/routing UI | P1 / high | Initial distribution strategies, membership model and apply semantics |
| V06 | Give queue views visible scope, freshness and drill-down; keep unavailable distinct from zero | Refinement of scoped live queue board | P1 / high | Initial metrics, formulas, permissions, update cadence and maximum queue/agent volume |
| V07 | Separate a routing draft from the active route and review affected numbers before activation | New workflow safety proposal within routing scope | P1 / high rationale, medium feasibility | Backend version model, validation, activation/reconciliation and recovery support |
| V08 | Start routing editing with forms/list; add graph view only when real branching complexity justifies it | Implementation approach for possible routing builder | P2 / medium | Actual node types, graph sizes, legal cycles, keyboard alternative and whether Connect can share presentation |
| V09 | Use call history → call/leg detail → authorized playback, beginning with native audio controls | Refinement of scoped recording player | P1 / high | Segmentation, media readiness, access model and retention state contract |
| V10 | Add supervisor listen/whisper/barge only after a separate feature decision | **New feature suggestion** | P2 / medium | Permission model, participant visibility, auditing and allowed contexts |
| V11 | Consider transcript search, redaction, coaching/QM and AI summaries later | **New feature suggestions** | P3 / low until actual users/data | Clear use case, accuracy/provenance, access, storage and human review |
| V12 | Consider outbound campaigns, predictive dialing, omnichannel inbox, workforce scheduling and CRM workflows separately | **New feature suggestions** | P3 / unprioritized | Owner selects scope; campaign overlaps and each product's responsibilities must be agreed |

The current matrix already places SIP/media, recording, routing, call state and contact-center logic in the application. It lists specialized UI as an extension **when needed**, not a commitment to ship every specialist component now. No backend or engine choice is made by this study.

## Smallest reusable UI work worth considering

The current library covers most administration and history presentation. Prefer recipes composed from its existing exports before adding a public API. Candidate names below describe possible future work and **are not available imports**.

| Candidate | Existing foundation / first approach | Real gap that would justify a new component | Controlled boundary and acceptance |
| --- | --- | --- | --- |
| Call action group | `Button`, `Badge`, `Tooltip`, `Card`, `Alert` | Repeated action layout and pending/pressed states across full phone, mini phone and queue detail | App supplies call/party IDs, capabilities, confirmed state and callbacks. Show action-specific pending/error, accessible names and focus stability. No media client. |
| Readiness summary | `ResourceCard` + individually labelled `Badge` values | Repeated distinction among device, presence and queue readiness | App computes eligibility. Unknown/stale are explicit. Start as a documented composition. |
| Transfer destination picker | `Field`, `Input`, result list or native `Select`, `Dialog` | Large remote directory with agents/queues/numbers, async results and explicit selection | App supplies results/loading/error/selected ID. Needs keyboard movement, selection announcement and stale result handling. Current `Select` has no async combobox behavior. |
| Live operational table | App-owned remote/live table with shared tokens | Measured data volume and stable keyboard behavior exceed local `DataTable` | Do not add a generic engine speculatively. Parent should coordinate with Monitor/Server needs before designing a shared contract. |
| Routing step/inspector composition | `SettingsSection`, `Field`, `Select`, `Accordion`, `Alert` | A confirmed graph editor needs consistent selected/invalid/pending node presentation | Share presentation with Connect only after comparing actual requirements; routing execution and validation stay in each app. |
| Recording detail/player | `Card`, native `<audio controls>`, `Badge`, `Alert` | Confirmed segment navigation, per-party audio or synchronized transcript requirement | App supplies authorized media and metadata. Test buffering/error/expired access/partial segments. Avoid custom waveform dependency without need. |
| Wrap-up form | `Field`, `Select`, `Textarea`, `Button`, `Alert` | Repeated composition across confirmed contact-center entry points | App owns required fields, deadline, save/reconciliation and status. A timer in a component must never choose when agents become available. |

A scoped status/helper recipe is preferable to a new `VoipProvider` abstraction. Keep easy named imports from `@ten98/ui`; use `@ten98/ui/app` only for the existing Campaign-compatible branding/adapters as documented in [integration](../../INTEGRATION.md). Do not pull routing or telephony dependencies into all consumers.

## Visual and interaction rules to carry into design

These are proposed acceptance rules consistent with the suite's existing guidance:

- Use `AppBrand` and the Campaign icon family for identity; preserve the Campaign login pattern. Competitor references guide information hierarchy and interaction only.
- Use canonical `tokens.color.surface`, `text`, `muted`, `border`, `accent`, `success`, `warning`, `danger` and `info`; spacing/type/radius/control-height references come from the existing token module. No separate VoIP palette or copied competitor CSS.
- Use a labelled neutral state for unknown/offline where appropriate; success must describe a confirmed positive state. Available, busy, opted out, disconnected and forbidden require text, not just a dot or a shared color.
- Keep call controls in a stable order. Separate End call from frequent actions. A button changing position during an event must not cause the next click to hit another action.
- Phone numbers, extension identifiers and SIP addresses keep readable direction in RTL. Layout uses logical spacing; chronological order and telephone keypad order must be intentional.
- The sidebar has no visible scrollbar track/thumb. Keep its contents reachable by wheel, touch and keyboard, including at zoom; hiding overflow to remove access is unacceptable.
- On narrow screens, place active call and recovery actions before secondary details. Permit labels to wrap. Do not make an icon tooltip the only way to discover a critical action.
- Keep one action's error near that action. Use a persistent alert for uncertainty or failed connection; transient toasts are insufficient for a call whose state is unknown.

## Reference tradeoffs to avoid copying blindly

| Reference pattern | Useful idea | Adaptation required |
| --- | --- | --- |
| 3CX floating/compact dialer | Keep calls accessible while browsing | A detached window is optional; prove keyboard/focus/mobile behavior before offering it |
| FusionPBX dense tables and forms | Expose useful operational fields without a decorative dashboard | Public screenshots have uncertain build age; progressively disclose advanced settings and retain readable labels |
| Aircall visual routing | Nodes plus an inspector make branching understandable | Hover-only insertion and canvas navigation need keyboard/list equivalents; current imagery was not fully retrievable |
| Genesys queue state detail | Separate presence, routing and per-interaction status | Avoid enterprise metric overload; pick only the first actual supervisor tasks |
| Amazon context workspace | Caller controls and customer context remain adjacent | Cases, knowledge and omnichannel features are additional scope, not prerequisites for a phone |
| Enterprise wrap-up workflows | Ending a call and finishing work can differ | Mandatory timers, outcomes and auto-ready behavior must be chosen explicitly, not copied as defaults |

## Inputs needed from the app/human before the first specialist build

1. **First workflow and user:** employee calling, receptionist, support agent or PBX administrator; desktop browser versus deskphone-controlled workflow; initial multi-call policy.
2. **Backend contract:** source of truth for registration, calls/legs, capabilities, queue membership and media; how commands acknowledge, time out, deduplicate and reconcile.
3. **Scope and access:** tenant/department model; roles for calling, queue intervention, configuration, recordings and exports.
4. **Routing behavior:** engine-supported destinations/strategies, office-hour precedence, version/application model, fallback and rollback semantics.
5. **Recording/work completion:** whether recording, playback, download, retention, disposition and wrap-up are in the first release; what constitutes confirmed completion.
6. **Scale and language:** expected directory/history/queue sizes; update rates; RTL/locales and minimum supported device conditions.

These are decision inputs for the parent/app planning conversation, not blockers to documenting reusable baseline forms or states. A future implementation request should name a concrete flow, the chosen state contract and sample synthetic data.

## Suggested validation and handoff

First review a static composition for V01–V03 with the human, including disconnected, incoming, active, held, consultation, transfer pending, uncertain and ended states. Use short realistic labels with existing tokens. Then connect the selected design to the app's real controller. This sequence is a proposal; no prototype or component was built by this research fork.

The design-system session validates the shared layout, interaction semantics and documented API. The application verifies real call transitions, idempotency, reconciliation, access enforcement and actual media behavior. The human reviews feature selection and operational policy. A visually successful catalogue example cannot establish that a call transferred, a route activated or a recording is complete.

Before accepting a shared component, include its TSX example, actual props, canonical token references, all supported states, keyboard behavior and scale limits in the catalogue. Use the [flow acceptance scenarios](flows.md#common-acceptance-scenarios-for-the-parentapp-handoff) to choose the smallest meaningful runnable checks. Add no dependency simply because a competitor has a large canvas or waveform.

## Deliverable status

Completed: category/candidate evidence, current review/ranking/share distinctions, public visual observations, matrix-to-flow mapping, proposed states/layouts and owner decisions. No application files, package manifests, shared component source, Git state or deployments were changed by this research fork. Recommendations await parent/human selection.
