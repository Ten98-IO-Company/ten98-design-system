# Campaign and Discover: consumer screen review

Reviewed 19 October 2026. These seven images come from the consumer app source or browser fixtures, rather than the design-system catalogue. They do **not** establish a full authenticated product session, live backend/provider results, publishing, payment or successful recording playback. Campaign captures use **0.3.4**; Discover replay and Explorer use **0.3.3**. The supplied Search Console image does not identify its package version. These are baselines, not evidence that the consumers have adopted or passed acceptance against the current **0.3.5** integration target.

The official reference images and their provenance are retained in [Campaign C2](visual-campaign.md#c2--planning-and-exact-version-approval), [Campaign C3](visual-campaign.md#c3--paid-campaign-creation) and the [Discover D3/D8/D15 register](visual-discover.md#capture-and-comparison-register). Comparisons below concern visible hierarchy only. Keep existing ten98 branding, exact accounts and values, independent workflow states, source freshness/unknown disclosures and consent boundaries.

## Campaign calendar · desktop · 0.3.4

[Consumer screenshot, 1440px](images/consumer/campaign-calendar-1440-0.3.4.png) · [Sprout calendar image](images/campaign/c2-reference-repair-1.png) · [official calendar guide](https://support.sproutsocial.com/hc/en-us/articles/360000121343-How-do-I-use-the-Publishing-Calendar).

**Strength:** October 2026, date navigation and two account-specific post cards share a clear month grid. The Google Calendar section explicitly says calendar events do not publish social posts. Sprout's historical October 2022 week image provides a useful reference for a compact date/view toolbar and readable post cards.

**Gap / next task:** Pale out-of-month cells dominate the dark calendar, and the workspace switcher is pale with faint text. Both are **open until verified**: Campaign owns the native calendar correction; the workspace switcher belongs to shared `src/lib/app.css` and is being corrected upstream before the 0.3.5 freeze. Re-capture this actual consumer after each correction.

**Limit:** Two fixture posts do not establish dense-calendar usability, successful scheduling or Google synchronization. Sprout's different period, view and dataset provide no capacity or behavior equivalence.

## Campaign calendar · narrow · 0.3.4

[Consumer screenshot, 320px](images/consumer/campaign-calendar-320-0.3.4.png) · [same Sprout desktop reference](images/campaign/c2-reference-repair-1.png).

**Strength:** The month grid becomes a readable publishing agenda. It retains `Asia/Dubai`, `GMT+4`, the October 20/21 account-specific times and explicit draft states. Google integration details wrap below the agenda.

**Gap / next task:** The long Google planning explanation and separated date controls make secondary integration work occupy much of the screen. Tighten that grouping while preserving its whole-project scope and the statement that calendar events do not publish posts.

**Limit:** This is one 320px fixture state. The supplied Sprout capture is desktop; it cannot establish a competing mobile pattern or prove keyboard, zoom or provider behavior here.

## Campaign approvals · narrow · 0.3.4

[Consumer screenshot, 320px](images/consumer/campaign-approvals-320-0.3.4.png) · [Campaign C2 reference limits](visual-campaign.md#c2--planning-and-exact-version-approval).

**Strength:** The screen explains that approval never publishes, displays exact selected account IDs, and distinguishes “Changed since review,” “Not requested” and “Submitted to provider.” The changed draft retains its review context.

**Gap / next task:** Repeated platform previews followed by account previews create a very long queue; pale preview text is difficult to read against white cards. Prioritize the account/version summary and selected creative, retaining access to each exact account preview and unavailable-media explanation.

**Limit:** Several previews explicitly lack playable media. The Sprout [calendar image](images/campaign/c2-reference-repair-1.png) and [guide](https://support.sproutsocial.com/hc/en-us/articles/360000121343-How-do-I-use-the-Publishing-Calendar) supply calendar context, not an approval dialog; no competitor approval equivalence or actual publication outcome is claimed.

## Campaign new ad form · narrow · 0.3.4

[Consumer screenshot, 320px](images/consumer/campaign-ad-review-320-0.3.4.png) · [TikTok objective-selection image](images/campaign/c3-reference-repair-1.png) · [official creation guide](https://ads.tiktok.com/resources/help/article/how-to-create-an-ad-in-tiktok-ads-manager-for-new-advertisers).

**Strength:** Labelled channel, advertising account, source, format, goal and budget fields retain `Meta · facebook QA`, `AED` and the paused-before-activation explanation. TikTok's image illustrates separation of objective choice and dependent settings.

**Gap / next task:** The form extends beyond this crop. Inspect its remaining fields and exact outgoing review at 320px before changing density; keep currency, target countries and paused/activation boundaries adjacent to their decisions.

**Limit:** Despite the filename, the image shows the creation form, ending at target countries. It does not show a completed confirmation or an ad receipt. TikTok's desktop objective picker is a different provider and stage.

## Discover replay · narrow with doubled text · 0.3.3

[Consumer screenshot](images/consumer/discover-replay-320-doubled-text-0.3.3.png) · [Umami replay image](images/discover/ref-replay.png) · [official replay documentation](https://docs.umami.is/docs/replays).

**Strength:** The captured controls remain readable at 320px with enlarged text: Ended, Play recording, `Elapsed 0:02 / 0:02`, named seek and `2×` speed. Recording context, explicit preview action and masking limitations remain visible. Umami's image offers a clear player/transport grouping reference.

**Gap / next task:** The tall blank player separates the preview action from transport. Verify a real authorized rrweb recording in the consumer, then assess a bounded responsive player with controls close to it; preserve separate replay consent, retention, completeness and masking disclosures.

**Limit:** The screenshot explicitly declares a **synthetic transport and player-peer fixture**. Its blank playback area is not real rrweb playback, capture correctness or native authentication proof. The displayed five-minute capture limit is not the observed duration.

## Discover Explorer · desktop · 0.3.3

[Consumer screenshot, 1440px](images/consumer/discover-explorer-1440-0.3.3.png) · [Umami breakdown image](images/discover/ref-breakdown.png) · [official breakdown documentation](https://docs.umami.is/docs/breakdown).

**Strength:** Applied scope sits above the result, with a visible focus ring on Edit filters. Zero events/page views/custom events remain distinct from unavailable visitors and unknown capture coverage. The literal path and campaign values remain inspectable. Umami similarly attaches an applied condition to its numeric result.

**Gap / next task:** Large gaps separate scope, measurement quality, metrics and the empty breakdown. Bring these into a tighter report group while keeping the applied 2024-02-28–29 UTC scope and bounded-CSV explanation explicit.

**Limit:** Synthetic DTOs exercise an empty report, not a live analytics query. Umami's populated country table cannot establish equal metric semantics, data coverage or scale; this image also does not exercise narrow layouts.

## Discover Search Console · desktop · saved-response fixture

[Consumer screenshot](images/consumer/discover-search-performance-desktop.png) · [Google metric/chart image](images/gaps/gsc-performance-2025.png) · [official announcement, 10 December 2025](https://developers.google.com/search/blog/2025/12/weekly-monthly-views-search-console).

**Strength:** Source, saved snapshot, property, October 1–2 interval and `America/Los_Angeles` are explicit. Unknown measurement freshness remains beside the completed import. The two rows retain `0` versus unavailable position and the second row's exact `2` clicks, `10` impressions, `0.2` CTR and `1.5` position.

**Gap / next task:** Consolidate repeated snapshot/status text into a compact report header and keep the freshness warning immediately above the table. Google's captured summary groups metrics and a trend tightly; use that hierarchy only where the consumer actually supplies data.

**Limit:** This is a synthetic saved response, not a live Google account or import. A completed import does not establish measurement completeness or freshness. Google's historical chart crop has no query table or permission state; its displayed CTR percentage must not replace the consumer's native fractional unit. No weekly/monthly aggregation or chart capability is inferred.

## Follow-up boundary

The two dark-theme defects above remain open pending corrected consumer captures. Other gaps are concrete next inspection/design tasks, not claims of completed fixes or approved new capabilities. Library validation and consumer acceptance remain separate in the [completion ledger](../../CAMPAIGN-DISCOVER-COMPLETION.md).
