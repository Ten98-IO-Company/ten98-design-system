# Campaign screen audit

Reviewed **20 October 2026, Asia/Dubai**. All **29 native route/section after states are accepted in both light and dark mode: 58 screenshots across five bounded Playwright batches**, with combined independent and root visual inspection of all 58. These are captures of the real built Campaign frontend using isolated synthetic data. **This accepts the captured desktop route states.** Subsequent [auth/editor/error-state acceptance](campaign-auth-editors.md) is recorded separately; other child/role/data branches retain their own scope.

The after generation uses released shared package **0.3.15**, artifact `ten98-ui-0.3.15.tgz`, SHA-256 `C690CD081EE82ECE3802388994E746DCC198FF309ECB3B8668FF60A324C7CA77`, source commit `3009edca5f5a3fa126d3a59bfc9160f6c3f093c2`. The original **0.3.14 before baseline** and its failures remain historical evidence. Keep Campaign's existing mark, icons and login composition. Authentication has its [own acceptance record](auth-layout.md); route screenshots do not establish authentication acceptance.

The allowlisted [before summary](native-baseline.json) and [after summary](native-after.json) record each generation's 58 original basenames/hashes, route/theme/containment assertions, numeric scan results and selected source/served hashes. Eleven representative redacted synthetic figures from each generation are published byte-for-byte. Private receipts, authentication state, bootstrap identifiers and raw text samples are excluded.

## Screen coverage

The required-composition column is the coverage target, not a claim that every listed editor or data branch was opened. Each route has one desktop before and after per theme. The before Queues state returned HTTP 502 in both themes; the after uses a populated synthetic queue. These are different data branches, not an equal-data comparison. C1-C8 refer to the [official reference register](../2026-10-19/visual-campaign.md); [settings/report references](../2026-10-19/visual-templates.md) and the newer partial figures are qualified below.

| View | Section | Required native composition | Reference | Light / dark |
| --- | --- | --- | --- | --- |
| overview | — | Metrics, campaign rows/charts, channel empty/populated, upcoming/activity/footer | C4 | Route after accepted both; child/data pending |
| campaigns | — | All/active/draft/paused/completed lists, search empty, campaign editor | C4 | Route after accepted both; child/data pending |
| publishing | posts | Local/scheduled/published/account-specific posts, composer and management | C1 | Route after accepted both; child/data pending |
| publishing | library | Post, article and product/collection libraries and selected detail | C1/C7 | Route after accepted both; child/data pending |
| publishing | queues | Queue list, selected slots, editor and reshuffle review | C2 | Route after accepted both; child/data pending. Before unavailable: HTTP 502; after populated synthetic queue |
| publishing | recycling | Source, account/repeat settings and review, existing copies | C1/C2 | Route after accepted both; child/data pending |
| publishing | destinations | Destination list, capability/identity, selection and create/review | C1 | Route after accepted both; child/data pending |
| approvals | — | Review list/detail, exact revision, publishing options and decision/recovery | C2 | Route after accepted both; child/data pending |
| calendar | — | Month grid, agenda, account-specific post, Google overlay/configuration | C2 | Route after accepted both; child/data pending |
| ads | campaigns | Campaign list/detail, paused creation/review, management | C3/C4 | Route after accepted both; child/data pending |
| ads | search | Planner, terms/keywords/negatives, targeting, bidding and conversions | C3/C4 | Route after accepted both; child/data pending |
| ads | shopping | Mapping, paused creation, Shopping/Video reports and product bid | C3/C4 | Route after accepted both; child/data pending |
| ads | microsoft | Mapping, paused search creation, list/detail/performance/export | C3/C4 | Route after accepted both; child/data pending |
| ads | leads | Form list/detail/questions, test lead, selected response/import review | C3/C8 | Route after accepted both; child/data pending |
| ads | events | Update list, empty/error and diagnostic detail | C4 | Route after accepted both; child/data pending |
| ads | measurement | Tag list/detail, create/review and code wrapping | C4 | Route after accepted both; child/data pending |
| ooh | — | Map fallback/list, placement/inventory, proposal and local/provider booking | C5 | Route after accepted both; child/data pending |
| direct | campaigns | Campaign editor, audience/exclusions, schedule/results, internal contacts | C8 | Route after accepted both; child/data pending |
| direct | templates | Template list/detail/editor, library/language variants and delete review | C8 | Route after accepted both; child/data pending |
| direct | contacts | Connected contacts/detail, filters/import, metadata/subscription/custom fields | C8 | Route after accepted both; child/data pending |
| inbox | — | Every actual tab, selected conversation/history, SMS, reply/compose and dirty review | C6 | Route after accepted both; child/data pending |
| links | — | Setup, create/UTM, list/rename, QR and activity/detail | No exact C1–C8 match | Route after accepted both; child/data pending |
| assets | — | Image/video/document lists, preview/fallback, asset/delivery editor | C7 | Route after accepted both; child/data pending |
| providers | — | Provider list, empty/search and editor | C5 | Route after accepted both; child/data pending |
| analytics | summary | Metrics, unavailable/zero, daily impressions/top posts and social report | C4 | Route after accepted both; child/data pending |
| analytics | accounts | Account/report selection, populated/empty/error and retention/detail | C4 | Route after accepted both; child/data pending |
| draft-content | — | Configured/unconfigured, history/result, cost/usage and errors | No exact C1–C8 match | Route after accepted both; child/data pending |
| integrations | — | Provider configuration, mapping/health, account defaults, profiles/groups and permissions | Native brand + settings references | Route after accepted both; child/data pending |
| settings | — | Project/account/workspace, theme preference, team/invites and recovery | Settings references | Route after accepted both; child/data pending |

