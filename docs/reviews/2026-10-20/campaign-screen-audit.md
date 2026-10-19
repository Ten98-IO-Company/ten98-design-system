# Campaign screen audit

Reviewed **20 October 2026, Asia/Dubai**. All **29 native route/section baselines were captured in both light and dark mode: 58 screenshots across five bounded Playwright batches**. A separate read-only visual reviewer inspected all 58 against relevant published product UI. These are before captures of the real built Campaign frontend on shared package **0.3.14**, using isolated synthetic data. **Child states, repairs and after captures remain pending; this is not a completed whole-app audit.**

The **0.3.15 AuthLayout candidate is separate** from this baseline. Do not attribute its authentication work, shared panel-inset correction or pending native source changes to these 0.3.14 screenshots. Keep Campaign's existing mark, icons and login composition.

[Allowlisted capture/pin summary](native-baseline.json) records all 58 original basenames and hashes, route/theme/containment assertions, numeric contrast findings and selected source/served hashes. Only the eleven representative redacted figures below are copied publicly, byte-for-byte. Private receipts, authentication state, bootstrap identifiers and raw text samples are excluded.

## Screen coverage

The required-composition column is the coverage target, not a claim that every listed editor or data branch was opened. Each route has one desktop baseline per theme. Queues returned HTTP 502 in both themes and therefore covers unavailable data, not a populated queue. C1-C8 refer to the [official reference register](../2026-10-19/visual-campaign.md); [settings/report references](../2026-10-19/visual-templates.md) and the newer partial figures are qualified below.

| View | Section | Required native composition | Reference | Light / dark |
| --- | --- | --- | --- | --- |
| overview | — | Metrics, campaign rows/charts, channel empty/populated, upcoming/activity/footer | C4 | Captured both; child/after pending |
| campaigns | — | All/active/draft/paused/completed lists, search empty, campaign editor | C4 | Captured both; child/after pending |
| publishing | posts | Local/scheduled/published/account-specific posts, composer and management | C1 | Captured both; child/after pending |
| publishing | library | Post, article and product/collection libraries and selected detail | C1/C7 | Captured both; child/after pending |
| publishing | queues | Queue list, selected slots, editor and reshuffle review | C2 | Captured both; child/after pending. Baseline unavailable: HTTP 502 |
| publishing | recycling | Source, account/repeat settings and review, existing copies | C1/C2 | Captured both; child/after pending |
| publishing | destinations | Destination list, capability/identity, selection and create/review | C1 | Captured both; child/after pending |
| approvals | — | Review list/detail, exact revision, publishing options and decision/recovery | C2 | Captured both; child/after pending |
| calendar | — | Month grid, agenda, account-specific post, Google overlay/configuration | C2 | Captured both; child/after pending |
| ads | campaigns | Campaign list/detail, paused creation/review, management | C3/C4 | Captured both; child/after pending |
| ads | search | Planner, terms/keywords/negatives, targeting, bidding and conversions | C3/C4 | Captured both; child/after pending |
| ads | shopping | Mapping, paused creation, Shopping/Video reports and product bid | C3/C4 | Captured both; child/after pending |
| ads | microsoft | Mapping, paused search creation, list/detail/performance/export | C3/C4 | Captured both; child/after pending |
| ads | leads | Form list/detail/questions, test lead, selected response/import review | C3/C8 | Captured both; child/after pending |
| ads | events | Update list, empty/error and diagnostic detail | C4 | Captured both; child/after pending |
| ads | measurement | Tag list/detail, create/review and code wrapping | C4 | Captured both; child/after pending |
| ooh | — | Map fallback/list, placement/inventory, proposal and local/provider booking | C5 | Captured both; child/after pending |
| direct | campaigns | Campaign editor, audience/exclusions, schedule/results, internal contacts | C8 | Captured both; child/after pending |
| direct | templates | Template list/detail/editor, library/language variants and delete review | C8 | Captured both; child/after pending |
| direct | contacts | Connected contacts/detail, filters/import, metadata/subscription/custom fields | C8 | Captured both; child/after pending |
| inbox | — | Every actual tab, selected conversation/history, SMS, reply/compose and dirty review | C6 | Captured both; child/after pending |
| links | — | Setup, create/UTM, list/rename, QR and activity/detail | No exact C1–C8 match | Captured both; child/after pending |
| assets | — | Image/video/document lists, preview/fallback, asset/delivery editor | C7 | Captured both; child/after pending |
| providers | — | Provider list, empty/search and editor | C5 | Captured both; child/after pending |
| analytics | summary | Metrics, unavailable/zero, daily impressions/top posts and social report | C4 | Captured both; child/after pending |
| analytics | accounts | Account/report selection, populated/empty/error and retention/detail | C4 | Captured both; child/after pending |
| draft-content | — | Configured/unconfigured, history/result, cost/usage and errors | No exact C1–C8 match | Captured both; child/after pending |
| integrations | — | Provider configuration, mapping/health, account defaults, profiles/groups and permissions | Native brand + settings references | Captured both; child/after pending |
| settings | — | Project/account/workspace, theme preference, team/invites and recovery | Settings references | Captured both; child/after pending |

