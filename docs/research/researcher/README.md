# Connect research workspace: historical Researcher proposal

Prepared and sources accessed **19 October 2026** for the then-proposed standalone `ten98-researcher`: research source collection, citation review, research runs, findings and exports, using three relevant real products and verified existing library exports. The owner has since placed this research direction within `ten98-connect`, alongside automation, integrations and wiki/docs. This historical proposal and its path remain as reference evidence for Connect's research workspace. **These are proposals, not approved Connect features.** The [canonical suite coverage](../../UX-PATTERNS.md#suite-coverage) records current product ownership; research categories, data contracts and any paid-provider policy await a concrete task and owner decision. Discover retains its existing SEO and analytics research scope.

Use **Google's notebook workflow for selecting and inspecting sources, Elicit for structured literature work, and Perplexity for open-web research reports**. This is a fit judgment, not a popularity ranking. Keep Campaign's existing identity, tokens and icons; do not copy product branding.

## Reference fit and documented flows

Evidence below is primary product documentation, not an operated account or screenshot comparison. Fixed publication dates were not shown on the cited help pages unless stated. Relative “updated” labels are not recorded as publication dates.

| Reference | Documented flow relevant to the proposal | Concrete tradeoff for Connect's research workspace |
| --- | --- | --- |
| **Elicit** | The current starting choices are Research Agent, Research Report and Systematic Review. Agent sessions can move from discovery through extraction and synthesis; Systematic Review adds explicit screening and extraction stages. The former standalone Find Papers, Extract Data and Chat with Papers tools moved into Research Agent on **30 September 2026**. [Workflow guide](https://support.elicit.com/en/articles/14757543-getting-started-with-elicit-which-workflow-should-i-use), [migration guide](https://support.elicit.com/en/articles/17220397-where-did-find-papers-extract-data-and-chat-with-papers-go). | A staged review exposes inclusion decisions; it also adds work for a simple source collection. Propose screening stages only for an approved literature-review task. Do not model the retired standalone tools as the current product or turn every research job into a systematic review. |
| **Google NotebookLM reference; current help titles say Gemini Notebook** | Create a notebook, add or discover sources, select a subset, ask questions, then select a citation to inspect its quote in context. Fast Research exposes candidate titles, relevance descriptions and links before import; Deep Research can return a report plus cited and uncited sources for selection. [Source workflow](https://support.google.com/gemininotebook/answer/16215270), [citation inspection](https://support.google.com/gemininotebook/answer/16179559?hl=en&ref_topic=16164070). | Collection membership, selected context and cited support are different sets. Keep each visible. The chat guide also describes experimental agentic web research, so do not label every output “selected sources only” regardless of method. This records the help-site naming encountered, not a claim about a completed global rebrand. |
| **Perplexity Research** | Choose Research in the search-box mode selector; the service searches and reads sources, iterates its investigation, then produces a report. The guide offers PDF/document export and sharing as a Page; Research chooses its own model combination. The page is marked **last modified 28 August 2026**. [Research guide](https://www.perplexity.ai/help-center/en/articles/10738684-what-is-research-mode). | A question-to-report flow is a useful open-web reference, but the guide does not establish reproducible source snapshots, exact cancellation effects or citation correctness. Do not offer a model picker for an application mode whose provider controls the models. Vendor speed and quality claims are not validation evidence. |

### Findings and export boundaries

Google documents saving a response to a note and selecting notes as source context; citation chips can lead to passages in those notes. Exporting a note creates a new Google Doc, and later edits and sharing permissions do not synchronize back. **Proposal:** distinguish an original source, generated answer and human finding, and record when a finding is reused as input; it must not silently become independent corroboration. [Notes guide](https://support.google.com/gemininotebook/answer/16262519?hl=en).

Elicit documents PDF/Word report exports, CSV/Excel tables, and RIS/BIB reference exports, with access varying by workflow and plan. Google documents report export to Docs and data-table export to Sheets, including a separate citations tab; exported files have separate permissions and edits. **Proposal:** choose one approved output format and state its source-set/run identity and access scope. A generic Export button should not imply live synchronization, every reference format or inherited sharing. [Elicit exports](https://support.elicit.com/en/articles/14758189-export-your-data-from-elicit), [Google notebook and export guide](https://support.google.com/gemininotebook/answer/16206563?hl=en).

## User-review signals and popularity limits

Review platforms are primary sources for the reviews they host, not independent tests of the products. These are dated observations of review presence and reported friction, not market-share evidence or comparable samples.

| Product | Accessible review signal | How to use it |
| --- | --- | --- |
| Perplexity | G2 displayed **358 reviews** in its user-insights summary. A 30 September 2026 reviewer valued sources beside findings but still checked inconsistent industry definitions; another August review reported citation destinations that did not support the claimed detail. Some entries were marked incentivized. [G2 Perplexity reviews](https://www.g2.com/products/perplexity/reviews). | A visible review footprint supports including it in the reference set. Reported citation friction supports a proposed inspect-source path; it does not measure citation failure rate, time saved or accuracy. |
| Google NotebookLM | G2 exposed dated reviews, including a 23 May 2026 reviewer valuing flexible uploads and a 15 February 2026 reviewer describing source-limit and complex-document friction. [G2 Google NotebookLM reviews](https://www.g2.com/products/google-notebooklm/reviews). | Treat these as workflow anecdotes. Do not repeat reviewers' claims that grounding eliminates hallucination as fact, or use older complaints to override current supported-source documentation. No comparable review-count snapshot was extracted here. |
| Elicit | The accessible G2 `/products/elicit` page describes a website-search/CRO product alongside a literature-review review. Product identity is ambiguous. [Inspected listing](https://www.g2.com/products/elicit/reviews). | Exclude its score and count. The academic-research Elicit reference is supported by its own current docs; an independently matched user-review signal remains a gap. |

There is no shared population, category, sampling period or review denominator across these observations. No “top three,” market-share ordering or overall winner is established. Consensus was not assessed in this bounded pass; omission is not a negative product finding.

## Proposed first flow and decisions

The smallest starting proposal is **collect a bounded source set → inspect one source or citation → save a finding → export a named snapshot**. If the approved task only needs manual collection and notes, stop there. An automated research run is a separate product decision.

| Proposed task | Suggested interaction and state boundary | Decision still required |
| --- | --- | --- |
| Collect sources | Show candidates with title, original URL, capture/import method, access state and observation time; select before adding to the retained collection. Keep import failures beside the affected item. | Supported formats, duplicate identity, capture versus live synchronization, storage and access rules. Do not promise every format used by a reference app. |
| Review a citation | Open the finding/answer beside its cited source and supplied passage locator, with a path back to the same selection. Keep retrieved-but-uncited material distinct. Show unavailable, expired or forbidden evidence explicitly. | What constitutes a resolvable citation; available full text; source versions and retention. A numbered link alone is not verified support. |
| Run research, if approved | Review the question, method and selected source-set version before starting. Retain the previous result with its original scope during pending or failed work; show partial coverage and individual failures. | Provider, allowed methods, cost/usage approval, durable run identity, cancellation, reconciliation and repeat-run policy. No automatic recurring runs are proposed. |
| Save findings | Keep source quotations, generated text and the researcher's interpretation distinguishable, with their provenance. Mark whether a saved finding is later selected as input. | Editing/version rules, citation invalidation, collaborators and review responsibility. |
| Export | Name the included findings, source-set/run snapshot, format and destination; retain the snapshot and explain failures without claiming completion. | First format, citation inclusion, generated-file retention and destination permissions. Export is not publication or a synchronized copy. |

## Existing library patterns to reuse

Verified against [the public export barrel](../../../src/lib/index.ts) and the implementations below. These are presentation components; none supplies a research engine, parser, source resolver, provider connector or export service.

| Existing export | Proposed use and actual limit |
| --- | --- |
| `CollectionTemplate`, `DetailTemplate`, `EditorTemplate` in [templates.tsx](../../../src/lib/templates.tsx) | Collection toolbar/selection slots, resource detail/aside, and draft/feedback/footer composition. The app supplies routing, persistence and real stages. |
| `DataTable` in [patterns.tsx](../../../src/lib/patterns.tsx) | Bounded source/finding rows with stable keys, search, sort and selection. Its operations and pagination are local; large/server collections need an app-owned data path rather than loading everything into this specimen. |
| `AppliedFilters` in [measurement.tsx](../../../src/lib/measurement.tsx) | Display the applied corpus/method and a separate `pendingDraft` explanation. It does not apply a query, serialize scope or update results. |
| `DetailWorkspace` in [coordination.tsx](../../../src/lib/coordination.tsx) | Compose a source/result list with one selected detail and a narrow-screen Back action. App routing and retained selection remain separate concerns. |
| `EvidenceSummary` in [evidence.tsx](../../../src/lib/evidence.tsx) | Present app-supplied source, observation time, basis, freshness and coverage. Use a full summary where compact measurement wording does not fit; it does not calculate confidence or certify support. |
| `EvidenceDetail` in [reporting.tsx](../../../src/lib/reporting.tsx) | Inspect an original generated answer, evidence and source slots, with loading/unavailable/expired/forbidden gates. The answer section is labelled “Original answer”; use ordinary detail content for a human-authored finding. No fetching, parsing or source classification is included. |
| `ReportPanel` in [reporting.tsx](../../../src/lib/reporting.tsx) | Show an app-supplied run result with partial/stale/error status, source/as-of context and explicitly retained prior content. Retry policy and successful settlement are app owned. |
| `RunCostSummary` in [reporting.tsx](../../../src/lib/reporting.tsx), only if paid execution is approved | Show supplied estimates, receipts and uncertain settlement. Its existence does not approve a provider, billing policy or automatic retry. |

Prefer these compositions before requesting a specialized citation viewer, research canvas or editor. No new shared API is justified by the research alone.

## Evidence limits and disposition

This pass checked primary docs and two usable review-platform listings. No account was created, research run or paid-provider operation was executed, or backend was implemented. Documentation guidance is not screenshot proof or evidence of keyboard behavior, responsive layout, live failure recovery or output accuracy. No screenshots were attempted after the earlier external-browser DNS failure.

Current help content and plan gates can change. Elicit's September migration and Google's help titles were checked at the preparation date rather than inferred from older articles. Google's source guide distinguishes imported content and auto-updated Drive sources; Connect must choose its research workspace's version/access model instead of assuming all references are frozen or all stay live. The prior [Campaign/Discover flows](../campaign-discover/flows.md) are not an acceptance record for Connect's research workspace; their evidence and recommendations remain linked from [the research index](../README.md).

Next decision: approve one concrete Connect research task, its source types and its evidence/output contract. This report proposes reference directions only; moving the research workspace into Connect does not approve its features or establish implementation acceptance. The dated source observations and user-review limits above remain unchanged.
