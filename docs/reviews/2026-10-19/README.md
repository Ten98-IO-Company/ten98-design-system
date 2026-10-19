# Component, flow and template design review

Reviewed on 19 October 2026. The baseline is version 0.3.4; the remediation is version 0.3.5. Campaign's existing logo, icons, purple accent and login composition remain the brand reference. English LTR is the required layout.

The system's strongest quality is its truthful state handling. It distinguishes a measured zero from missing data, a draft from applied scope, accepted work from delivery, and an uncertain outcome from a failed request. The largest design weaknesses were inconsistent theme surfaces, cramped results, and catalogue previews that did not faithfully show the shipped components. Those are more consequential than adding visual decoration.

## Exhaustive critique

| Coverage | Review |
| --- | --- |
| 45 controls, patterns and compatibility components | [Foundations](foundations.md) |
| 23 product components, including all 168 documented product states | [Product components](product-components.md) |
| Five fixed templates and all 28 reference flows | [Flows and templates](flows-templates.md) |

This covers all 73 public catalogue components: 45 foundations + 23 product components + five templates. The templates also appear in the 33-item flow/template review. Each item has a finding or a keep decision, a concrete recommendation, an implementation target and a reference. It is not a claim that every state/theme/device combination was visually inspected.

## Direct visual comparisons

The visual comparison reports pair matching ten98 functions with actual product UI, captured from public applications or official product screenshots. Each report identifies which kind of evidence was available. Documentation guidance alone does not count as a captured application screen, and an unavailable screen is recorded as a gap.

- [Campaign task comparisons](visual-campaign.md)
- [Discover task comparisons](visual-discover.md)
- [Template and workspace comparisons](visual-templates.md)
- [Actual Campaign and Discover consumer screens](consumer-screens.md)

Competitor screenshots are reference evidence for this critique. Their assets, colors and branding are not part of the library. Differences in authorization, pricing, capture coverage, receipt handling and product capabilities remain app-owned decisions.

