# ten98-voip reference evidence

Research snapshot: **19 October 2026** (Asia/Dubai). Status: **research and proposals; no feature or component decisions approved**. Canonical initial scope: the `ten98-voip` row in [UX-PATTERNS](../../UX-PATTERNS.md). Read alongside [observed flows and proposed adaptations](flows.md) and [decision proposals](recommendations.md).

## Scope and method

The matrix covers contact/queue tables, presence, settings, detail cards and activity; application-owned SIP/media, recording, routing, call state, contact-center logic and authorization; possible softphone, queue board, call controls, routing builder and recording player extensions. This research includes the owner's named 3CX, FusionPBX and Asterisk references.

Three categories need separate comparisons:

| Category | User and primary job | Comparison boundary |
| --- | --- | --- |
| Self-hosted PBX administration | Administrator connects trunks, numbers, endpoints and call destinations | Closest architectural fit; Asterisk is an engine, while FreePBX is an administration GUI around it |
| Business calling / UCaaS | Employee or receptionist finds people and handles calls | Good agent interaction references; hosted service popularity does not establish self-hosted suitability |
| Contact-center operations / CCaaS | Agent handles routed work; supervisor watches queues; administrator configures distribution | Strong workflow references; enterprise scope and cloud runtime must not become implicit ten98 requirements |

Method: public official manuals, help articles and documented UI images, plus independent review aggregates and analyst summaries. No customer tenant, trial account, actual call, payment, microphone permission or production change was used. Two research agents independently collected market evidence and official contact-center flows. These are desk-research observations, not interviews, measured task performance or an accessibility audit.

All external links below were accessed on **2026-10-19**. “Current documentation” means the live page retrieved on that date, not a guarantee that every screenshot depicts the newest shipped build. Publication dates and narrower version limits are called out where known. No proprietary source, logos or competitor imagery is copied into the component library. Campaign remains the brand reference.

## Candidate inventory

Scores are out of five. Counts are source-specific snapshots, not normalized across websites or product families. The reference priority column is this researcher's inference from product fit, evidence quality and matrix coverage; it is not a numerical product ranking.