## Historical before evidence and findings

All 58 exact route checks, native theme checks and document-containment checks passed. Actual Settings Appearance choices persisted through reload; System followed emulated OS preference. The five receipts contain zero browser exceptions and zero blocked requests. Their two API errors are the expected queue-unavailable responses. The automatic text scan recorded **4702 rendered samples, 74 failing samples across 33 captures**, and 200 unsupported paint samples. Repeated shell samples are counted per capture, not as unique defects. Unsupported gradient/image/opacity paint requires manual review; a zero automatic failure count is not accessibility certification.

The light shell avatar measures 4.47657:1. Dark Posts caption/schedule pairs measure approximately 2.85573:1 and 2.84827:1. Native OOH pale surfaces, Assets filename/source/badge surfaces and the Draft content model caption also required repair. These are historical before findings; the current route after evidence is recorded separately below. Root review found no other visible topbar paint defect in this baseline.

| Representative before capture | Historical observed comparison / correction target |
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

Other bounded native before findings: simplify the Connected contacts filter grid that leaves its left half empty; compact repeated Inspect labels without losing accessible identities; keep Inbox account/load controls prominent and put secondary full-history search behind a labelled disclosure; bring routine Links creation/list work ahead of configured domain/snippet administration while keeping the public-domain warning visible. Reuse supplied data, existing controls and guarded navigation. Account reports repeats Calendar's staggered field alignment. Setup guidance must consistently lead to the actual Integrations destination, including Templates, Measurement and Draft content. Clarify queue-read failure scope, export scope and singular count copy.

Approvals is 5,921px tall for five fixture records because platform and account previews repeat. A compact account/version/status header and progressive preview disclosure are proposed, preserving every exact preview, review decision and dirty-state safeguard. These layout proposals are pending, not inferred functional failures. The shared padded-panel inset correction is verified in the captured route after generation below. No additional shared component API is justified by these baseline images alone.

## Accepted desktop route after states

The five final batches ran from **19 October 2026, 21:00:36Z to 21:02:02Z**. All 58 exact route, theme and document-containment checks passed; all 172 explicit assertions passed. The automatic scan recorded **4,782 rendered text samples and zero measured failures**, with zero browser exceptions, blocked requests or API errors. Served and fixture pins stayed unchanged within every batch. Settings choices persisted through reload and System followed emulated OS preference.

**All 200 unsupported paint records remain recorded across all 58 captures.** Every original capture status is still `manual-review`, and all five original aggregate `receipt.pass` flags remain `false`; the legacy CLI therefore exits 1. Manual visual review of the observed paint found no visible regression, including the topbar. This closes the observed visual finding only: it supplies no numeric result for unsupported gradient/image/opacity paint and is not AA certification. The allowlisted after summary preserves these raw statuses rather than relabelling the automatic run as fully passed.

The reference reviewer inspected all 24 images in batches 1–2, the second reviewer all 24 in batches 3–4, and root all ten in batch 5. Root and the second reviewer reread actual Assets before/final images: Drive/source and Image fallback content remain visible, while filename/source/badge readability improves. No observed visual regression remains in these 58 captured states. References below remain partial comparisons, with no vendor or live-provider parity claim.

| Representative after capture | Verified within the captured state |
| --- | --- |
| [Overview light](images/campaign-after/overview-light-1440.png), [Overview dark](images/campaign-after/overview-dark-1440.png) | Coherent shell, metrics and tables; existing identity retained. The differing synthetic provider count is a data change, not a regression. |
| [Posts dark](images/campaign-after/publishing-posts-dark-1440.png) | Caption/schedule readability and navigation hierarchy corrected; exact destination IDs remain visible with existing actions. Human-friendly account-name resolution is not established here. |
| [Calendar light](images/campaign-after/calendar-light-1440.png) | Caption/account lines and date-field/action spacing corrected; month grid, due times and whole-project review limitations retained. |
| [OOH dark](images/campaign-after/ooh-dark-1440.png) | Captured native map/summary surfaces readable; inventory, proposal and pending-provider scope retained. Additional placement/booking branches require their own proof. |
| [Direct campaigns dark](images/campaign-after/direct-campaigns-dark-1440.png) | Native notices readable in dark mode; permissions, exclusions, service-message restriction and draft boundaries retained. |
| [Assets dark](images/campaign-after/assets-dark-1440.png) | Filename/source/badge readability improved; original Drive and explicit preview fallback content remain visible. |
| [Providers light](images/campaign-after/providers-light-1440.png) | Selected navigation and route content visually reviewed without an observed regression; no provider mutation exercised. |
| [Draft content dark](images/campaign-after/draft-content-dark-1440.png) | Captured model/setup composition readable; this route capture does not accept generation, history, usage or charged-job behavior. |
| [Integrations dark](images/campaign-after/integrations-dark-1440.png) | Captured setup/account-scope content reviewed without an observed regression; provider configuration and mapping actions remain separate checks. |
| [Settings light](images/campaign-after/settings-light-1440.png) | Captured preferences/recovery composition reviewed without an observed regression; invitation, role and recovery outcomes remain separate checks. |

