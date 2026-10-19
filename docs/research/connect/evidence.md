# ten98-connect: competitor evidence

Research snapshot: **19 October 2026**. Status: research for parent design-system session and owner review; no feature decisions or implementation authorized by this document. Initial scope is the `ten98-connect` row in [the ten-tool coverage table](../../UX-PATTERNS.md#coverage-for-all-ten-tools). [Proposed flows](flows.md) and [decisions to review](recommendations.md) accompany this evidence.

## Method and scope

We screened the owner's named products, independent review/category listings, and relevant alternatives; traced task flows in official documentation; and visually inspected three official product screenshots in the browser. This was desk research, with **zero participant interviews, zero logged-in product trials and zero production executions**. Documentation proves a described behavior, not usability or reliability. The screenshots establish layout references, not current interactive accessibility. All links below were accessed on the snapshot date unless a historical publication date is explicitly shown.

Four related categories must remain distinct:

| Category | User and job | Relevant candidates |
| --- | --- | --- |
| Visual workflow automation / iPaaS | Operations builder connects accounts, maps records and operates deterministic workflows | Activepieces, n8n, Make, Zapier, Pabbly Connect, Workato, Power Automate, Celigo, Albato |
| Developer / event-flow tools | Technical builder wires events, code and services | n8n, Node-RED; Pipedream screened with lifecycle caveat |
| Agent operations | Operator connects tools, supervises sessions and schedules work | OpenClaw; likely Nous Research Hermes Agent |
| Voice assistance | Dictation, meeting support or voice conversation | Several Whispr products; separately spelled Wispr Flow. Identity and Connect fit unresolved |

The current matrix already covers connection presentation, credentials, secrets, scheduling, retries and execution, and identifies canvas, node inspector, mapping editor and debugger as **future specialized extensions**. Agent sessions, voice input, an approval inbox and enterprise governance are research possibilities, not newly accepted requirements.

## Review and ranking evidence

The following is a dated comparison, not a market-share ranking. Product-page counts are used consistently; category-page counts can lag them. Scores from different review platforms are not numerically interchangeable.

| Product | Public review snapshot | Customer fit and reference role |
| --- | --- | --- |
| n8n | [G2: 4.7/5, 319 reviews](https://www.g2.com/products/n8n/reviews), page updated 17 October | Technical builders; displayed size filters include 248 small-business, 57 mid-market and 8 enterprise reviews. Primary reference for data inspection and execution debugging. |
| Make | [G2: 4.6/5, 392](https://www.g2.com/products/integromat-by-celonis-make/reviews), updated 18 October | Visual operations automation; size filters show 311 small-business, 61 mid-market and 13 enterprise. Primary mapping/recovery reference. |
| Activepieces | [G2: 4.8/5, 142](https://www.g2.com/products/activepieces/reviews), updated 17 October | 136 small-business and 6 mid-market in displayed breakdown. Primary approachable builder/lifecycle reference; limited enterprise review evidence. |
| Zapier | [G2: 4.5/5, 2,088](https://www.g2.com/products/zapier/reviews), updated 17 October | Broad business automation; largest review volume in this comparison. Guided setup reference. Suite-wide feedback does not isolate one editor. |
| Workato | [G2: 4.7/5, 843](https://www.g2.com/products/workato/reviews), updated 19 October | Enterprise integration and operations; job control reference. |
| Microsoft Power Automate | [G2: 4.4/5, 1,092](https://www.g2.com/products/microsoft-power-automate/reviews), updated 17 October | Microsoft-centered cloud flows and desktop/RPA. Approval reference; aggregate score spans substantially different experiences. |
| Pabbly Connect | [Capterra: 4.5/5, 86](https://www.capterra.com/p/205994/Pabbly-Connect/), updated 4 September | Straightforward business automation; 94% small-business among 85 reviewers answering that profile question. Required guided-setup/retry comparison. |

**Identity trap:** G2's Pabbly Connect address redirects to a [suite-wide Pabbly profile](https://www.g2.com/products/pabbly/reviews), rated 4.1/5 from 30 reviews in Marketing. That is not a clean Connect-only rating.

[G2's scoring methodology](https://documentation.g2.com/docs/research-scoring-methodologies) combines review signals and category-relative market-presence measures. Its Market Presence score is not measured share of all automation installations. [Capterra describes verified reviews and proprietary research](https://www.capterra.com/resources/proprietary-data-research/); marketplace presentation can include sponsorship. Both samples are self-selected and may include disclosed incentives. We did not independently verify reviewers or estimate a representative population failure rate.

The [G2 iPaaS category page](https://www.g2.com/categories/ipaas), updated 13 October, lists 359 products and highlights Zapier, Celigo, Workato, MuleSoft, n8n, HubSpot, SAP and ServiceNow. Its displayed Celigo score is 4.6/5 from 1,070 reviews. Vendor descriptions on that page make competing “#1” claims; we do not adopt them as a universal ranking. This broader screen prevents the owner's initial list from being mistaken for an exhaustive market map.

## Adoption and market-share limits

| Product/source | Public figure and date | What it does and does not measure |
| --- | --- | --- |
| [n8n announcement](https://blog.n8n.io/n8n-sap/) | 1.7 million monthly active builders; 1,400+ enterprise customers, 12 May 2026 | Vendor-reported activity/customer counts, with no common market denominator. |
| [Zapier customer stories](https://zapier.com/customer-stories) | 3.4 million businesses/companies on current page | Vendor adoption claim; paying status, activity period and deduplication are not established. |
| [Make integrations page](https://www.make.com/en/integrations/make) | 350,000+ customers | Vendor claim. Its [security page](https://www.make.com/security) uses “users” for a similar number; do not relabel it as verified paid organizations. |
| [Activepieces blog](https://www.activepieces.com/blog/marketing-automation-integrations) | 100,000+ users | Marketing adoption proxy, without an active-user period. |
| [Workato marketplace profile](https://marketplace.workato.com/en/seller/workato) | 12,000+ global customers | Vendor claim, not independently audited market share. |
| [Pabbly Connect product page](https://www.pabbly.com/connect/) | 14,099+ businesses | Vendor claim; paid/active definition and measurement period unclear. |
| [Microsoft FY2023 Q4 investor remarks](https://www.microsoft.com/en-us/investor/events/fy-2023/earnings-fy-2023-q4) | 10 million Power Automate monthly active users | Historical 2023 figure; **not a current 2026 count**. Broader Power Platform totals are not substituted. |
| [6sense Zapier profile](https://6sense.com/tech/integration/zapier-market-share) | Headline 13.49%, rank #2, 24,855 tracked customers in “Integration” | Provider-estimated tracked-technology share in a mixed category. The FAQ also says 24,696 customers. Neither count establishes overall automation revenue, active-user or installation share. |

**Conclusion:** no defensible, comparable public market-share table covering this set was established. Reviews, vendor adoption and 6sense tracked technology estimates are separate signals. GitHub stars and connector counts were not used as market-share substitutes.

## Candidate inventory and shortlist

| Candidate | Selection | Feature-level reason / limitation |
| --- | --- | --- |
| Activepieces | Primary | [Draft/published lifecycle](https://www.activepieces.com/docs/flows/versioning), [test-before-mapping guidance](https://www.activepieces.com/docs/flows/passing-data), [read-only run inspection](https://www.activepieces.com/docs/flows/debugging-runs). Good approachable baseline; documented advanced controls can be plan-gated. |
| n8n | Primary | [Input/configuration/output workflow](https://docs.n8n.io/build-your-first-workflow) and [past-run debugging](https://docs.n8n.io/build/understand-workflows/understand-executions/debug-executions). Strong technical reference; avoid forcing its three-column density on every user. |
| Make | Primary | [Mapping bundles](https://help.make.com/mapping), [incomplete-execution queue](https://help.make.com/manage-incomplete-executions). Useful for precise recovery language; its restart/resume semantics require a matching runtime. |
| Zapier | Supporting | [Guided action configuration](https://help.zapier.com/hc/en-us/articles/8496257774221-Set-up-your-Zap-action). Useful progressive setup, including explicit live test effects. |
| Pabbly Connect | Supporting, owner named | [Workflow setup](https://www.pabbly.com/how-to-create-a-workflow-in-pabbly-connect-full-guide/) and [official recovery support answer](https://forum.pabbly.com/threads/how-to-track-node-level-logs-enable-retries-and-use-rest-api-integrations-in-pabbly-connect.214474). Validate article/version assumptions before exact UI reproduction. |
| Workato | Supporting | [Job reruns](https://docs.workato.com/en/recipes/rerun-job.html) clarify version and retained-input semantics. Enterprise complexity should not become default screen complexity. |
| Power Automate | Supporting | [Human approval lifecycle](https://learn.microsoft.com/en-us/power-automate/modern-approvals), with multiple response surfaces. This is different from approval to publish a flow. |
| Celigo | Screened, targeted secondary | [Create custom flows](https://docs.celigo.com/hc/en-us/articles/360025919171-Create-custom-flows) requires integration scope before source/destination setup; [monitoring table](https://docs.celigo.com/hc/en-us/articles/7185411750043-Monitor-flows-APIs-and-tools-in-an-integration) exposes mapping, schedule and last run. Stronger fit if ERP/record synchronization becomes a concrete requirement. |
| Albato | Screened, defer deep inspection | [Official site](https://albato.com/) emphasizes embedded iPaaS. Useful if customer-facing embedded integrations are approved; not needed to justify the current internal operator flow. No comparable review snapshot collected here. |
| Node-RED | Screened, targeted secondary | [Workspace/editor documentation](https://nodered.org/docs/user-guide/editor/workspace/) offers flow organization and keyboard references. Particularly relevant if Connect later shares event automation with Property. No market-leader claim established. |
| Pipedream | Screened, lifecycle caveat | [Official Workflows documentation](https://pipedream.com/docs/workflows) announces Workflows and String shutdown on 31 March 2027. Historical patterns may inform research; avoid making it the durable primary product reference. |
| MuleSoft / SAP / ServiceNow / HubSpot | Category screen only | Present in G2's category evidence; broad enterprise/API or CRM platform fit. No task-level visual recommendation is made without a specific requirement and deeper inspection. |

## Named agent and voice references: identity resolution

| Owner name | Evidence | Treatment |
| --- | --- | --- |
| Openclaw | [OpenClaw official description](https://docs.openclaw.ai/help/faq/what-is-openclaw) | Verified agent/assistant runtime, distinct from deterministic visual iPaaS. Use [pairing](https://docs.openclaw.ai/web/control-ui/connect-and-pair), [execution approvals](https://docs.openclaw.ai/tools/exec-approvals) and [automation operations](https://docs.openclaw.ai/releases/2026.8.1/automations-and-scheduling) as targeted references. |
| Hermes | [Nous Research Hermes Agent](https://hermes-agent.nousresearch.com/docs) | Plausible intended identity and strong category match, pending owner confirmation. [MCP connection lifecycle](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) and [scheduled jobs](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) are relevant. |
| Mindwire | [Mindwire Pte. Ltd.](https://www.mindwire.ltd/) | Engineering practice found; a public self-service workflow product was not confirmed. Intended URL remains unresolved. Do not substitute similarly named products. |
| Whispr | [iPhone dictation](https://trywhispr.app/), [call assistance](https://whispr.one/), [meeting suggestions](https://www.getwhispr.io/), [voice conversations](https://whisprtalk.com/help/getting-started/first-session) | Several distinct identities. None is established as the intended general automation product. |
| Wispr Flow | [Official explanation](https://docs.wisprflow.ai/articles/2772472373-what-is-flow) | Separately spelled dictation product; a possible spelling alternative, **not a confirmed correction**. Voice input would add scope. |

No comparable independent market-share or review evidence was established for these agent/ambiguous-name candidates. They are chosen for relevant documented interactions, not asserted category leadership.

## Visual reference inspection log

Inspected in the browser on the snapshot date. These are vendor-authored static screenshots, not a logged-in usability test. No proprietary image or source was copied into the library.

| Reference | What was visibly inspected | Proposed transferable principle |
| --- | --- | --- |
| [Activepieces action test screenshot](https://mintcdn.com/activepieces/iL5rAezyhfVokrkv/images/test-step-1.png?fit=max&auto=format&n=iL5rAezyhfVokrkv&q=85&s=ba24d9db3cb87fcaccf63c66467a24a1), linked from Passing Data | Vertical numbered steps; selected step outline; per-step Tested/Test me labels; adjacent labelled configuration; test action below fields | Keep the selected step, configuration and validation state visually connected. Status needs text. |
| [n8n mapping screenshot](https://2446198290-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FCxSeOtVxqqhfxMSac0AV%2Fuploads%2Fgit-blob-9a1dd63851210c02e888c7bfd173ad4620537197%2Fbuild-your-first-workflow-report-04.png?alt=media), linked from first-workflow guide | Left input data, center parameters with inline expression/result preview, right output with an explicit no-data condition | Show source, expression and evaluated example together. Distinguish absent output from a failed run. |
| [Make bundle screenshot](https://cdn.images.archbee.com/4CkrlJIBl1di_p1x71ery-rbuFBA1hm5H-qfP_Soxa3-20250212-101017.png?format=webp), linked from Mapping | One operation contains separate expandable Input and Output collections plus lifecycle status | Inspect individual attempts and their actual data; avoid one undifferentiated JSON dump. |

Apply these spatial relationships using Campaign's existing `AppBrand`, `AppIcon`, login patterns and ten98 semantic tokens. Competitor colors, logos, screenshots and proprietary code are not design-system assets.

## Review themes → research implications

These are qualitative examples found in the cited product review pages, not prevalence estimates or claims about every user.

| Theme | Evidence | Proposed implication |
| --- | --- | --- |
| Large flows become difficult to understand/debug | n8n reviewers describe complexity across nodes, APIs and changing input | Searchable step outline, direct failed-step focus, input/output and test-data provenance. |
| Visual connectivity can mislead | A Make reviewer describes connected-looking modules behaving as orphaned | Validate executable paths; connecting lines must not imply a valid runnable graph. |
| Connector gaps surface late | Activepieces reviews mention missing connectors/manual configuration | Show available triggers/actions/auth methods before building around a connector. |
| Operational visibility matters after setup | Zapier reviews mention consumption cost and missed/silent trigger concerns | Separate waiting, last verified event, execution outcome and usage when known. |
| Error messages need context | Workato reviewer feedback describes weak connector-failure explanations | Identify failed step, attempt, provider response and recovery action. |

The proposed UX must be tested with real ten98 tasks and representative records. Neither a high review score nor a visually polished reference establishes correct retry policy, authorization, accessibility or data integrity.