## Baseline evidence and findings

All 58 exact route checks, native theme checks and document-containment checks passed. Actual Settings Appearance choices persisted through reload; System followed emulated OS preference. The five receipts contain zero browser exceptions and zero blocked requests. Their two API errors are the expected queue-unavailable responses. The automatic text scan recorded **4702 rendered samples, 74 failing samples across 33 captures**, and 200 unsupported paint samples. Repeated shell samples are counted per capture, not as unique defects. Unsupported gradient/image/opacity paint requires manual review; a zero automatic failure count is not accessibility certification.

The light shell avatar measures 4.47657:1. Dark Posts caption/schedule pairs measure approximately 2.85573:1 and 2.84827:1. Native OOH pale surfaces, Assets filename/source/badge surfaces and the Draft content model caption also need repair. Campaign owns those native follow-ups; the before evidence does not accept a prepared source fix. Root review found no other visible topbar paint defect in this baseline.

| Representative before capture | Observed comparison / pending correction |
| --- | --- |
| [Overview light](images/campaign-baseline/overview-light-1440.png), [Overview dark](images/campaign-baseline/overview-dark-1440.png) | Existing metric/table hierarchy is coherent; preserve local totals, currency and unavailable distinctions. Optmyzr supports grouping only, not equal dataset or provider parity. |
| [Posts dark](images/campaign-baseline/publishing-posts-dark-1440.png) | Repair native caption/schedule pairs. Show supplied exact account labels beside platform glyphs; preserve every Edit/Publish action. Section navigation and status filters need distinct visual hierarchy. |
| [Calendar light](images/campaign-baseline/calendar-light-1440.png) | Separate caption/account labels in event cards. Align Google date controls and add existing action-group spacing; preserve exact due times, timezone and whole-project review scope. Sprout's historical week image is a partial planning reference. |
| [OOH dark](images/campaign-baseline/ooh-dark-1440.png) | Repair the native pale map/summary surfaces. Keep separate inventory selection, proposal/booking/cancellation reviews and pending provider confirmation. Broadsign's action strip proves no receipt parity. |
| [Direct campaigns dark](images/campaign-baseline/direct-campaigns-dark-1440.png) | Pair the public-address, email-unavailable and transactional-purpose notices for dark mode. Keep permissions/exclusions, service-message restriction and draft availability. Mailchimp's import-result crop does not cover this send editor. |
| [Assets dark](images/campaign-baseline/assets-dark-1440.png) | Repair native source/filename/badge surfaces. Retain explicit preview fallback and expiry; Frontify discovery is not exact-version approval evidence. |
| [Providers light](images/campaign-baseline/providers-light-1440.png) | The active sidebar entry is clipped below Asset library. Bring the selected item into the existing menu viewport and verify keyboard/wheel access; keep the scrollbar visually hidden and retain every route. |
| [Draft content dark](images/campaign-baseline/draft-content-dark-1440.png) | Repair the native model caption and provide guarded setup navigation. This unconfigured state proves no generation/history/cost behavior. Buffer is a text-flow reference only. |
| [Integrations dark](images/campaign-baseline/integrations-dark-1440.png) | Compact repeated multi-line Manage labels using full accessible names. Preserve account identity, instance versus project scope, mappings, permissions and explicit actions. |
| [Settings light](images/campaign-baseline/settings-light-1440.png) | Recovery's half-width table cuts off columns after Action/Created at desktop. Give the recovery composition adequate width while retaining its local keyboard scroller and unconfirmed-outcome evidence. |