The Queue after state has a populated synthetic schedule with compact Preview/Edit/Delete actions and a separate local-post queue. Its empty local-post section does not contradict an active provider queue. Library, Recycling and Destinations remain unselected; advertising is unloaded or unconfigured. These data limits are not populated/editor acceptance.

Campaign's separate native validation reported **950 checks, build and container clear on the frozen capture generation**. Those checks are not inferred from screenshots. Subsequent queue error-edge, loading/error-color and post-footer repairs are **outside this after generation**; their separate accepted browser proof is recorded in [native auth/editor acceptance](campaign-auth-editors.md). These route results do not substitute for that proof.

## Editors and non-route surfaces

Scope remains **16 main screens, 29 addressable page/section combinations and 17 root editor types**, plus child reviews, authentication and access states. The root editor switch includes campaign, post, placement, asset, asset-delivery, provider, project, workspace, ad, ad-details, connect, blog-draft, product-edit, product-create, product-price, product-state and collection-title. All 17 types are subsequently captured and inspected in both themes, with a separate published-blog child and targeted footer checks. See the [editor evidence](campaign-auth-editors.md); route screenshots alone do not cover hidden editors.

Child acceptance still requires explicit opening actions and captures for unsaved root/inbox reviews; paid activation/copy/creative reviews; article/product/collection outcomes; provider replacement reviews; direct audience/send/exclusion/import outcomes; and calendar approval/exact-time controls. Preserve destinations, revision/account/currency, approval versus scheduling/delivery, uncertain outcomes and draft recovery.

Authentication/access now has [60 separately accepted captures](campaign-auth-editors.md), including loading/setup, sign-in/error, OIDC link availability, no-project access, invitation states, session/state failure and retry, and the genuine mounted boundary/reload action. These use intercepted native response contracts. Representative narrow layouts are covered; no successful real account/invitation/OIDC/provider action is claimed. Additional doubled-text, role and data branches retain their own acceptance scope.

## Evidence and stop rules

- Keep one browser worker and bounded batches, stable font/transition capture boundaries and source pins.
- Retain original failures and distinguish source fixes from rebuilt after proof. Every required after state needs its actual route/action, theme, containment, contrast/manual paint and functional safeguard checks.
- Reuse existing synthetic provider and response contracts; do not invent production capabilities or expose private receipts/storage.
- Stop passing bounded work. Historical checks, source inventory, accepted route screenshots and vendor UI references do not substitute for separately required current child/role/data acceptance.

## Reference boundaries

The original [Campaign brand/login](../2026-10-19/campaign-dark.md) is authoritative for identity. [Linear settings and Stripe report figures](../2026-10-19/visual-templates.md) support grouping, scope, date and result hierarchy. The three new figures below were rendered and captured with Playwright, then individually inspected. They are official published UI, not authenticated vendor interaction or vendor dark-mode evidence. Sample versions/dates are unspecified.

| Source | Actual captured figure | Apply only this comparison |
| --- | --- | --- |
| [Buffer team/permissions guide](https://support.buffer.com/en-us/articles/adding-users-and-setting-up-permissions-ixjiLpe2fd) | [Invite dialog, published GIF frame](images/references/buffer-team.png) | Fields precede scoped permissions and one explicit invite action. Channel access and organization administration are different capabilities. No invitation is sent in this audit. |
| [Sprout organic-only report guide](https://support.sproutsocial.com/hc/en-us/articles/31040394769421-How-do-I-make-an-Organic-only-report) | [Metrics selector](images/references/sprout-report.png) | Search, grouped metric choices and an explicit data basis. This is a selector crop, not a complete report or job lifecycle; provider data capabilities differ. |
| [Bitly create-link guide](https://support.bitly.com/hc/en-us/articles/230897128-How-do-I-create-links-with-Bitly) | [Optional UTM field group](images/references/bitly-utm.png) | Group optional attribution fields under a named setting. This figure does not establish link-list, QR, activity or analytics parity. The article was updated 20 July 2026; the figure's product version is not stated. |

Buffer's [AI Assistant guide](https://support.buffer.com/en-us/articles/using-buffers-ai-assistant-qbBulfw9sn) documents generation followed by review/edit and explicit insertion. Its stable attachment did not render an eligible image in the single bounded browser attempt, so no new Draft content screenshot comparison is claimed. It supplies no charged-job/history/cost parity. None of these references justifies importing unsupported permission, reporting, booking, generation or paid-provider features.
