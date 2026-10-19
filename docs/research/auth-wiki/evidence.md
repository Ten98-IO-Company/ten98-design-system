# Auth and Wiki reference evidence

Research snapshot: **19 October 2026** (Asia/Dubai). Initial scope: the `ten98-auth` and `ten98-wiki` rows in [the ten-tool coverage table](../../UX-PATTERNS.md#coverage-for-all-ten-tools). Status: research and proposals for the human owner and parent design-system session; no feature is approved by this document.

## Method and limits

This is desk research of public official documentation, published product screenshots and independent review platforms. No customer tenant, account creation, live authentication, provisioning, destructive action or private data was used. “Observed” below means documented behavior unless a visual inspection is explicitly identified. Proposed states and accessibility behavior in [flows.md](flows.md) are ten98 design requirements for review, not claims that competitors implement them.

Shortlisting uses four separate signals: fit to the matrix, independently reviewed usage, public adoption evidence, and quality of task-level documentation. There is no invented composite score. G2's category Grid combines satisfaction and market presence; its reviews are moderated but remain a self-selecting sample. Product-wide ratings do not validate an individual flow. Several visible G2 reviews are labelled incentivized and seller-invited. Counts differ between indexed/localized pages; values below use the direct English product page accessed on the snapshot date unless noted. [G2 category methodology](https://www.g2.com/categories/single-sign-on-sso), [G2 review process](https://www.g2.com/products/auth0/reviews).

## Identity category and shortlist

Three related markets must remain distinguishable: workforce IAM/directory administration, application/customer identity (CIAM), and self-hosted identity providers. Device management overlaps `ten98-monitor`; `ten98-auth` should explain identity and access relationships without silently becoming a second fleet console.

| Candidate | Fit and independent evidence | Adoption/share evidence | Reference decision |
| --- | --- | --- | --- |
| **JumpCloud** — owner reference | Workforce directory, user lifecycle and resource assignment. G2 **4.5/5, 4,121 reviews**, page modified 2026-10-19. [Reviews](https://www.g2.com/products/jumpcloud/reviews) | Review volume is a usage signal, not installed share. Its broader endpoint scope changes the reviewer mix. | Primary reference for people/group/resource relationships and pending lifecycle changes. |
| **Microsoft Entra ID** | Enterprise workforce identity. G2 **4.5/5, 915 reviews**, page modified 2026-10-17; highlighted in G2 enterprise SSO Grid. [Reviews](https://www.g2.com/products/microsoft-entra-id/reviews), [Grid](https://www.g2.com/categories/single-sign-on-sso/enterprise) | Bundling and enterprise footprint cannot be converted into a ten98-relevant market percentage from this evidence. | Primary reference for policy impact, simulation and investigative detail. |
| **Okta Workforce Identity** | Workforce access/lifecycle. Gartner Peer Insights vendor page reports this product at **4.6/5, 874 reviews in the Access Management category**; this is not the vendor-wide 1,710-review aggregate or the separate IGA sample. [Category-labelled review counts](https://www.gartner.com/reviews/vendor/okta) | Public financial reporting establishes commercial scale, but company revenue includes multiple products and is not workforce-IAM share. [Q2 FY2027 results](https://investor.okta.com/financials/quarterly-results/default.aspx) | Primary comparison for explicit suspend/deactivate/delete consequences and asynchronous offboarding. |
| **Auth0** — owner reference | Developer/application identity and CIAM. G2 **4.3/5, 286 reviews**, English page modified 2026-10-16. [Reviews](https://www.g2.com/products/auth0/reviews) | Part of Okta; adding Auth0 and Okta figures would double-count company presence. | Primary reference for application setup, login/connection separation and recovery. |
| **authentik** — owner reference | Self-hosted provider and visual authentication flows. No comparable verified-review score was retrievable from the attempted G2 product page. | Official repository shows **26.0k stars / 2.1k forks**, rounded snapshot counts. Developer interest, not deployments or market share. [Repository](https://github.com/goauthentik/authentik) | Primary self-hosted application/provider wizard and flow/binding reference; use enterprise boundaries explicitly. |
| **Keycloak** — owner reference | Self-hosted realms, federation, sessions and roles. Attempted G2 product URL redirected to the generic SSO category; no product rating is claimed. | Official repository shows **37.4k stars / 9.1k forks**, rounded snapshot counts. [Repository](https://github.com/keycloak/keycloak) | Primary reference for session scopes and realm/client/user distinctions. |

These are the strongest **reference candidates by task**, not a universal market ranking. The public listing for IDC's *Worldwide Identity and Access Management Software Shares, 2025*, published 29 September 2026, identifies a paid market-share study but does not expose the vendor percentages. No comparable, independently measured vendor share was available in the inspected public material. The report listing is evidence of the gap, not evidence that one shortlisted product leads share. [IDC report listing](https://www.marketresearch.com/IDC-v2477/Share-Worldwide-Identity-Access-Management-46450244/).

## Identity review themes and implications

| Evidence read | Interpretation for ten98 — proposal |
| --- | --- |
| An Auth0 reviewer dated 14 October 2026 praises documentation/integration but reports an overwhelming first-use dashboard; another dated 5 August reports advanced configuration complexity. Both are marked incentivized/seller-invited. This is a small qualitative sample, not prevalence. [Auth0 reviews](https://www.g2.com/products/auth0/reviews) | Stage application setup by task and show advanced options progressively. Keep examples near fields. |
| JumpCloud reviews dated 10 August and 14 May 2026 describe centralized onboarding benefits alongside confusing navigation and awkward user/group/device binding. [Visible review sample](https://www.g2.com/products/jumpcloud/reviews?page=2) | Make assignment direction and resulting access explicit. Provide a readable relationship list before considering a graph. |
| G2's Entra page gives a large independent sample, while its SSO category groups Entra with materially different products. [Entra reviews](https://www.g2.com/products/microsoft-entra-id/reviews) | Use the review signal to justify inspection, not to copy the entire portal or its navigation complexity. |

## Identity visual and flow references

All links accessed 19 October 2026. Published documentation can contain older screenshots than the current release.

| Reference surface | What to study | Observation and caveat |
| --- | --- | --- |
| [Auth0 application settings](https://auth0.com/docs/get-started/applications/application-settings#basic-information) | Section label beside stacked fields; immutable identifiers; adjacent copy/reveal controls; separate application URI section and advanced settings | Official embedded Basic Information screenshot visually inspected in browser. Direct image expansion was blocked by the browser; only the inline specimen was inspected. It is an older illustration, not proof of current tenant pixels. |
| [authentik application wizard](https://docs.goauthentik.io/add-secure-apps/applications/manage_apps/) | Identity → provider → settings → bindings → review; application visibility versus access | Current documentation visually read; version selector showed 2026.8. No live wizard tenant was accessed. |
| [Keycloak session administration](https://www.keycloak.org/docs/latest/server_admin/#_user-session-management) | Resource-context session tables and scoped logout/revocation controls | Official guide includes session screenshots. Flow documented; no live realm inspected. |
| [JumpCloud lifecycle states](https://jumpcloud.com/support/manage-user-states) | User-state action menu, scheduled-change affordance, immediate versus scheduled action | Official steps and screenshots. Device/external-directory exceptions matter more than copying the menu labels. |
| [Entra What If](https://learn.microsoft.com/en-us/entra/identity/conditional-access/what-if-tool), [report-only](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only) | Scenario inputs beside outcome/explanation; policy state always visible | Official documented evaluation flow. What If omits service dependencies; report-only can still cause device-certificate prompts. Do not describe either as comprehensive or side-effect-free. |

Preserve Campaign's existing `AppBrand`, `AppIcon` and login composition. References above inform hierarchy and interaction, not replacement branding or imported competitor assets. Do not adopt a competitor's visible sidebar scrollbar: ten98 navigation remains scrollable with its scrollbar hidden and a complete keyboard path.

## Identity edition and architecture boundaries

authentik's current pricing separates open-source protocol support from enterprise features such as scheduled offboarding, some directory integrations, enhanced audit logging and CSV exports. Keycloak's repository is Apache-2.0; this research does not copy its code. Auth0, Okta, JumpCloud and Entra commercial consoles are behavioral references, not dependencies selected for ten98. Plan-specific features must be checked when implementing an integration. [authentik pricing](https://goauthentik.io/pricing/), [enterprise documentation](https://docs.goauthentik.io/enterprise/), [Keycloak repository](https://github.com/keycloak/keycloak).

Use current names: Microsoft Entra ID for workforce identity; Entra External ID for its customer-identity offering. Azure AD B2C is unavailable for new purchases since 1 May 2025, so old B2C screenshots should not be the default new-product reference. [Microsoft product guidance](https://learn.microsoft.com/en-us/entra/external-id/customers/faq-customers).

## Wiki category and shortlist

| Candidate | Category and fit | Independent review / ranking signal | Adoption or share signal | Why retain / limitation |
| --- | --- | --- | --- | --- |
| **Docmost** | Self-hosted collaborative documentation; closest match to the owner's named baseline | No sufficiently comparable independent review score/count was verified in this research. Do not rank its UX by an invented review average. | [Official GitHub](https://github.com/docmost/docmost) displayed approximately **22.0k stars**; the public website's live badge showed 22,032 during browser observation. Developer interest proxy only. | Primary space/page/editor reference. Edition boundaries materially affect what is available. |
| **Notion** | Broad cloud workspace with nested pages and structured databases; broad knowledge-worker fit | [G2 product profile](https://www.g2.com/products/notion/reviews): **4.6/5, 13,865 reviews**, profile metadata dated 7 Oct 2026. [G2 knowledge-base category](https://www.g2.com/categories/knowledge-base-software) includes Notion among its top-rated products. | Vendor announced **100 million users in Aug 2024**, [published 3 Sep 2024](https://www.notion.com/blog/100-million-of-you). Historical cumulative-user claim, not current active users, organizations, wiki seats or market share. | Strong navigation/search reference; databases and AI broaden the product beyond the current matrix. |
| **Atlassian Confluence** | Enterprise team documentation and Atlassian-integrated knowledge work | [Correct Atlassian G2 product profile](https://www.g2.com/products/confluence/reviews): **4.1/5, 4,369 reviews**, metadata dated 17 Oct 2026; included in the same G2 category's top-rated set. | [6sense](https://6sense.com/tech/knowledge-management/atlassian-confluence-market-share) labels Confluence **3.22%** of its Knowledge Management category. This category also contains Wix at 75.83% and Zendesk at 8.04%; it is an unsuitable denominator for internal collaborative wikis. Record the published estimate, but **exclude it from shortlist weighting**. | Review/history reference with substantial review volume. Do not confuse it with the unrelated StatPro/Confluence financial-software G2 listing. |
| **Outline** | Team knowledge base, real-time document collaboration and collections | No comparable current independent score/count verified. | [Official repository](https://github.com/outline/outline): approximately **41.0k stars**, a developer-interest proxy. Repository identifies **BSL 1.1**, not MIT. | Strong focused-writing and history reference; cloud/licensed features must be distinguished from self-hosted availability. |
| **BookStack** | Self-hosted structured documentation organized as books, chapters and pages | [G2](https://www.g2.com/products/bookstack/reviews): **3.5/5 from 1 review**, review dated 18 Dec 2023; indexed snapshot was older than the research date. This is far too small and old a sample for a robust ranking. | [GitHub mirror](https://github.com/BookStackApp/BookStack): approximately **19.1k stars**; now explicitly points to **Codeberg**. Historical cross-host developer interest, not installations. | Useful contrast: predictable fixed hierarchy and mature permission explanations. Do not impose that hierarchy on an arbitrarily nested page requirement. |
| **Wiki.js** | Self-hosted technical wiki with configurable editors, search and administration | No comparable current independent score/count verified. | [requarks/wiki](https://github.com/requarks/wiki): approximately **29.1k stars**. It now identifies the default repository as **3.0 beta**, and links [wiki-v2](https://github.com/requarks/wiki-v2) as the stable 2.x project. Stars span project history; they do not measure beta adoption. | Secondary permissions/admin reference. Keep stable 2.x docs separate from 3.0 beta claims. |

### How to interpret the review evidence

G2 says it validates reviewer identity and moderates reviews. Its product pages label some reviews as incentivized, seller-invited or organically submitted; the category spans more than internal wikis. Scores are self-selected buyer feedback, not controlled usability tests or usage telemetry. Review totals and product metadata can differ across G2 pages; the table uses the named product-profile snapshots rather than silently combining counts.

Two concrete qualitative signals inform hypotheses rather than prevalence claims:

- A **1 Oct 2026 Notion reviewer** praises flexible organization and a clean interface, while describing growing nested workspaces and larger pages as harder to navigate. Implication to test: keep tree context, search scope and meaningful page metadata visible. [Notion review source](https://www.g2.com/products/notion/reviews).
- A **7 Sep 2026 Confluence reviewer** values attached discussions and version history, but reports stale/duplicate search results and cumbersome large tables. A **15 May 2026 reviewer** reports difficulty auditing granular permissions. Implication to test: expose freshness, distinguish duplicates by path, and explain effective access. These are individual accounts, not evidence that every Confluence deployment behaves this way. [Confluence review source](https://www.g2.com/products/confluence/reviews).

The low-volume [BookStack review](https://www.g2.com/products/bookstack/reviews) values simplicity but asks for better aesthetics; one review cannot establish a design trend. A [Wiki.js user discussion](https://github.com/requarks/wiki/discussions/6998) illustrates difficulty finding page-rule settings in the group administration area. That dated support question is a discoverability example, not a current bug report.

## Wiki edition and implementation boundaries

Docmost's [license/editions documentation](https://docmost.com/docs/editions) distinguishes AGPL-3.0 Open Source from commercial Business and Enterprise. Its [current introduction](https://docmost.com/docs/) lists attachment full-text search, comment resolution, disabling public sharing, granular page permissions, AI, API, SSO/LDAP/SCIM/MFA and verification among paid capabilities. The [pricing page](https://docmost.com/pricing) places verification/review workflows and audit/SIEM functionality in Enterprise; read confirmation has a **coming-soon marker**. Do not call that last feature shipped. The pricing comparison table's tick icons are not preserved in text extraction, so use the explicit prose and dedicated feature pages for edition claims.

The owner's aspiration to rebuild enterprise capability is a product direction. It does not make every newly discovered capability an approved first-release requirement. The current matrix explicitly covers documents, collaboration, search, revision integrity, access, rich text, trees, inline comments and comparison. Databases, AI agents, workflow verification, read receipts and migration integrations require separate prioritization.

[Outline history documentation](https://docs.getoutline.com/s/guide/doc/revision-history-AiL6p22Ssq) separates ordinary history/restore from **revision naming/deletion**, which it labels cloud/licensed-only. [Notion history documentation](https://www.notion.com/help/duplicate-delete-and-restore-content) varies retention by plan: 7 days Free, 30 Plus, 90 Business and unlimited Enterprise; detailed comparison is unavailable on mobile. These are product constraints to study, not recommended ten98 pricing gates.

No source code was copied. These research notes do not change the MIT license of the shared design system, nor establish that upstream AGPL/commercial/BSL code can be relicensed as MIT.

## Wiki visual-reference index and limits

These URLs link to official imagery or flow documentation for the parent to inspect during design review. Images remain with their publishers; no third-party screenshot assets were added to the shared library.

| Reference | Inspect for | Evidence level |
| --- | --- | --- |
| [Docmost homepage](https://docmost.com/) | Tree/editor/comments pane balance and page action placement | Public product screenshot visually inspected in browser on research date |
| [Docmost Spaces](https://docmost.com/docs/user-guide/spaces) | Space settings and export dialogs | Official help screenshots and documented steps |
| [Notion subpages](https://www.notion.com/help/create-a-subpage) | Sidebar expansion and breadcrumbs | Official screenshot/guide; no authenticated app testing |
| [Notion search](https://www.notion.com/help/search) | Filter controls, result refinement and command-search actions | Official guide and imagery |
| [Notion history](https://www.notion.com/help/duplicate-delete-and-restore-content) | Highlighted edits and restore preview | Official guide and imagery; plan/mobile limitations documented |
| [Outline document permissions](https://www.getoutline.com/changelog/document-permissions) | Compact sharing/member controls | Dated official changelog screenshot; verify current details before pixel-level design |
| [Outline collection menu](https://docs.getoutline.com/s/guide/doc/collections-l9o3LD22sV) | Collection management and default access | Official help screenshot/guide |
| [Outline resolved comments](https://www.getoutline.com/changelog/comment-resolution) | Active/resolved thread recovery | Dated official screenshot/behavior description |
| [Confluence comments](https://support.atlassian.com/confluence-cloud/docs/comment-on-pages-and-blog-posts/) | Selected-text action and inline discussion | Current official documentation with visual examples |
| [BookStack content comments](https://www.bookstackapp.com/blog/bookstack-release-v25-05/) | Changed/deleted anchor indicators and thread archival | Dated primary release article with detailed images |
| [BookStack permissions](https://www.bookstackapp.com/docs/user/roles-and-permissions/) | Explicit content overrides and origin indicator | Official permission screenshot/guide |
| [Wiki.js groups](https://docs.requarks.io/groups) | Global permission versus page-rule explanation | Stable-2.x documentation; not 3.0 beta visual proof |

Remaining research gaps: authenticated hands-on editor interaction, concurrent/offline sessions, keyboard/screen-reader measurements, large-tree performance, current edition-specific verification flow and actual migration fidelity. The shortlist is sufficient to draft concrete shared UX proposals; none of those gaps should be described as tested behavior. The parent design-system session and owner decide the final flows and component contracts, and the Wiki app session implements product behavior.
