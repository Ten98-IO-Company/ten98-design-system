# Monitor and Server: reference evidence

Research date: **19 October 2026 (Asia/Dubai)**. Status: **recommendations for parent design-system session and human review; no feature decisions or implementation**.

Initial scope is the two relevant rows in [the current ten-tool coverage table](../../UX-PATTERNS.md#coverage-for-all-ten-tools), as confirmed by the owner. Shared UI contracts come from [COMPONENTS.md](../../COMPONENTS.md); brand and ownership boundaries come from [DECISIONS.md](../../DECISIONS.md). Read [flows.md](flows.md) for task sequences and [recommendations.md](recommendations.md) for proposed decisions.

## How references were selected

This is desk research using public product documentation, independently hosted user reviews, published rankings and adoption evidence. It is not an interview study or a controlled usability comparison. All links in these three files were accessed on 19 October 2026 unless a different observation date is explicit. Product documentation can change after this snapshot.

Selection is task-specific: first require a match to the matrix, then a documented workflow, then use independent reviews and adoption evidence to judge whether the product deserves comparison. An owner-named product remains in the inventory even when independent popularity evidence is weak. No synthetic numerical score combines incompatible categories.

| Category | Relevant task | Preferred reference set | Why this set |
| --- | --- | --- | --- |
| Observability investigation | Metrics, logs, traces, shared context | Grafana, Datadog; Dynatrace as comparison | Strong review coverage and concrete investigation documentation; different query and correlation approaches |
| Developer errors | Grouped issue to individual event and release context | Sentry, GlitchTip | Sentry supplies a mature investigation reference; GlitchTip supplies the owner's simpler self-hosted reference |
| Infrastructure monitoring | Hosts, problems, acknowledgement | Zabbix | Explicit operational state and action scope, with a current public manual |
| Uptime | Check setup, outage evidence, maintenance | Uptime Kuma, UptimeRobot; Better Stack as comparison | Owner's self-hosted choice plus independently reviewed hosted alternatives |
| Incidents | Ownership, escalation, timeline, resolution | Jira Service Management, PagerDuty | Operational incident workflows rather than treating a generic task board as an incident engine |
| Fleet and MDM | Device enrollment, inventory, policy and commands | Fleet, Intune, Jamf Pro; Iru as comparison | Open-source fit and separate cross-platform/Apple enterprise references |
| KVM/VM operations | Resource hierarchy, guest configuration, tasks, recovery | Proxmox VE; vSphere and Harvester as comparisons | Proxmox directly fits the owner's KVM scope; alternatives expose enterprise and Kubernetes-native tradeoffs |
| Container operations | Connect host, configure stack, deploy and inspect | Komodo, Portainer, Openship | Owner references plus a broadly reviewed management UI; distinct server, stack and application concepts |
| Kubernetes operations | Cluster/project scope, workload health and topology | OpenShift, Rancher | Relevant Kubernetes consoles with documented administration and workload flows |

**Openship and OpenShift are separate products.** The owner's Openship reference is the [Openship deployment platform](https://github.com/oblien/openship). OpenShift is an additional Kubernetes reference. Neither is silently substituted for the other. “Jira” is interpreted here as Jira Service Management for incidents; generic Jira project planning is a separate possible scope decision.

## User-review evidence: Monitor

These are broad product aggregates, not feature-level scores or a market-share ranking. Public G2 product pages were used over inconsistent cached category variants. Ratings are out of 5.

| Candidate | Rating / review count | Choice and limitation |
| --- | ---: | --- |
| [Grafana Labs](https://www.g2.com/products/grafana-labs/reviews) | 4.5 / 220 | Primary for investigation. Query and routing complexity also appears in the review sample. |
| [Sentry](https://www.g2.com/products/sentry/reviews) | 4.5 / 227 | Primary for error triage. Expanded navigation and alert tuning are tradeoffs. |
| [Zabbix](https://www.g2.com/products/zabbix/reviews) | 4.3 / 209 | Primary for host/problem operations; distinguish infrastructure problems from developer exceptions. |
| [Datadog](https://www.g2.com/products/datadog/reviews) | 4.4 / 740 | Primary comparison for correlated telemetry and live versus retained data. |
| [Dynatrace](https://www.g2.com/products/dynatrace/reviews) | 4.5 / 1,371 | Secondary for dependency/impact evidence; broad enterprise scope. |
| [New Relic](https://www.g2.com/products/new-relic/reviews) | 4.4 / 584 | Secondary for instrumentation onboarding. |
| [Elastic Observability](https://www.g2.com/products/elastic-observability/reviews) | 4.3 / 135 | Search-heavy candidate; not selected as the primary flow without deeper task validation. |
| [Honeycomb](https://www.g2.com/products/honeycomb/reviews) | 4.5 / 37 | Cohort comparison candidate; smaller sample and a possible new feature. |
| [UptimeRobot](https://www.g2.com/products/uptimerobot/reviews) | 4.7 / 327 | Primary simple-check/outage comparison. |
| [Better Stack](https://www.g2.com/products/better-stack/reviews) | 4.8 / 344 | Strong hosted candidate; small-business-heavy review sample and less detailed flow inspection here. |
| [Uptime Kuma](https://github.com/louislam/uptime-kuma/wiki) | Comparable independent aggregate not verified | Included for owner fit, public workflow documentation and adoption proxies. |
| [GlitchTip](https://glitchtip.com/documentation/) | Comparable independent aggregate not verified | Included for owner fit and simple error/uptime setup; no unsupported leadership claim. |

Two review themes inform the proposed design: Grafana reviewers on 15 October and 1 October 2026 describe flexibility alongside query-learning and notification-routing difficulty; Sentry's 2 September 2026 sample values error-to-trace context but reports navigation complexity. These are individual experiences, not population prevalence. The design implication is to preserve context and expose advanced options progressively, then test that hypothesis with ten98 users. [Grafana reviews](https://www.g2.com/products/grafana-labs/reviews), [Sentry reviews](https://www.g2.com/products/sentry/reviews).

## User-review evidence: Server

| Candidate | Public review/adoption snapshot | Reference decision |
| --- | --- | --- |
| [Proxmox VE](https://www.g2.com/products/proxmox-ve/reviews) | 4.6/5, 39 G2 reviews | Primary KVM match; smaller review sample. Feedback values flexibility but identifies advanced configuration expertise. |
| [VMware vSphere](https://www.g2.com/products/vmware-vsphere/reviews?page=10) | 4.5/5, 784 G2 reviews on an accessible paginated page; main page unavailable | Enterprise comparison for VM/task operations; pagination access is disclosed rather than claiming the main page was inspected. |
| [Portainer](https://www.g2.com/products/portainer/reviews) | 4.8/5, 298 G2 reviews | Primary Compose/console reference. Individual reviews value simple administration but identify log-viewing and backup-scope limitations. |
| [Komodo](https://github.com/moghtech/komodo) | 12.8k stars, 445 forks displayed; no comparable independent review aggregate verified | Owner fit and detailed public workflows. Repository interest is not installed base or satisfaction. |
| [Red Hat OpenShift](https://www.g2.com/products/red-hat-red-hat-openshift/reviews) | 4.5/5, 306 G2 reviews | Primary Kubernetes topology/investigation comparison. Broad integrated capabilities come with reported learning burden. |
| [SUSE Rancher](https://www.g2.com/products/suse-rancher/reviews?page=2) | 4.4/5, 165 G2 reviews | Primary multi-cluster navigation comparison. An older category page showed 160; use this product snapshot, not a merged total. |
| [Harvester](https://docs.harvesterhci.io/v1.7/vm/index/) | Comparable independent aggregate/share not verified | Secondary VM provisioning/recovery reference; versioned public docs justify inclusion. |
| [Openship](https://github.com/oblien/openship) | Comparable independent aggregate/share not verified | Owner-named application deployment and server-onboarding reference. Detailed official guides support flow analysis, not leadership claims. |
| [Cockpit](https://cockpit-project.org/blog/cockpit-121.html) | Comparable current aggregate/share not verified | Historical connectivity-rollback design reference only; the 2016 article is not a current-platform acceptance test. |

Proxmox [reported more than 2.3 million active VE servers in September 2026](https://proxmox.com/en/about/company-details/press-releases/proxmox-24-7-support-and-proxmox-north-america). That is a vendor installed-base claim, not a comparable market-share percentage. A current virtualization-share search result lacked an accessible underlying dataset; no percentage from it is used. The [CNCF survey report, figure 8](https://www.cncf.io/wp-content/uploads/2026/01/CNCF_Annual_Survey_Report_final.pdf), uses a 2025 chart sample of 351 with eligibility/exclusion rules; its Kubernetes figure does not establish any distribution's share.

Portainer's sampled reviews distinguish management-configuration backup from restoring Docker volumes. This supports requiring explicit recovery scope in ten98. OpenShift review examples value integrated RBAC and tooling while noting complexity for smaller teams. These are qualitative hypotheses, not statistical prevalence or proof of usability. [Portainer reviews](https://www.g2.com/products/portainer/reviews), [OpenShift reviews](https://www.g2.com/products/red-hat-red-hat-openshift/reviews).

## Rankings, methodology and adoption

### Fleet, incidents and topology review sample

| Candidate | Public review snapshot | Selection and adoption limit |
| --- | --- | --- |
| [Fleet](https://www.g2.com/products/fleet-device-management/reviews) | 5.0/5, 2 reviews | Very small sample; G2 says evidence is insufficient for buying insight. Exact owner fit and documented operations justify inclusion. |
| [Jamf](https://www.g2.com/products/jamf/reviews) | 4.7/5, 2,443 reviews | Broad Jamf listing, not only Jamf Pro. Its [about page](https://www.jamf.com/about/) reports 76,600+ organizations and 33.6m+ devices across the vendor. Neither is Jamf Pro market share. |
| [Microsoft Intune](https://www.trustradius.com/products/microsoft-intune/reviews) | 8.2/10, 328 ratings/reviews; 53 written reviews separately listed | Different platform/scale from G2. Do not substitute ratings for Intune Enterprise Application Management or EMS. |
| [Iru, formerly Kandji](https://www.g2.com/products/iru/reviews) | 4.7/5, 871 reviews | Current platform is broader than Apple MDM. Older Kandji guides are explicitly dated references; see [current product identity](https://www.iru.com/meet-iru). |
| [PagerDuty](https://www.g2.com/products/pagerduty/reviews) | 4.5/5, 979 reviews | Primary incident response comparison. [FY2026 results](https://www.pagerduty.com/newsroom/pagerduty-announces-fourth-quarter-full-year-fiscal-2026-financial-results/) report 35,000+ free/paid customers and 15,351 paid customers at 31 January 2026; vendor footprint, not incident-market share. |
| [Jira Service Management](https://www.g2.com/products/jira-service-management/reviews) | 4.3/5, 986 reviews | Owner-aligned incident/work-record reference. [60,000+ customers](https://www.atlassian.com/software/jira/service-management?category=changeManagement) is vendor-reported JSM-wide adoption, not incident-feature adoption. |
| [ServiceNow ITOM](https://www.g2.com/products/servicenow-it-operations-management/reviews) | 4.4/5, 495 reviews | Enterprise dependency/configuration-item comparison; suite-wide score does not validate its graph UI. |

The [enterprise MDM category](https://www.g2.com/categories/mobile-device-management-mdm/enterprise) also identifies NinjaOne and JumpCloud; the [incident category](https://www.g2.com/categories/incident-management) identifies Freshservice, Rootly and incident.io. Retain these as candidates if MSP/RMM or chat-led incident work becomes a decided requirement. Their detailed flows were not selected for this initial scope. Fleet's [automation guide](https://fleetdm.com/guides/policy-automation-run-script) reports 1,300+ organizations, a vendor adoption claim with no comparable denominator.

Qualitative hypothesis: Iru's 6 October incentivized review values blueprint mapping but describes intrusive forced updates; its 13 October organic review asks for multi-selection. Jamf review tags include learning difficulty alongside strong device-management feedback. Test batch selection and clear applied-versus-pending configuration in ten98; do not infer prevalence from these examples. [Iru reviews](https://www.g2.com/products/iru/reviews), [Jamf reviews](https://www.g2.com/products/jamf/reviews).

### What the ranking signals mean

| Source | Finding used | Interpretation and limit |
| --- | --- | --- |
| [G2 scoring methodology](https://documentation.g2.com/docs/research-scoring-methodologies) | Satisfaction and Market Presence are normalized within categories; review recency, quality and volume matter | Market Presence combines review and external business signals. It is not installed-base or revenue market share. Star ratings and Grid positions are different measures. |
| [G2 Observability category](https://www.g2.com/categories/observability-software?order=g2_score) | Identifies a competitive set including Datadog, Grafana, Sentry, Dynatrace and others | Category placement is useful shortlist evidence. It does not rank the quality of a trace waterfall, and dynamic pages may disagree with older cached counts. |
| [ISG 2026 observability buyers guide](https://research.isg-one.com/buyers-guide/information-technology/it-management-and-operations/it-observability-platforms/2026?hs_amp=true), 3 June 2026 | Evaluates 24 providers; overall leaders ServiceNow, Dynatrace and BMC. Product Experience is 80%, Customer Experience 20%. | Analyst capability/customer-experience ranking, not a user vote or measured share. Enterprise breadth explains why its leaders differ from the task-specific shortlist here. ServiceNow and BMC remain enterprise comparison candidates, not a requirement to reproduce their whole suites. |
| [Grafana 2026 survey](https://grafana.com/observability-survey/2026/) | 1,363 responses recruited through Grafana community and industry events; 38% cite complexity/overhead as biggest concern; 77% report time or money saved through centralization | Vendor/community sample, not a representative census. Supports testing a coherent investigation experience. Prometheus/OTel investment includes investigation and proofs of concept, so it is not deployed-product share. |
| [Uptime Kuma official wiki](https://github.com/louislam/uptime-kuma/wiki), figures dated 1 September 2026 | 90,810 stars; 186,441,310 aggregate Docker Hub/GHCR pulls | Interest and cumulative download proxies. Repeated pulls and updates are included; neither counts active customers. |
| [Datadog Q2 2026 results](https://investors.datadoghq.com/news-releases/news-release-details/datadog-announces-second-quarter-2026-financial-results/), 6 August 2026 | Approximately 4,720 customers with at least $100,000 ARR at 30 June 2026 | Vendor-reported adoption above one spending threshold, not total customers or category share. |
| [CNCF 2025 annual survey announcement](https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/), 20 January 2026 | 82% of surveyed container users run Kubernetes in production | Supports including Kubernetes tasks. It does not establish OpenShift or Rancher market share, or represent 82% of all organizations. |

No defensible comparable market-share table was verified across these mixed categories. Review counts, GitHub stars, downloads, vendor customer figures and survey adoption use different denominators. This research deliberately does not convert them into market-share percentages.

## Direct visual observation and limits

The public [Grafana Play Explore workspace](https://play.grafana.org/explore) was inspected in the browser on 19 October 2026 without sign-in. Observed: persistent product navigation and breadcrumbs, source/time controls above query rows, an outline rail, graph/table results, and a query inspector with Stats, Query, JSON and Data tabs. A demo Random Walk query produced a graph; the inspector reported request duration, query count and row count. These observations support an investigation layout, not a claim that real production ingestion, permissions or all source types were tested.

Official screenshot/doc references are linked in the flow catalogue. No competitor assets or source code were copied into the library. Campaign's logo, icon vocabulary and login pattern remain the visual baseline. Accessibility and narrow-screen behavior in the proposed flows are ten98 requirements; they are not claims that the competitor products passed an accessibility audit.

| Visually inspected official image | Specific observation | Version limit |
| --- | --- | --- |
| [Proxmox 9.2 datacenter dashboard](https://www.proxmox.com/images/proxmox/screenshots/Proxmox-VE-9.2-Datacenter-Dashboard.png) | Resource tree, adjacent context navigation, health/capacity summary, node table and persistent bottom task table | Published screenshot, not a live cluster test |
| [Proxmox 8.1 task viewer](https://www.proxmox.com/images/proxmox/screenshots/Proxmox-VE-8-1-VMware-ESXi-Guestimport-progress.png) | Named task with Output/Status tabs, Stop/Download and incremental output | Historical 8.1 image, not current 9.2 failure/cancellation validation |
| [Proxmox 8.1 VM wizard](https://www.proxmox.com/images/proxmox/screenshots/Proxmox-VE-8-1-VM-Wizard-with-VirtIO-driver-ISO.png) | General → OS → System → Disks → CPU → Memory → Network → Confirm; media controls and advanced disclosure | Historical visual sequence; app capabilities must determine ten98 steps |
| [Portainer Git deployment form](https://content.gitbook.com/content/MmwXfSb4bP3JyB8BLrAf/blobs/WG5OOxN0ldmYiaILQabQ/2.43-add-a-docker-source-git-repo.png) | Source/reference selection, Compose path with help, repeated additional paths and GitOps switch | Image labelled 2.43; current inspected documentation identifies 2.45 LTS |

The remaining fleet/incident visual links are documentation-backed references, not hands-on validated screens: [Intune compliance screenshots](https://learn.microsoft.com/en-us/intune/device-security/compliance/monitor-policy), [Fleet report walkthrough](https://fleetdm.com/guides/reports), [Tempo graph/table examples](https://grafana.com/docs/tempo/latest/metrics-from-traces/service_graphs/service-graph-view/) and [PagerDuty incident timeline documentation](https://support.pagerduty.com/main/docs/incidents). Direct access to PagerDuty's image CDN was blocked; no bypass was attempted.

A research helper's Komodo demo sign-in was rejected by automatic approval review because it did not accept delegated authorization for that login. No credentials were submitted. Public documentation and published images supplied the comparison instead. No authenticated destructive operations, enrollment, deployment or notification sends were performed in any competitor product.

Final consistency pass: the three report files contain 18 unique flow IDs, and all local Markdown links resolve. Current Sentry monitor/routing semantics, Fleet's two-review aggregate and Proxmox's September installed-base claim were re-opened successfully. Re-opening the OpenShift topology page timed out; its earlier documentation findings remain labelled as documentation evidence, with no claim of live validation. The pass did not repeat every external URL or become an exhaustive link crawler. Remaining source access limits are recorded above; research stops here.
