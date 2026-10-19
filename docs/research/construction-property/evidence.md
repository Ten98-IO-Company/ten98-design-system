# Construction and Property: competitor evidence

Research snapshot: **19 October 2026**. Initial scope: the `ten98-construction` and `ten98-property` rows in [the current ten-tool coverage table](../../UX-PATTERNS.md#coverage-for-all-ten-tools). Read alongside [flow proposals](flows.md) and [decisions to review](recommendations.md).

This is desk research of public documentation, illustrated help and user reviews. No authenticated products, live construction sites, tenant records or physical devices were tested. No feature proposal in these files is an accepted requirement. The human and parent design-system session decide shared UX; the application teams implement product behavior. Campaign remains the source for logo, icons and login patterns.

## Categories and selection method

| Category | Scope | Reference selection |
| --- | --- | --- |
| Construction execution and commercial controls | Projects, plans, schedule, inspections, procurement, quantities, budgets, approvals, field synchronization | Procore and Autodesk Build for broad workflows; Fieldwire for field execution; Buildertrend for residential scheduling |
| Property operations | Portfolio/property/unit records, tenancy, maintenance and operational permissions | Buildium for record/work-order flow; AppFolio for resident/vendor communication; DoorLoop for guided property setup; Yardi/Entrata as enterprise comparison candidates |
| Connected buildings | Location/device organization, authorization, commissioning, controls and automation | Home Assistant for heterogeneous operations and diagnostics; Apple Home for occupant controls; ETS for professional KNX commissioning |

The shortlist combines scope fit, independent review evidence, adoption evidence and inspectable task documentation. It is **not a numeric universal league table**. Broad rankings cannot establish that one product has the best inspection, lease or device-control flow. SaaS property operations and building automation are distinct markets. KNX, Zigbee and Matter are protocols/standards, not competing property-management applications.

[G2's methodology](https://documentation.g2.com/docs/research-scoring-methodologies?isappinstalled=0) combines review-derived satisfaction with market-presence signals, including review volume, employees/revenue and web presence. Reviews are weighted and age; category-normalized scores are different from star ratings. Neither is measured market share. [Capterra's Shortlist methodology](https://insights.capterra.com/shortlist) combines ratings and popularity. Its audience and category boundaries differ. Incentivized reviews and vendor-recruited reviews appear on these sites; individual accounts identify hypotheses, not prevalence in ten98 users.

## Construction candidate inventory

Ratings below are out of five. The opened [G2 construction category snapshot](https://www.g2.com/categories/construction-project-management), marked updated 16 October 2026, supplied the first six rows. Search snippets exposed different counts; the opened snapshot is retained rather than blending dates. Placement here is our research selection, not a claim about rank order.

| Candidate | Rating / reviews | Fit and disposition |
| --- | --- | --- |
| Procore | 4.6 / 4,314 | Primary: commercial project execution, inspections, commitments |
| Autodesk Forma / Build, formerly Construction Cloud | 4.4 / 5,464 | Primary: plan/model-linked information and cost/change controls |
| Fieldwire by Hilti | 4.5 / 579 | Primary: plan/task context and field work |
| Bluebeam | 4.6 / 484 | Specialist reference candidate: markup and takeoff, not the whole app |
| Revizto | 4.6 / 327 | Specialist candidate: model coordination; not needed for the first shared primitives |
| Oracle Aconex | 4.5 / 199 | Enterprise comparison candidate: multi-party document control |
| Buildertrend | 231 reviews; rating not captured | Secondary: homebuilder/remodeler scheduling and client views; [G2 seller profile](https://www.g2.com/sellers/buildertrend-solutions) |
| JobTread | 4.9 / 143 | Small-contractor comparison candidate; [Capterra category snapshot](https://www.capterra.com/construction-management-software/) |
| Houzz Pro | 4.3 / 1,088 | Residential/design-build comparison candidate; same Capterra snapshot |
| ServiceTitan | 4.3 / 340 | Trade/service operations adjacent candidate; same Capterra snapshot; do not substitute service dispatch for general construction execution |

The Capterra snapshot lists Procore at 90/100, JobTread, ServiceTitan and Houzz Pro at 86, and Autodesk at 85. Its [September 2026 review analysis](https://www.capterra.com/resources/best-construction-management-software-reviews-analysis/) uses a two-year review window, construction-specific category fit and a minimum review floor. This supports including smaller-contractor references without treating their raw stars as directly comparable with enterprise platforms.

Selected review observations:

| Evidence | What it supports | Limitation |
| --- | --- | --- |
| [Fieldwire G2 reviews](https://www.g2.com/products/fieldwire-by-hilti/reviews?page=9&qs=pros-and-cons): Joe S., foreman, 7 July 2026, values access to office files but reports missing new-file alerts; David G. reports delays between iPad and web | Make revision availability and synchronization observable | Individual reports; no reproduction or failure rate measured |
| [Fieldwire review page 4](https://www.g2.com/products/fieldwire-by-hilti/reviews?hid=8DDBA78FCB0ED8D889341EB2D001E448&page=4&wordfence_lh=1): validated, incentivized construction reviewer, 30 June 2026, distinguishes short lookahead tasks from a whole 12–18 month schedule | Separate field commitments from master scheduling | Anecdote, not proof the current product lacks every scheduling capability |
| [Procore review snapshot](https://www.g2.com/products/procore/reviews?partner_key=JeanFran%C3%A7oisTOURELpage%2F4%2F&utm_c2525252520ontent2525252520ontent%5B2525252520ontent%5D=88677939&utm_medium%E2%80%A6=undefined&utm_s%252525E2%25252580%252525A6=%5Bobject%2BObject%5D&utm_s%E2%80%A6=%5Bobject%2BObject%5Dpage%2F2%2F): Matthew H., 29 April 2026, values current drawings and linked change/budget information; Carina V., 23 April 2026, reports slow bid-package navigation | Preserve connected context while minimizing repeated page switching | Retrieved search-index snapshot, not a live performance benchmark; long URL is the actual returned source |

## Property operations candidate inventory

First six rows use the opened [G2 residential category](https://www.g2.com/categories/residential-property-management), updated 13 October 2026. These are review-community signals, predominantly relevant to property managers; they do not establish suitability for Dubai/UAE tenancy, commercial leases or smart-building operations.

| Candidate | Rating / reviews | Fit and disposition |
| --- | --- | --- |
| AppFolio | 4.6 / 1,171 | Primary: resident and vendor lifecycle/status communication |
| Entrata | 4.6 / 821 | Enterprise multifamily comparison candidate |
| Innago | 4.8 / 703 | Small-landlord simplicity comparison candidate |
| ResMan | 4.8 / 452 | Multifamily operations comparison candidate |
| Yardi Breeze | 4.1 / 372 | Smaller-operator comparison candidate |
| Yardi Voyager | 4.2 / 258 | Enterprise portfolio comparison candidate |
| Buildium | 4.4 / 285 | Primary: records, leases and work orders; [G2 profile](https://www.g2.com/sellers/buildium) |
| DoorLoop | 4.8 / 254 | Secondary: guided property setup; [G2 profile](https://www.g2.com/sellers/doorloop) |

[DoorLoop's G2 profile](https://www.g2.com/sellers/doorloop) includes Miguelina P.'s validated organic review dated 7 October 2026, describing time saved by combining maintenance, communication and collections. [Buildium's profile](https://www.g2.com/sellers/buildium) includes Jessica C.'s incentivized review of 13 October 2026, valuing organization, reporting and the tenant interface. These support connected task context as a hypothesis. They do not justify adding AI, payments or tenant screening to the current matrix.

The G2 category's **AI-generated review summaries**, not newly conducted interviews, identify customization/reporting frustrations for AppFolio and learning/navigation difficulty for Voyager. The design implication is to validate real task retrieval and state visibility with ten98 users, rather than copying a large incumbent's complete menu.

## Share and adoption: what the numbers mean

| Source and period | Observed number | Interpretation and limitation |
| --- | --- | --- |
| [Procore Q2 2026 release](https://investors.procore.com/news/news-details/2026/Procore-Announces-Second-Quarter-2026-Financial-Results/default.aspx), 30 June 2026 | 2,871 organic customers above $100,000 ARR | Vendor-disclosed enterprise-adoption proxy. It omits smaller customers and is not a market denominator. |
| [AppFolio Q2 2026 SEC exhibit](https://www.sec.gov/Archives/edgar/data/1433195/000143319526000056/appfq22026exhibit991.htm), 30 June 2026 | 9.6 million units under management | Company-reported unit count, not active-user count, customer count or global share. |
| [Buildertrend newsroom](https://buildertrend.com/press-releases/) | More than one million all-time users | Vendor cumulative claim; not monthly activity or installations. |
| [6sense AppFolio technographics](https://6sense.com/tech/property-management/appfolio-market-share), accessed snapshot | AppFolio 6.58%, 11,629 customers/domains; Yardi Genesis 10.71%; Entrata 10.68%; Voyager 8.85%; Buildium 4.77% | The source labels these estimated shares within its tracked technology category. The category also includes hospitality/other tools. Detection population and overlapping product labels prevent treating these as share of all properties, revenue or deployments. |
| [Datanyze Appfolio Property Manager](https://www.datanyze.com/market-share/real-estate-property-management--428/appfolio-property-manager-market-share), accessed snapshot | 3.59%, 2,445 current websites; a separate AppFolio entry has 13.61%, 9,271 websites; Yardi 16.62% | Website-level technographics with different taxonomy. The two AppFolio labels are not safely additive. Disagreement with 6sense is material; no blended percentage is calculated. |
| [Global Market Insights construction report](https://www.gminsights.com/industry-analysis/construction-management-software-market), 2025 estimate | Reports Procore 17.4% and Autodesk 12.4% of global category revenue | Analyst estimate, not independently replicated measurement. Public excerpt lacks sufficient allocation detail to validate vendor-specific scope. Retained as low-confidence context, not the shortlist's deciding factor. |

**No verified, comparable global market-share measurement was established across these products.** Available revenue estimates, tracked domains, vendor customer counts and review presence are distinct evidence types.

## Connected-building candidates and owner-named references

| Reference | Role | Adoption evidence and limitation |
| --- | --- | --- |
| Home Assistant | Primary mixed-device integration, organization and automation reference | [Voluntary analytics](https://www.home-assistant.io/integrations/analytics) and [dashboard](https://analytics.home-assistant.io/) are opt-in. No dependable live total was captured. |
| Apple Home / HomeKit | Home is the app; HomeKit is its accessory ecosystem | No current active-home denominator verified. Apple handset share would be an invalid substitute. [Setup guide](https://support.apple.com/en-nz/guide/iphone/iph125110541/ios) |
| KNX / ETS | KNX standard and ETS planning/commissioning application | [KNX's 2025 history](https://www.knx.org/news/knxis35-knx-history-and-evolution) reports 500+ manufacturer members, 8,000+ products and 135,000+ certified installers. Association ecosystem counts, not building share. |
| Matter | Interoperability protocol; actual controller UI is the reference | [CSA overview](https://csa-iot.org/all-solutions/matter/) and [certification directory](https://csa-iot.org/csa-iot_products/) do not establish active deployment share or every controller's supported capabilities. |
| Zigbee / Home Assistant ZHA | Zigbee is a mesh protocol; ZHA provides the application flow | [CSA](https://csa-iot.org/all-solutions/zigbee/) claims more than a billion devices/chipsets; ambiguous measures and no denominator. Use as broad adoption evidence only. |

No defensible cross-platform review league table was found for this heterogeneous group. Selection is based on the owner's named integrations and documented flow fit, not invented ratings.

## Visual reference register

These links point to the publisher's examples; assets have not been copied into the MIT package. Observation means public documentation/screenshot inspection, not a completed live product task.

| Source | What was inspected / useful visual reference | Limit |
| --- | --- | --- |
| [Fieldwire Plans](https://help.fieldwire.com/hc/en-us/articles/360018233192-Introduction-to-the-Plans-tab-Web) | Browser-inspected grid/list screenshots: persistent project navigation, task-relevant toolbar, sheet rows grouped by folder, view toggle, filter/version controls | Documentation screenshot; use interaction hierarchy, not brand colors or assets |
| [Fieldwire measurement](https://help.fieldwire.com/hc/en-us/articles/211449806-How-to-use-the-measurement-and-calibration-tools) | Illustrated calibration and measurement tools | Scale and output units need explicit validation in ten98 |
| [Autodesk budget](https://help.autodesk.com/cloudhelp/ENU/Build-Cost/files/budgets-and-contracts/Cost_Work_with_Budgets.html) and [approvals](https://help.autodesk.com/cloudhelp/ENG/Build-Cost/files/collaborate/Cost_Approval_Workflows.html) | Official annotated table, edit mode, detail flyout and reviewer-step diagrams | Documentation evidence; no cost engine or workflow was executed |
| [DoorLoop property creation](https://support.doorloop.com/en/articles/6085796-add-a-new-property) | Browser-inspected property-type screenshot: compact progress trail, descriptive choices, subtype radio cards, one main continuation action | Do not copy its mixed-use duplication workaround or require accounting setup before a ten98 record can exist |
| [Buildium work orders](https://help.buildium.com/hc/s/article/How-to-use-work-orders) | Public article read in browser; task-linked work order and status flow | [Product tour](https://www.buildium.com/lite-demo-video/) required a contact form; not submitted. No claim of inspecting the gated tour |
| [Home Assistant areas](https://www.home-assistant.io/docs/organizing/areas/), [card features](https://www.home-assistant.io/dashboards/features/), [automation testing](https://www.home-assistant.io/docs/automation/testing/) | Official illustrated organization, capability controls and trace surfaces | Documentation review; not a hardware or accessibility audit |
| [Apple scenes/automation](https://support.apple.com/en-nz/102313), [ETS commissioning tutorial](https://www.knx.org/news/ets6-and-knx-virtual) | Illustrated short scene creation and professional commissioning stages | ETS tutorial images date to 2021; do not infer current pixel-level UI fidelity |

## Evidence conflicts and unobserved areas

- Procore's old `schedule` documentation explicitly calls itself legacy. The current `scheduling` tutorial is used for view behavior in [flows](flows.md).
- Apple generic setup and its [7 May 2026 Matter article](https://support.apple.com/en-ca/102135) differ on hub prerequisites: some supported iPhones can perform local pairing/control without a hub; remote use and automation have different requirements. Let the integration return capability-specific prerequisites.
- AppFolio's [vendor guide](https://www.appfolio.com/help/vendor-portal) describes a Completed group, but its FAQ also says completed work orders disappear immediately. Preserve this conflict; do not infer retention behavior without product verification.
- Current reviews, docs and search indexes can show different counts, names or capabilities. Dates and retrieval limitations are retained rather than silently harmonized.
- Commercial tenancy/accounting jurisdiction, critical-path calculations, offline conflict resolution, protocol compatibility and actual command acknowledgement remain application requirements to validate. None is established by an attractive screenshot.
