# Campaign and Discover UI completion ledger

Understood as: complete the missing shared UI and reference flows for Campaign C1–C8 and Discover D1–D17 from the reviewed research, then coordinate each consuming app's integration without replacing its controllers, persistence, permissions or existing behavior. The owner's latest request authorizes this UI implementation wave; paid/provider operations remain excluded from validation.

The coordinator owns this ledger, shared CSS/barrels, package versions, browser acceptance and publishing. Each bounded worker owns named files and must stop at its assigned gate. App sessions own their integration and real regression checks. Research-only new backend/features are not silently enabled by a catalogue preview.

## Completion gates

For each row: inspect real consumer contract → build or reuse typed presentation → complete interactive catalogue flow and applicable states → compile/test/browser acceptance → app integration plus preserved behavior evidence. A row is complete only when its required gates pass. A blocked API is recorded specifically; no fallback result may be labelled implemented.

| Flow | Task | Shared presentation / current work | Catalogue + checks | Consumer integration |
| --- | --- | --- | --- | --- |
| C1 | Compose and validate a social post | DestinationPicker, MediaStrip, ContentPreview, EditorTemplate | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| C2 | Plan a calendar and approve content | PublishingAgenda, DetailWorkspace, ReviewSummary | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| C3 | Create and activate a paid campaign | ReviewSummary, OperationResults, RunCostSummary | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| C4 | Inspect performance and review paid changes | EvidenceSummary, ReviewSummary, OperationResults, ReportPanel | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| C5 | Plan, book and reconcile OOH placements | ResourceCard, ReviewSummary, OperationResults | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| C6 | Publishing recovery and unified inbox | DetailWorkspace, ConversationThread, OperationResults | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| C7 | Find, approve and attach media | AssetDetails, MediaStrip, ReviewSummary | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| C8 | Direct campaign audience, preview and send | AudienceSummary, ReviewSummary, OperationResults | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D1 | Website installation to first useful report | ResourceCard; TrackerStatus reference only where scanner evidence exists | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D2 | Overview, filter and comparison | AppliedFilters, EvidenceSummary, ComparisonMetric, OverviewTemplate | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D3 | Query explorer and breakdown | AppliedFilters, DataTable, EvidenceSummary, CollectionTemplate | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D4 | Goals and funnels | FunnelBreakdown, EvidenceSummary; native definition and rates retained | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D5 | Retention and journeys | RetentionTable, JourneyPath; native branching graph retained | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D6 | Attribution and campaign measurement | AppliedFilters, ComparisonMetric, EvidenceSummary | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D7 | Heatmap investigation | VisualEvidenceFrame, EvidenceSummary | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D8 | Replay investigation | ReplayControls, EvidenceDetail; native player retained | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D9 | Build and share reports | ReportPanel, ReviewSummary, EditorTemplate | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D10 | Measurement confidence across reports | EvidenceSummary compact/full, ComparisonMetric | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D11 | Keyword exploration and saved research | DataTable, RunCostSummary, CollectionTemplate | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D12 | Domain/backlink research and charged-run review | RunCostSummary, EvidenceSummary, ReviewSummary | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D13 | Project setup and rank history | RankComparison, DetailWorkspace; native rank semantics retained | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D14 | Technical site audit | DetailWorkspace, EvidenceSummary, OperationResults | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D15 | Owned-property search performance | DataTable, EvidenceSummary, DetailTemplate | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D16 | AI prompt setup, execution and comparisons | RunCostSummary, OperationResults, ComparisonMetric | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |
| D17 | Citation and answer investigation | EvidenceDetail, DetailWorkspace, AppliedFilters | Complete: TSX/SSR and Playwright desktop + narrow English | 0.3.0 handed to active app owner; per-flow adoption evidence pending |

## Confirmed invariants

The shared UI/reference gate passed for 0.3.1 on 19 October 2026: 73 documented exports, 400 component state specimens, 28 complete flows (25 research IDs plus three cross-product recipes), 505 strict public TSX examples, 55 native checks and 92 Playwright cases. Required layouts are English left-to-right at desktop and narrow sizes; RTL is not required by the owner.

Immutable consumer batch: `ten98-ui-0.3.0.tgz`, SHA256 `F73229FC6B2C7E14348A1DC77709D60E7110756D8EA5B4DA30BE5047BA05033F`. Both active app owners verified and adopted the archive dependency. Their presentation adapters and application regression evidence remain separately tracked below; generic components are not forced over richer native behavior.

Independent review found and fixed the D16 edit/save bypass of collecting or uncertain execution locks. A Playwright case verifies both locks and original receipt retention; removing the guard fails the same check. Playwright also caught long agenda badge overflow, fixed once in the shared Badge rule.

Current consumer evidence: Campaign integrated compact evidence into its provider insights with 12 report checks and typecheck passing; per-channel receipt adoption is next. Discover verified the archive/declarations/license/CSS and passed package review, baseline checks, build/plan and shared-CSS browser checks; applied Journey scope and confirmed AI-query evidence adapters are in its bounded worker. These partial milestones do not mark all consumer rows complete.

- Existing Campaign/Discover logo, icons, split login composition, native forms and controllers remain authoritative.
- New surfaces use scoped `t98-` rules; no global reset, app theme change or uncontrolled-select substitution.
- Campaign retains per-account variants, immutable account currency/budget types, create-paused/readback/explicit activation, OOH provider limits, upload recovery, send receipts and safe unsaved-draft guards.
- Discover retains applied-query/counting units, null-versus-zero, consent/capture isolation, measurement evidence, usage accounting and paused paid operations.
- Draft, submitted, accepted, delivered and observed outcomes remain distinct. Unknown mutation outcomes require app-owned reconciliation before repeat.
- Every released archive stays immutable; app integrations pin the same new archive and keep manifest/lockfile/vendor inputs together.

The 0.3.1 patch verifies actual text doubling across all component state pages and every reference flow, including isolated previews and open dialogs. It fixes shared Button wrapping and catalogue long-text presentation, with no API change. Consumer owners are continuing bounded per-flow adoption; Discover accepted D5 AppliedFilters and D10 compact evidence with 901 native passes and its targeted browser groups, then started D2 and D15 adapters. Remaining candidate rows are not yet marked complete.

Current handed-off patch: `ten98-ui-0.3.1.tgz`, SHA256 `9F41F5E616E525D70767EDCF138BF6131BC9BC14D86AEA45B8C3A0C3D9C73EB8`. All 30 JavaScript/declaration files match the earlier archive byte-for-byte. The previous archive remains available and unchanged; app owners schedule the CSS patch with their next accepted component batch.
