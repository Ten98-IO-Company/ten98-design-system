# ten98-connect: recommendations for decision

Prepared **19 October 2026** for the human owner and parent design-system session. **Everything below that selects a flow or adds functionality is a proposal.** The accepted starting scope remains [the ten-tool coverage table](../../UX-PATTERNS.md#coverage-for-all-ten-tools). [Evidence](evidence.md) records sources and limitations; [flows](flows.md) contains observed steps, proposed states, wireframes and acceptance tasks.

## Recommended reference set

Use **Activepieces for the approachable builder and draft lifecycle**, **n8n for data inspection and debugging**, and **Make for mapping and recovery operations**. Use Zapier/Pabbly as guided-setup comparisons, Workato for run/version semantics, and Power Automate for runtime approvals if approved. OpenClaw and likely Hermes supply agent-operation references, a distinct category.

This is a feature-specific design judgment, supported by the review/fit comparison and documented flows in [evidence](evidence.md), not a claim that these products are universally best. Review scores help establish a credible comparison set; actual task behavior determines which pattern to use.

## Already scoped versus newly suggested

| Item | Scope status | Proposed next decision |
| --- | --- | --- |
| Connections, credential references, scheduling, retries and execution | Existing application-owned scope | Define real backend outcomes and the minimum first workflow before finalizing UI contracts. |
| Resource cards, fields, status, activity, tables and detail panels | Existing shared foundation | Compose current exports first; request a new component only when the product flow exposes a concrete gap. |
| Workflow canvas, node inspector, mapping editor and debugger | Existing named future extensions | Prioritize by real use case; their mention in the matrix does not establish completed components or mandate building every editor now. |
| Draft/published revision separation and explicit test effects | Proposed UX decisions within workflow scope | Recommended baseline for owner review; app must supply revision and effect semantics. |
| Publish approval gates and runtime approval inbox | New specific functionality | Decide separately. Publishing a definition and approving one action are different jobs. |
| Agent sessions, MCP tool discovery, device pairing and delivery retry | New specific functionality beyond current matrix; motivated by named references | Confirm intended agent runtime and which workflows must support it. |
| Vault administration, cross-project global connections, environment promotion | New enterprise capability choices | Research reference exists; defer components until access model and actual need are established. |
| Voice input / live-call assistance | New and identity-uncertain | Hold until Whispr product URL and intended job are known. |

## Proposed priorities and evidence confidence

P0 means decide for the first usable workflow; P1 means after the runtime contract is known; P2 means defer until a concrete requirement. These are research recommendations, not an implementation order issued to app sessions.

| Priority | Proposal | Evidence versus inference | Confidence / dependency |
| --- | --- | --- | --- |
| P0 | Use scoped connection records with account identity, owner, granted access and verification timestamp | Observed inventory/credential flows: C1. Inference: these details prevent wrong-account actions. | High flow evidence; exact scopes depend on connector/runtime. |
| P0 | Separate draft, published version, step configuration, test state and run state | Observed lifecycle: C2/C4. Inference: distinct labels reduce accidental production changes. | High evidence; version model needed. |
| P0 | Make live test side effects and sample provenance explicit | Observed test effects and generic samples: C3. Inference: a plain Test button is insufficient for a write action. | High evidence; connectors must declare effects/capabilities. |
| P0 | Make recovery disclose start point, workflow version, input snapshot and repeated effects | Observed competing semantics: C6. Inference: no universal Retry action should hide runtime policy. | High evidence; runtime must advertise supported recovery operations. |
| P0 | Preserve Campaign logo/icons/login, existing tokens and readable state labels | Direct owner requirement and repository decisions. | Decided constraint; no competitor rebrand. |
| P1 | Begin with a step outline plus inspector; add freeform canvas only when real branching/scale requires it | Observed builder layouts: C2. Inference: simpler keyboard and narrow-screen path with less implementation. | Medium; validate against the first three real workflows. |
| P1 | Provide bounded source/type/result inspection for mapping | Observed mapping panels: C3. Inference: list/tree and textual references need equal keyboard capability. | High source evidence; schema size and expression engine undecided. |
| P1 | Show schedule timezone and backend-derived upcoming runs before publication | Observed schedule controls/timezone dependence: C4. Inference: reduce ambiguous timing. | High evidence; DST/missed-run policy required. |
| P1 | Keep run detail read-only and create a distinct draft/debug context for edits | Observed run/debug flows: C6. Inference: preserve trustworthy historical context. | High evidence; retention and redaction constraints required. |
| P2 | Add separate publish review and runtime action approval flows | Observed references: C7. Inference: useful for sensitive operations, not mandatory for every flow. | Medium relevance; owner policy decision. |
| P2 | Separate agent authorization, discovery, execution and delivery states | Observed agent references: C8. Inference: avoid rerunning work because notification delivery failed. | Strong documented distinction; intended agent scope unconfirmed. |

## Minimum shared-UI handoff

The **parent design-system session and human choose and implement shared UX/components**. **The Connect application session and human implement domain features**, integrations and runtime behavior. Research forks do not alter the library or product. No new dependency, generic workflow engine or speculative abstraction is proposed by this handoff.

For a missing UI request, the app session should supply:

1. A real user task, entry point and confirmed success state.
2. The existing component composition that fails and why.
3. Required data/permission/operation states, including unknown outcomes and cancellation.
4. Expected dataset/graph size, keyboard path, mobile/RTL behavior and evidence sample with secrets removed.
5. The application-owned callbacks and authoritative fields; the parent then defines the smallest reusable API and its acceptance check.

First compositions to review, **without creating new exports yet**:

| Composition | Reuse now | Trigger for a specialized component |
| --- | --- | --- |
| Connection detail | `ResourceCard`, `Badge`, `Field`, `SettingsSection`, `Alert`, `Button`, `ActivityFeed` | Several actual consumers need the same multi-stage verification presentation. |
| Selected-step inspector | `Card`, `Tabs`, native fields, `Alert`, `Button` | Defined schema, step lifecycle and shared narrow-screen/keyboard requirements. |
| Run inspection | Table conventions, `Badge`, `Tabs`, `Accordion`, `CopyButton`, `ActivityFeed` | Real execution/attempt schema and a repeatable inspection task. |
| Recovery review | `Dialog`, native `Select`, `Field`, `Alert`, `Button`; `ConfirmDialog` for one simple confirmed operation | Shared recovery-choice presentation proven across apps; the UI never chooses retry semantics itself. |
| Schedule summary | `SettingsSection`, native time/date inputs, `Badge`, `Alert` | Recurrence/timezone contract defined by the application; `DateRangeField` alone is insufficient. |

Current `DataTable` performs local operations on a complete bounded dataset; it is not a server-history browser. `SecretField` masks a value already present in the browser; it is not a secure vault. `Stepper` is not a graph editor. These limits are documented in [the component inventory](../../COMPONENTS.md).

## Concrete decisions for owner + parent

| Decision | Recommended starting option | What remains open |
| --- | --- | --- |
| Initial reference direction | Activepieces lifecycle + n8n inspection + Make recovery, styled with Campaign assets/tokens | Approve this feature-level reference mix. |
| First workflow shape | Three-step trigger → transform → action with an outline and inspector | Supply the first real Connect task and expected branching/scale. |
| Recovery policy | Expose only operations the backend can explain and reconcile | Which runtime supports resume, rerun, deduplication and original/current versions? |
| Scheduling | Explicit named timezone and server-derived next runs | Missed runs, overlap, DST and rate-limit policy. |
| Approvals | Decide publish review independently from runtime approval | Roles, bypass, expiry, rejection reason and multi-approver behavior. |
| Agent references | Treat OpenClaw as verified; treat Hermes as likely Nous Research Hermes Agent | Confirm Hermes identity and whether agent sessions belong in the first release. |
| Ambiguous names | Retain unresolved labels; add no inferred functionality | Intended Mindwire and Whispr URLs. |
| New shared components | Wait for concrete app requests against the current catalogue | Which composition actually repeats or cannot meet the agreed flow with current exports? |

Suggested validation is in [the flow acceptance tasks](flows.md#proposed-acceptance-tasks-for-the-first-product-prototype). No product implementation or usability test has been completed by this research pass.
