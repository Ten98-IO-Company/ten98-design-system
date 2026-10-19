# Campaign and Discover: proposed design decisions

Research snapshot: **19 October 2026**. Status: **proposals for the human and parent design-system session**. No item below is a newly accepted requirement. Application sessions own product logic and integration; this research fork has changed documentation only.

Read [evidence](evidence.md) for review/adoption qualifications and [flows](flows.md) for exact steps, states, component reuse and ownership. The canonical [coverage matrix](../../UX-PATTERNS.md#coverage-for-all-ten-tools) defines scope; its specialized extensions are conditional, not a commitment to build every editor immediately.

## Reference choices to approve

| Task | Preferred reference | Why this reference fits | Fidelity boundary |
| --- | --- | --- | --- |
| Social composition | Buffer | Publicly inspected composition/preview hierarchy and clear scheduling choices. [Guide](https://support.buffer.com/articles/scheduling-posts-4Qdld7giAZ) | Keep ten98's per-account variants and working provider-backed editing even where Buffer differs. |
| Calendar / approval | Sprout, with Planable comparison | List/week/month, ordered approval and explicit missed-deadline behavior. [Calendar](https://support.sproutsocial.com/hc/en-us/articles/360000121343-How-do-I-use-the-Publishing-Calendar), [approvals](https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows) | Preserve app scheduling/approval contracts; old example screenshots establish structure only. |
| Inbox | Agorapulse | Assignment and review states are documented separately from provider responses. [Guide](https://support.agorapulse.com/en/articles/10441656-how-to-assign-and-review-items-in-the-inbox) | Sending, permissions and consent remain in Campaign. |
| Paid campaign/change review | Native Google Ads/Ads Editor, TikTok; Smartly as secondary | Clear domain hierarchy and check → review → post distinction. [Check](https://support.google.com/google-ads/editor/answer/56370?hl=en), [post](https://support.google.com/google-ads/editor/answer/30583?hl=en) | Create paused, preserve currencies/budget types, reconcile uncertain outcomes. Do not expose unsupported provider features. |
| OOH | Broadsign | Direct existing provider fit and documented inventory → availability → commitment → readback. [API sequence](https://docs.broadsign.com/broadsign-platform/en/Documentation_Gteed_Campaigns/g-c-new-campaign-rest.html) | Keep current inventory/frequency/creative handoff limits. AdQuick is secondary; its current offering is service-assisted. |
| DAM | Bynder and Frontify | Detail/version/rendition and rights/sharing structures. [Versions](https://support.bynder.com/hc/en-us/articles/360013931859-Upload-New-Version-of-an-Asset), [sharing](https://help.frontify.com/en/articles/4895189-sharing-capabilities-assets-collections-and-folders) | Original versus delivery media, expiry and approval stay distinct. Advanced rights/version policies need a product decision. |
| Everyday analytics | Plausible; Umami for scope parity | Live filter interaction observed; concise report configuration. [Demo](https://plausible.io/plausible.io), [breakdown](https://docs.umami.is/docs/breakdown) | Preserve Discover's applied-query, collection and measurement contracts. |
| Funnels / journeys | Umami, Mixpanel, Amplitude, PostHog | Different tools make useful analytical choices explicit. [Funnel](https://docs.umami.is/docs/funnel), [paths](https://posthog.com/docs/product-analytics/paths) | Their time windows, counting units and ordering semantics are not interchangeable. |
| Heatmap / replay | Clarity and Umami | Inspected ranked-list/preview and player layouts. [Clarity](https://learn.microsoft.com/en-us/clarity/heatmaps/heatmaps-overview), [Umami replay](https://docs.umami.is/docs/replays) | Keep strict masking, explicit consent, retention and capture integrity in Discover. |
| Keyword / domain / audit research | Semrush / Ahrefs / Screaming Frog | Each has a strong task-specific evidence path. [Keyword](https://www.semrush.com/kb/617-keyword-magic-tool-manual), [target scope](https://ahrefs.com/academy/how-to-use-ahrefs/site-explorer/intro), [audit](https://www.screamingfrog.co.uk/seo-spider/tutorials/quick-start-guide/) | No new Ahrefs connector, arbitrary crawl expansion or rebranded provider scores. |
| AI visibility / citation investigation | Profound plus Scrunch/Peec/Otterly | Persistent report scope and aggregate → prompt → execution → answer/source detail. [Profound](https://docs.tryprofound.com/answer-engine-insights/interpret), [Peec](https://docs.peec.ai/understanding-sources) | Distinguish retrieved versus cited sources, observed versus estimated metrics and actual collection method. |

These choices are reasoned task-fit recommendations, not an overall “best apps” league table. Review volume and measured/adoption evidence support the shortlist, but cannot choose every interaction. The research does not establish competitor accessibility conformance.

## Proposed shared UI priorities

| Priority | Proposal | Scope status | Smallest useful deliverable | App-owned behavior / acceptance evidence |
| --- | --- | --- | --- | --- |
| P0 | Consistent evidence and quality summary | Supports existing state contract and current app behavior | Documented composition of `Badge`, `Alert`, `Accordion` and timestamps; extract an API only when actual callers agree | Source, observation time, retained coverage, measured/estimated basis, missing/zero semantics. Check current Discover results and Campaign delivery. |
| P0 | Review and operation-receipt presentation | Supports existing consequential operations | `Dialog`/`ConfirmDialog` plus before/after rows and `ActivityFeed`; preserve pending/uncertain states | App owns idempotency, revision checks, provider reads, billing and reconciliation. Test mixed destination results and uncertain charge/write. |
| P0 | Applied filters and comparison scope | Existing analytics/research presentation need | Compose labelled fields/chips, count, range and clear actions; separate draft from applied state | App owns URL/query state, sorting, paging, baseline math and paid requests. Verify Back/reload, empty filter results and incompatible comparison. |
| P0 | Installation check versus event receipt | Existing Discover setup flow | `ResourceCard` composition with two independent statuses and evidence times | App owns scanner/collector/consent. Verify check unavailable while valid receipts exist; long labels at 320px/200% zoom. |
| P1 | Evidence detail with stable navigation | Existing investigation need | Desktop detail slot / narrow full-page composition with heading, Back and source links | App router/permissions/retention. Verify list focus/filter preservation and expired payloads. Avoid stacked dialogs. |
| P1 | Social composer, media picker and calendar | Conditional specialized matrix extension | Implement only the requested presentation surface after Campaign supplies real types and states | Account variants, preflight, drafts, approval and scheduling stay in Campaign. Include keyboard media reorder and agenda fallback. |
| P1 | Funnel, cohort and rank comparison presentation | Conditional specialized matrix extension | Narrow typed editor/result composition matching existing query semantics | App owns counting/window/order; verify no-entrants, incomplete observation windows and unavailable ranks. |
| P1 | Heatmap/replay/report composition | Conditional specialized matrix extension | Slots/controls around existing app renderers; source/widget picker and resilient per-widget frame | App owns capture/player isolation, reports, revisions and sharing. Verify unavailable alignment, expired recording, partial widget errors and revoked shares. |

The initial deliverable can often be a catalogue recipe using existing exports. No new query engine, scheduler, provider adapter, charting dependency, workflow engine or design abstraction follows automatically from this research. Shared components use existing semantic tokens, named TypeScript imports and controlled callbacks. Campaign's logo/icons/login patterns remain the identity; no competitor brand assets enter the package.

## Feature suggestions requiring separate human acceptance

These are **new suggestions**, even where a competitor supports them. They are not dependencies for cleaning up existing screens:

- Visual Instagram grid planning; bulk approval requests; external reviewer portals; multi-stage policy authoring; teammate collision indicators.
- Advanced asset rights workflows, immutable asset-version pinning policy and automated rendition generation.
- Cross-channel budget optimization, broad bulk advertising changes, new DSP/retail-media integrations, OOH dayparting or proof-of-play ingestion.
- Saved research views or reusable cohorts where absent; source-gap scoring; automatic correlations; content-brief generation or outreach handoff.
- Scheduled report delivery to email/Slack; surveys/interviews; experiments or feature flags.

Recommended default proposal: missing approval blocks publication, and changing display timezone changes only presentation. Exact approval invalidation, bypass rights, scheduled asset binding and timezone authority must be decided against existing app behavior. Competitor permissiveness is not a migration requirement.

## Decisions and next work

1. **Human + parent:** accept or amend the feature-specific reference choices above. Choose the first concrete screen needing shared UI. No generic feature-parity expansion is implied.
2. **Application session:** provide the existing types, state transitions, error/receipt examples, role constraints and acceptance cases for that screen. Identify which behavior must remain compatible.
3. **Parent design-system session:** make a token-based composition, complete states and TSX/props examples. Promote only repeated presentation into shared exports; retain current brand assets and accessible native controls.
4. **Human + parent:** decide unresolved policy/flow choices on a concrete preview. New product features remain unaccepted until explicitly chosen.
5. **Application session:** integrate the released package and own controller/backend work and real acceptance. A successful catalogue example is not proof of provider delivery, analytics correctness or feature parity.

Evidence gaps to retain: no authenticated competitor acceptance, no verified global share for AI visibility/cross-channel/DAM software, some old illustrative screenshots, limited independent review samples for specialist tools, and no direct user study with ten98 operators. These limit ranking confidence without blocking careful reuse of the documented flows. Further research should target a concrete unresolved decision rather than accumulating more competitor names.
