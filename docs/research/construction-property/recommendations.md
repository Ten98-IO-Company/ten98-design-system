# Construction and Property: decisions for the owner and design-system session

**Status: proposals for review, 19 October 2026.** Research scope is complete for the two rows in the current ten-tool coverage table. This report does not approve product features or authorize application changes. Evidence and limitations are in [evidence.md](evidence.md); all flow IDs below refer to [flows.md](flows.md).

## Recommended reference choices

Use **Procore** as the broad construction task/commercial reference, **Autodesk Build** for budget/change review and **Fieldwire** for plan-linked field work. Use **Buildertrend** to compare scheduling for residential projects. This is a feature-level choice based on documented flows and review evidence, not an instruction to reproduce one competitor's entire app.

Use **Buildium** for property/unit/tenancy and work-order relationships, **AppFolio** for resident/vendor communication of job status, and **DoorLoop** for understandable property setup choices. Keep **Yardi Voyager/Entrata** available for later commercial or large multifamily requirements; their complete enterprise menus would be premature templates for the current scope.

For connected buildings, use **Home Assistant** for operations, capability-dependent controls and run inspection; **Apple Home** for simple scenes/occupant interaction; **ETS** for installer commissioning. [The evidence register](evidence.md#connected-building-candidates-and-owner-named-references) explains why protocols and apps are not ranked together.

Keep the actual Campaign logo, icons and login conventions. Adapt hierarchy, reading order, state visibility and interaction. Do not import a competitor's brand, proprietary assets, implementation or layout quirks merely for visual similarity.

## Already scoped work: recommended flow decisions

These elaborate existing matrix areas. They are proposed interaction decisions, not new feature commitments. P0 means foundational before dependent design; P1 means next when a consuming application confirms the contract; P2 means later specialized work.

| Priority | Decision to accept or revise | Why / confidence | Existing reuse and product boundary |
| --- | --- | --- | --- |
| P0 | Every task retains project/property and resource context, plus data freshness | Strong documentation basis; practical usability inference (C1, P1) | `AppShell`, `PageHeader`, `Breadcrumb`, `ResourceCard`; routes, selection and queries are app-owned |
| P0 | Keep local save, server submission, approval and completed outcome distinct | Strong reference basis; avoids false completion in C4–C7, P3, P6 | `Badge`, `Alert`, `ActivityFeed`; persistence, idempotency and reconciliation are app-owned |
| P0 | Start property navigation with records and a searchable location/device list; add a map as an alternate view | High confidence in a usable fallback; precise hierarchy remains unresolved (P1, P5) | Existing cards/tables/forms; floor-plan rendering and spatial model remain specialized |
| P0 | Device controls display requested target separately from reported/assumed/unknown state | Strong protocol evidence; actual acknowledgement semantics vary (P6) | Existing fields/status first; integration layer supplies capabilities, permissions and observed timestamps |
| P1 | Inspections are versioned instances with per-item evidence and a final completeness review | Strong Procore flow reference; ten98 response rules need definition (C4) | `Accordion`, native controls, `Field`, `Alert`, `ActivityFeed`; no checklist engine in UI package |
| P1 | Purchase orders and changes include explicit review of quantities, units, currency and consequence before submission | Strong commercial-flow evidence; calculations/policy unresolved (C5, C6) | Native line-item form initially; application validates money, precision and transitions |
| P1 | Maintenance request, work order, visit appointment and financial completion remain separate linked records/states | Strong Buildium/AppFolio basis; closure policy needs owner decision (P3) | Cards, status, timeline, forms and agenda; app owns dispatch and communications |
| P1 | Schedule offers list/detail access before a specialized Gantt; master schedule and field lookahead remain distinguishable | Strong reference basis; required editing depth uncertain (C2) | `Tabs`, native dates, fields/status; schedule engine and import source app-owned |
| P1 | Automation starts with readable trigger/condition/action steps and separate Save, Enable and Run actions behavior | Strong Home Assistant/Apple reference; branching need uncertain (P7) | Existing fields/disclosures/status; execution, secrets and device effects app-owned |
| P2 | Expose plan revision and calibration evidence before supporting measurements used as quantities | Strong Fieldwire basis; concrete formats/precision need definition (C3) | Native metadata forms first; viewer, annotation and measurement engine are specialized |

## Component gaps to evaluate, in order

These are **candidate shared UI work**, not export names or implemented APIs. First use the existing exports in a real app composition. Promote a reusable component only after that reveals repetition and a stable contract.

1. **Outcome and reconciliation block.** Requested action, last confirmed state, pending/uncertain outcome, safe next action and optional item-level results. Applicable to offline saves, approvals and devices. Do not assume retry is safe. Existing `Alert`, `Badge`, `Button` and `ActivityFeed` may fully cover the first version.
2. **Review summary.** Scope, before/after values with units, reviewer/owner, consequence, documents and recorded decisions. `Card`, `Field`, `ActivityFeed` and `Dialog` can cover it initially. Avoid a linear `Stepper` for branched/rejected reviews.
3. **Evidence attachment state.** Native file input plus filename, upload state, failure and retained draft. Only add shared presentation if Construction and Property both need it. Storage, resumable uploads, virus scanning and retention are application concerns.
4. **Capability-based device control.** Needs a concrete consumer contract for reported versus assumed state, pending command, allowed range/unit, partial group outcome and permission. Do not make every resource a binary switch.
5. **Editable line items, hierarchical location navigation, schedule/calendar and plan viewer.** These are larger extensions already anticipated by the matrix. Define keyboard behavior, data scale and domain boundaries before selecting dependencies or publishing APIs. Existing `DataTable` has no server pagination contract or editable-cell support.

The parent session is already composing generic catalogue flows for connection verification, investigation states and consequential-change reconciliation. Review those first; do not create parallel versions solely for these two tools.

## New feature suggestions — not part of the accepted matrix

| Suggestion | Potential benefit | Priority / evidence limit | Decision gate |
| --- | --- | --- | --- |
| Resident-facing maintenance request timeline and vendor self-service portal | Fewer status-chasing messages | P1 candidate; documented AppFolio pattern, no ten98 demand evidence yet | Are external resident/vendor accounts in the first Property release? |
| Multi-vendor estimates and explicit quote comparison | Clearer procurement/repair decisions | P2; observed vendor-estimate flow, comparison design not verified | Define purchasing policy and who can see competing quotes |
| Shared construction-to-property handover package | Preserve accepted plans, assets and defects into operation | P2 inference; plausible cross-app benefit, not requested in current table | Human confirms scope, ownership and source-of-truth rules |
| Device fault → proposed maintenance request | Connect building operations to repairs | P2 inference; no acceptable false-positive threshold established | Human defines which faults, who reviews and what can run automatically |
| Configurable commissioning checklist | Makes installer verification visible | P2; ETS separates planned, downloaded and diagnosed work | Direct KNX commissioning versus managing an existing controller must be decided |
| Advanced cost forecasting, AI workflow agents, tenant screening, rent collection, automated pricing | Competitor capabilities, not automatic ten98 requirements | Defer; separate policy, regional and operational questions | A concrete human-approved feature request and owning app are required |

Do not add these merely because a highly ranked product has them. No automated eligibility, lease decision, access grant, purchase or physical control was performed or implemented by this research.

## Unresolved decisions that change the correct UX

| Decision | Why it matters | Smallest next input |
| --- | --- | --- |
| Construction segment and roles | A commercial GC, owner and small residential builder need different schedule/procurement depth | One representative project and the three most frequent tasks |
| Master schedule editing versus import/read-only plus lookahead | Determines dependency editing, conflicts and source revision handling | Confirm the initial schedule source and who may change it |
| Offline browser/PWA/native target and conflict policy | A field interface cannot promise durable offline work without an implemented storage/reconciliation contract | App team supplies supported devices and exact local/acknowledged/conflict states |
| Property/building/floor/unit/room hierarchy, including mixed use | Tenancy and device areas must not accidentally share identities or authorization | One real hierarchy with an exception case |
| Operating jurisdictions, property types and tenancy lifecycle | Competitor rent/deposit/renewal behavior is not universally applicable | Human supplies applicable rules and the first lease lifecycle; no rules inferred from region |
| Resident/operator/vendor/installer visibility | Determines which resources, notes, controls and timelines can be shown | App policy matrix with scope and effective dates |
| Existing-controller integration versus direct protocol operation | Home Assistant federation differs from rebuilding commissioning/runtime features | Choose the first integration path and supported device capabilities |
| Command acknowledgement and remote-control policy | Sent, accepted, reported and physically verified may be different outcomes | App team supplies result taxonomy and allowed action classes |

These are review items for the parent/human, not reasons to halt the completed research or automatically create more research sessions.

## Bounded handoff and completion

Completed: leading-candidate inventories, dated review/ranking/adoption evidence with incompatible share definitions disclosed, public visual references, seven Construction flows, seven Property flows, state/access/keyboard/responsive constraints, reuse map and separate new-feature suggestions.

Limitations: no live accounts/hardware testing; Buildium's demo is contact-gated and was not accessed; review/index counts vary; Apple hub requirements and AppFolio completed-work-order visibility contain documented conflicts; no comparable independently verified global market-share measure was established. Commercial jurisdiction rules, calculation correctness and device interoperability require application-specific evidence.

Verification completed: one native Node assertion pass confirmed all three reports, all 14 unique flow IDs, local-link existence, balanced flow-document code fences and valid HTTPS syntax across 86 links. External link syntax is not a live-availability guarantee. Sources were inspected during research; inaccessible/conflicting sources are disclosed above. Component names/limits were checked against `docs/COMPONENTS.md`. An independent read-only protocol/coverage review caught and corrected setpoint-versus-room-temperature ambiguity, missing removal scope, an overbroad unsigned-tenancy rule and the need to state the table's local-dataset limitation globally.

No dependencies, library/app edits, commits or releases belong to this research deliverable. Passing work stops here under [the bounded research gates](../../SWARM.md).