| Candidate | Review snapshot | Proposed reference priority / fit |
| --- | --- | --- |
| **3CX** | 4.4, 548 — [G2 seller's single product profile](https://www.g2.com/sellers/3cx) | Primary: closest named all-in-one PBX/calling reference |
| **FusionPBX** | Comparable independent aggregate not located | Primary: named self-hosted, multi-tenant administration reference; no “market leader” claim |
| **Asterisk** | 4.5, 44; ease of use 3.5 — [Capterra](https://www.capterra.com/p/60249/Asterisk/reviews/) | Required engine/concept reference; not a finished visual interface |
| **FreePBX** | 4.5, 17 — [G2](https://www.g2.com/products/freepbx/reviews) | Primary: Asterisk administration workflows; small review sample |
| **RingCentral RingEX** | 4.2, 1,437 — [G2 VoIP category](https://www.g2.com/categories/voip-providers) | Comparison: unified business calling; do not substitute RingCX evidence |
| **Zoom Phone** | 4.6, 2,637 — [G2 VoIP category](https://www.g2.com/categories/voip-providers) | Primary targeted reference: queue drill-down and employee calling |
| **Dialpad Connect** | 4.4, 4,051 — [G2 VoIP category](https://www.g2.com/categories/voip-providers) | Comparison: calling/context; distinct from Dialpad Support |
| **Aircall** | 4.4, 1,637 — [G2 contact-center category](https://www.g2.com/categories/contact-center) | Primary: approachable transfer language and routing editing |
| **Genesys Cloud CX** | 4.4, 1,487 — [G2 contact-center category](https://www.g2.com/categories/contact-center) | Primary: queue state, transfer, wrap-up and recording depth |
| **NiCE CXone** | 4.3, 1,730 — [G2 product profile](https://www.g2.com/products/nice-cxone/reviews) | Primary comparison: current agent consultation, outcomes and device recovery |
| **Amazon Connect** | 4.4, 83 — [G2 contact-center category](https://www.g2.com/categories/contact-center) | Primary: agent context, routing publication/versioning and permission boundaries |
| **Talkdesk** | 4.4, 2,513 — [G2 contact-center category](https://www.g2.com/categories/contact-center) | Reserve: alternative contact-center context / operations |
| **Five9** | 4.1, 604 — [G2 contact-center category](https://www.g2.com/categories/contact-center) | Reserve: revenue-leading CCaaS; outbound operations if explicitly added |
| **Zoom Contact Center** | 4.3, 70 — [G2](https://www.g2.com/products/zoom-contact-center/reviews) | Reserve: evaluate independently of Zoom Phone |
| **Dialpad Support** | 4.4, 712 — [G2](https://www.g2.com/products/dialpad-support/reviews) | Reserve: agent context/reporting comparisons |
| **Avaya contact-center portfolio** | No comparable review aggregate captured | Include for enterprise premises context; vendor-level revenue cannot rank individual Workspaces screens |
| **Cisco contact-center portfolio** | No comparable review aggregate captured | Include for premises/enterprise comparison; Webex CC and Finesse are separate interfaces |

The G2 category pages identify an October 2026 snapshot and describe ranking from reviews, satisfaction and market presence. G2's market-presence score is not installed-base or revenue share. Many reviews disclose incentives and some summaries are AI-generated. Review sites contain self-selected users across editions, roles and vintages. The Asterisk Capterra page describes review moderation and labels incentives. A product's score therefore helps shortlist it; it cannot prove that its transfer UI is better.

The market-evidence pass found different G2 counts on category and direct product pages: RingEX 1,437 versus 1,488; Zoom Phone 2,637 versus 2,672. This table deliberately retains category counts. Do not average or silently update them from a different source.

## Market position and adoption

| Evidence | Observation | Interpretation limit |
| --- | --- | --- |
| [Metrigy public MetriCast summaries](https://www.metrigy.com/content-type/metricast-report/) | 2025 global CCaaS revenue share: NiCE 22.3%, Genesys 20.0%, Five9 12.7%. Latest public quarterly summary found: 2Q26 revenue $2.4bn, NiCE share 21.6%. | Analyst revenue estimates for CCaaS, not PBX installations. Paid methodology/detail was not inspected. |
| [Metrigy, same public index](https://www.metrigy.com/content-type/metricast-report/) | 2025 on-premises/dedicated contact-center revenue: Avaya 36.3%, Genesys 12.9%, Cisco 10.0%; excludes maintenance/support. | Distinct category and denominator from CCaaS; not an open-source PBX share table. |
| [Juniper competitor leaderboard](https://www.juniperresearch.com/press/ccaas-aws-genesys-and-nice-top-2025-competitor-leaderboard/), 28 April 2025 | AWS, Genesys and NiCE ranked first through third, comparing 18 CCaaS vendors across solution strength, coverage and emerging-technology support. | Composite analyst ranking; older than the quarterly revenue evidence; not a share estimate. |
| [3CX company page](https://www.3cx.com/company/) | Vendor reports 350,000+ customers, 190 countries and 12 million daily users. | Vendor adoption claims, no independent denominator or disclosed measurement procedure. |
| [FreePBX community](https://www.freepbx.org/community/) | Vendor/community site reports over two million installations. | No active-install definition or measurement period. Installations cannot be compared with customers or seats. |

No defensible comparable public installed-base market-share table for 3CX, FusionPBX and Asterisk/FreePBX was located. Asterisk may sit underneath multiple interfaces, which also makes double counting likely. Stars, downloads, customer logos and GitHub popularity are not substitutes for that missing measurement.

## Review themes to test

These are individual reviewer reports or platform aggregates, not reproduced defects or representative prevalence estimates.

| Signal | Source and date context | Research implication (inference) |
| --- | --- | --- |
| Configuration learning curve and update-related configuration concerns | [FreePBX G2](https://www.g2.com/products/freepbx/reviews), examples from March 2026 and December 2025 | Test whether administrators can distinguish an edited draft, saved configuration and an applied runtime change. |
| Lower ease-of-use aggregate than overall satisfaction | [Asterisk Capterra](https://www.capterra.com/p/60249/Asterisk/reviews/), page updated 26 August 2026 | Keep engine terminology in diagnostics/advanced settings; test task-oriented forms with non-specialist admins. |
| Reporting fragmentation and repeated outbound queue selection | [Dialpad Support G2](https://www.g2.com/products/dialpad-support/reviews), reviewer dated 27 April 2026 | Test a persistent scoped caller identity and traceable report-to-call detail navigation. |
| Confusing availability transitions and slow script nodes | [NiCE CXone G2](https://www.g2.com/products/nice-cxone/reviews), reviewer dated 29 April 2026 | Validate pending status feedback and call-state recovery; do not infer a defect in every edition. |
| Call management, mobile access and integration praised | [3CX G2](https://www.g2.com/sellers/3cx), public review examples | Preserve an easy path between directory, dialer and active call; test on narrow screens. |

## Feature-level reference choices

| Scope area | Primary evidence | Why inspect / limitation |
| --- | --- | --- |
| SIP/provider and endpoint setup | [FusionPBX gateways](https://docs.fusionpbx.com/en/latest/accounts/gateways.html), [extensions](https://docs.fusionpbx.com/en/latest/accounts/extensions.html) | Concrete self-hosted configuration fields and scope. Runtime settings are engine-specific. |
| Directory, dialing, in-call actions | [3CX Web Client](https://www.3cx.com/user-manual/web-client/), [FusionPBX Phone](https://docs.fusionpbx.com/en/latest/applications/phone.html) | Documented call/device/registration controls; 3CX article updated 25 August 2026. |
| Consultation and hand-off | [Aircall transfers](https://support.aircall.io/en-gb/articles/10375396999965), [Genesys transfers](https://help.genesys.cloud/?p=7195) | Clear separation of immediate transfer and speaking first; destination/failure semantics differ. |
| Queue administration | [3CX queues](https://www.3cx.com/docs/manual/call-center-queues/), [FusionPBX call center](https://docs.fusionpbx.com/en/latest/applications/call_center.html), [Sangoma queues](https://sangomakb.atlassian.net/wiki/spaces/PG/pages/24608891/PBX%2BGUI%2B-%2BQueues%2BModule) | Queue/member/strategy/fallback concepts. Sangoma article explicitly describes GUI version 13, so use for concepts, not current visual fidelity. |
| Presence and live queue board | [3CX queue status](https://www.3cx.com/docs/pbx-queue-status/), [FusionPBX activity](https://docs.fusionpbx.com/en/latest/status/active_call_center.html), [Genesys queue activity](https://help.genesys.cloud/articles/queues-activity-detail-view/), [Zoom queue analytics](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0061144) | Separates agent readiness, call state and membership; supports drill-down from counters. Availability/permissions vary. |
| Routing, office hours and IVR | [3CX office hours](https://www.3cx.com/docs/manual/office-hours/), [FusionPBX IVR](https://docs.fusionpbx.com/en/latest/applications/ivr.html), [Aircall call flow](https://support.aircall.io/en-gb/articles/10375394403101) | Both form-driven and visual routing models. Current Aircall page says “call flow,” previously Smartflows. |
| Routing publication/history | [Amazon Connect versions/aliases](https://docs.aws.amazon.com/en_en/connect/latest/adminguide/flows-versions-aliases.html), [rollback](https://docs.aws.amazon.com/connect/latest/adminguide/flow-version-control.html) | Explicit published versions and rollback. This is a proposed safety pattern, not a mandate to adopt AWS resource models. |
| Call history and recordings | [FusionPBX CDR](https://docs.fusionpbx.com/en/latest/applications/call_detail_record.html), [recordings](https://docs.fusionpbx.com/en/latest/applications/call_recordings.html), [Genesys playback](https://help.genesys.cloud/articles/work-with-an-interaction-overview/), [Amazon contact search](https://docs.aws.amazon.com/connect/latest/adminguide/contact-search.html) | Search→detail→permission-aware media; call segments and access boundaries matter. |
| Agent context and wrap-up | [Amazon workspace](https://docs.aws.amazon.com/connect/latest/adminguide/agent-user-guide.html), [Genesys ACW](https://help.genesys.cloud/?p=2724), [NiCE calls](https://help.nice-incontact.com/content/agent/cxoneagent/handlecallsincxa.htm) | Context remains beside controls; ending the voice leg need not complete the work item. |
| Enterprise cross-check | [Avaya ACW](https://documentation.avaya.com/en-us/home/bundle/avaya-experience-platform-connect/usingworkspacesexperienceplatformconnect/after-contact-work.html), [Cisco Finesse calls](https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/cust_contact/contact_center/WebexCCE/End_User_Guides/wxcce_b_finesse-desktop-ug/agent_tasks.html) | Confirms configurable wrap-up and separate consultation. Different product/runtime generations; no blanket parity claim. |

## Visual inspection record

| Public reference inspected in the browser | Visible design observation | Evidence ceiling |
| --- | --- | --- |
| [3CX Web Client — Making & Managing Calls](https://www.3cx.com/user-manual/web-client/#h.37wyccmn2cn1) | Documented screenshots place calling controls in a compact upper-right dialer, with team/call navigation separate. | Official article screenshots; no authenticated calling tested. Do not reproduce its colors, logo or glyphs. |
| [FusionPBX Active Call Center](https://docs.fusionpbx.com/en/latest/status/active_call_center.html) | Queue list first, then agent table above current callers; columns distinguish login status and call state. Queue counts and per-call actions remain adjacent. | Page footer updated 17 October 2026; screenshot build not stated. |
| [Amazon agent workspace](https://docs.aws.amazon.com/connect/latest/adminguide/agent-user-guide.html), magnified official image | Persistent status/contact column on the left, active interaction beneath, customer profile/cases across the main area. | Image still contains an older knowledge-product label; structural reference only, not verified latest visual styling. |
| [Aircall call flow](https://support.aircall.io/en-gb/articles/10375394403101) | Text specifies node insertion, right-side settings and a top-right Publish action. | Article read in browser; embedded animation could not be retrieved, so its pixels were **not** verified. |
| Genesys and NiCE guides above | Official step sequences and screenshot locations were inspected through documentation. | Genesys direct image retrieval failed. No claim that visual pixels or live controls were tested. |

[FusionPBX release notes](https://fusionpbx.com/release_notes.php) identify 5.6, released 19 September 2026, including newer selection/search and operator-panel work. The legacy-looking images in public manuals must not be treated as an exact 5.6 UI audit. Reinspect the deployed version before adopting a detailed interaction.

## Research limits and selection conclusion

Use **3CX and FusionPBX/FreePBX** to establish PBX concepts; **Aircall and 3CX** for approachable calling; **Genesys, NiCE and Amazon Connect** for operational state detail; **Zoom** for queue drill-down. Keep Avaya/Cisco as enterprise cross-checks and Talkdesk/Five9/Dialpad/RingCentral as targeted alternatives when the product brief narrows. This is a defensible reference set, not proof of a universal “best app.”

The next uncertainty to resolve is ten98's first operator persona and backend call-state contract. Public imagery cannot settle retry safety, recording policy, routing compatibility or performance. Those decisions belong to the human and parent design-system session with the VoIP application owner.