Other bounded native findings: simplify the Connected contacts filter grid that leaves its left half empty; compact repeated Inspect labels without losing accessible identities; keep Inbox account/load controls prominent and put secondary full-history search behind a labelled disclosure; bring routine Links creation/list work ahead of configured domain/snippet administration while keeping the public-domain warning visible. Reuse supplied data, existing controls and guarded navigation. Account reports repeats Calendar's staggered field alignment. Setup guidance must consistently lead to the actual Integrations destination, including Templates, Measurement and Draft content. Clarify queue-read failure scope, export scope and singular count copy.

Approvals is 5,921px tall for five fixture records because platform and account previews repeat. A compact account/version/status header and progressive preview disclosure are proposed, preserving every exact preview, review decision and dirty-state safeguard. These layout proposals are pending, not inferred functional failures. The shared padded-panel inset correction is implemented separately; native after captures must verify adoption. No additional shared component API is justified by these baseline images alone.

## Editors and non-route surfaces

Scope remains **16 main screens, 29 addressable page/section combinations and 17 root editor types**, plus child reviews, authentication and access states. The root editor switch includes campaign, post, placement, asset, asset-delivery, provider, project, workspace, ad, ad-details, connect, blog-draft, product-edit, product-create, product-price, product-state and collection-title. Route screenshots do not cover hidden editors.

Child acceptance still requires explicit opening actions and captures for unsaved root/inbox reviews; paid activation/copy/creative reviews; article/product/collection outcomes; provider replacement reviews; direct audience/send/exclusion/import outcomes; and calendar approval/exact-time controls. Preserve destinations, revision/account/currency, approval versus scheduling/delivery, uncertain outcomes and draft recovery.

Authentication/access remains separate: loading, first setup, sign-in/error, configured/unconfigured OIDC, no-project/workspace creation, invitation available/unavailable/sign-in/accept, session failure/retry and page-boundary failure. Use intercepted native response contracts or an isolated unmodified boundary fixture; no real account/invitation/configuration/provider write is required. Narrow, doubled-text, selected/detail/populated, alternate role and error/recovery cases need their own acceptance.

## Evidence and stop rules

- Keep one browser worker and bounded batches, stable font/transition capture boundaries and source pins.
- Retain original failures and distinguish source fixes from rebuilt after proof. Every required after state needs its actual route/action, theme, containment, contrast/manual paint and functional safeguard checks.
- Reuse existing synthetic provider and response contracts; do not invent production capabilities or expose private receipts/storage.
- Stop passing bounded work. Historical 931 checks, source inventory, route screenshots and vendor UI references do not substitute for current child/after acceptance.

## Reference boundaries

The original [Campaign brand/login](../2026-10-19/campaign-dark.md) is authoritative for identity. [Linear settings and Stripe report figures](../2026-10-19/visual-templates.md) support grouping, scope, date and result hierarchy. The three new figures below were rendered and captured with Playwright, then individually inspected. They are official published UI, not authenticated vendor interaction or vendor dark-mode evidence. Sample versions/dates are unspecified.

| Source | Actual captured figure | Apply only this comparison |
| --- | --- | --- |
| [Buffer team/permissions guide](https://support.buffer.com/en-us/articles/adding-users-and-setting-up-permissions-ixjiLpe2fd) | [Invite dialog, published GIF frame](images/references/buffer-team.png) | Fields precede scoped permissions and one explicit invite action. Channel access and organization administration are different capabilities. No invitation is sent in this audit. |
| [Sprout organic-only report guide](https://support.sproutsocial.com/hc/en-us/articles/31040394769421-How-do-I-make-an-Organic-only-report) | [Metrics selector](images/references/sprout-report.png) | Search, grouped metric choices and an explicit data basis. This is a selector crop, not a complete report or job lifecycle; provider data capabilities differ. |
| [Bitly create-link guide](https://support.bitly.com/hc/en-us/articles/230897128-How-do-I-create-links-with-Bitly) | [Optional UTM field group](images/references/bitly-utm.png) | Group optional attribution fields under a named setting. This figure does not establish link-list, QR, activity or analytics parity. The article was updated 20 July 2026; the figure's product version is not stated. |

Buffer's [AI Assistant guide](https://support.buffer.com/en-us/articles/using-buffers-ai-assistant-qbBulfw9sn) documents generation followed by review/edit and explicit insertion. Its stable attachment did not render an eligible image in the single bounded browser attempt, so no new Draft content screenshot comparison is claimed. It supplies no charged-job/history/cost parity. None of these references justifies importing unsupported permission, reporting, booking, generation or paid-provider features.