Screenshot files stay in the [source repository](https://github.com/Ten98-IO-Company/ten98-design-system/tree/main/docs/reviews/2026-10-19); the installed package contains Markdown documentation and runtime files, keeping visual research out of the application dependency.

## Remediation decisions

The P1/P2 changes below are implemented and pass the shared 0.3.5 gate. Consumer adoption is tracked separately in the completion ledger. The P3 row records proposals, not shipped refinements.

| Priority | Finding | Decision in 0.3.5 |
| --- | --- | --- |
| P1 | Global pale table-header fills and compatibility status fills made dark states difficult to read. | Existing semantic foreground, surface and border roles replace fixed fills. Check PermissionMatrix, ReviewSummary, RetentionTable, RankComparison and all 19 compatibility statuses. |
| P2 | Narrow list/detail opening could leave keyboard focus on the document body after hiding the originating control. | Recover hidden or removed workspace focus to the visible pane heading. Preserve initial focus, visible app-selected focus, guards, originating-control restoration and mounted drafts. |
| P2 | Four fixed audience columns squeezed values inside a desktop side panel. | Counts adapt to their actual panel width. All four counts and unavailable states remain explicit. |
| P2 | Explorer, funnel and attribution put the full analytical result into a narrow editor preview. | Existing overview/editor templates now place primary results at full width below configuration. Keep contained table scrolling on narrow screens. |
| P2 | Catalogue prose shrank metric values; grid previews stretched intrinsic buttons/badges. | Scope documentation typography to prose and align intrinsic specimens. Keep fields and result containers full width. Media status chips retain intrinsic width. |
| P2 | Template section links collided with the catalogue router. | Existing scoped preview-link handling scrolls and focuses the section while retaining the catalogue route. |
| P2 | Five large template-choice cards displaced the working preview. | Use one labelled native selector with the selected task, use cases and slot order beside it. Preserve all five examples and their full APIs. |
| P2 | Compatibility empty-state and control chrome bypassed theme roles. | Reuse accent, text, control-border and disabled roles for existing geometry. No new palette or component API. |
| P2 | Actual send-review headers split short words, and OOH confirmation showed opaque inventory IDs. | Keep short review headers on one line inside contained table scrolling; pair inventory names with the same stable IDs in quote and confirmation. |
| P2 | Numeric heatmap evidence was headed as ranked elements despite lacking element identity. | Add an optional evidence-list label, with exact existing defaults. Coordinate groups remain distinct from DOM elements, and unknown alignment still prevents an overlay. |
| P2 | The actual Campaign dark workspace switcher retained a pale fixed fill. | Reuse subtle-surface/control-border and accent-soft/accent roles in the shared switcher and avatar. Explicit/system theme contrast, native selection and an old-fill negative control pass. Consumer re-capture follows adoption. |
| P3 | Repeated nested borders, very small metadata and simulation controls competing with task actions. | Per-item recommendations remain proposals. Use quieter separators, readable supporting text and clearly grouped fixture controls where the actual task benefits; preserve consequential warnings. |

P1 means a material readability/accessibility defect; P2 means a meaningful behavior or consistency issue; P3 is optional refinement. These labels are review judgments, not a numerical quality score.

### Captured remediation

| Baseline 0.3.4 | Current 0.3.5 |
| --- | --- |
| ![Template choices displace the preview](images/remediation/templates-before.png) | ![Compact task selector leaves room for the working preview](images/remediation/templates-after.png) |
| ![Pale permission cells in dark mode](images/remediation/permissions-before.png) | ![Permission cells use the dark surface role](images/remediation/permissions-after.png) |
| ![Pale compatibility status fills in dark mode](images/remediation/statuses-before.png) | ![Existing status meanings use themed foreground and surface roles](images/remediation/statuses-after.png) |

Further current captures show [readable send-review headers](images/remediation/send-review-after.png), [OOH names alongside stable inventory IDs](images/remediation/ooh-review-after.png), [compact attribution configuration with full-width results](images/remediation/attribution-after.png), and the [shared dark switcher](images/remediation/workspace-switch-after.png). The switcher image is the shared fixture; the separate consumer report retains the actual app baseline until adoption is verified.

### Consumer-discovered follow-up: 0.3.6

Campaign's actual article editor exposed the documented multiline adapter limitation as a consequential mismatch: typing changed the native textarea but did not reach controller review, and asynchronous content did not prefill. The 0.3.6 correction forwards native textarea props with a compatible typed overload, preserves uncontrolled defaults and omits input-only attributes. New controlled/read-only states and an async-prefill/type/review browser fixture cover the shared contract. Actual article-saving acceptance remains with Campaign; 0.3.5 is immutable.

### Action and navigation follow-up: 0.3.7

The actual 0.3.6 Campaign re-capture confirmed calendar and workspace-switcher improvements, then exposed enabled secondary buttons with fixed app-local dark text and selected navigation with a fixed shared pale background. These are distinct ownership problems. The shared 0.3.7 patch uses existing roles for action and navigation states; Campaign separately reconciles its later fixed-color overrides. The theme matrix now checks actual normal/hover/selected/danger/primary/count contrast, waits for finite transitions and reproduces the old-fill failures. No geometry, API or JavaScript changes are involved. Final consumer captures and acceptance remain separate from the shared gate.

## Evidence and verification

The detailed reports retain baseline observations, including subsequently corrected findings. A delayed focus probe established that Back already restored focus correctly; opening the hidden detail was the actual gap. The final tests target that behavior. Tests distinguish visible focused sections from their child headings, and they use the real 19-status inventory rather than an invented count.

Current automated gate and immutable package details are recorded in [release validation](../../VALIDATION.md). The new browser checks cover opaque text contrast, theme selection, panel sizing, catalogue typography, template navigation, keyboard focus, drafts and full-width analytical results. Negative controls restore the earlier pale fill and four-column audience layout. Independent source review checked the focus guards, semantic status mappings and test oracles before the complete suite.

The audit is local UI evidence. It does not certify every accessibility criterion, arbitrary future theme overrides, live providers, payments, delivery, databases or deployment. Actual Campaign/Discover consumer acceptance is tracked separately in the [completion ledger](../../CAMPAIGN-DISCOVER-COMPLETION.md).

## Reference direction

[Linear's 2026 design refresh](https://linear.app/now/behind-the-latest-design-refresh) provides a useful precedent for predictable headers and quieter supporting structure. [Geist's table guidance](https://vercel.com/geist/table) informs comparable values and semantic tables. [Stripe's component and view model](https://docs.stripe.com/stripe-apps/components) informs the distinction between focused tasks, related context and full-page results. These are design references, not proof that copying their appearance improves ten98 usability.

The product map now combines Connect and Wiki into one planned app and adds ten98-researcher. The existing ten98-connect identifier is provisional for the combined app; Researcher's feature scope is still proposed. See [the current coverage table](../../UX-PATTERNS.md#coverage-for-all-ten-tools). No researcher engine or new product feature is implied by this review.
