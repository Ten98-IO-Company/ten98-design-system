# Campaign native auth, editors and recovery

Reviewed **20 October 2026, Asia/Dubai**. The final fictional UI evidence covers **60 auth/access captures, four queue read-error captures and eight post-footer captures: 72 captures across 25 states**. All recorded native-state, computed text-contrast and document/dialog-containment checks pass for those captured states. Independent final review inspected all 19 changed or additional images; the remaining 53 auth PNGs are byte-identical to the earlier fully inspected auth set. This is scoped UI acceptance, not whole-app or backend completion.

The [allowlisted numeric/geometry summary](native-auth-editors.json) contains filenames, hashes, themes, viewport widths, scoped counts and safe source pins. Eleven selected fictional images are published byte-for-byte below. Raw requests, authentication/storage state, credentials, account identifiers and DOM/text exports remain private.

This extends the accepted [native route review](campaign-screen-audit.md). [Shared AuthLayout](auth-layout.md) retains its own API and rationale record: Campaign's native Auth, invitation, session and access controllers remain app-owned, and these captures do not claim that the native application imports AuthLayout. The [accepted Discover handoff](discover-remaining-flows.md) is separate.

## Actual run boundary

The final generation uses **@ten98/ui 0.3.15**, archive SHA-256 `C690CD081EE82ECE3802388994E746DCC198FF309ECB3B8668FF60A324C7CA77`. The final source freeze contains 103 runtime files. Only native `src/ZernioQueues.tsx`, `src/styles.css` and `src/post-composer.css` changed from the preceding route/editor generation; the other 100 runtime files and the shared archive are unchanged.

The planned 72-capture run recorded the first **64** final captures, then stopped at the footer test's launch locator: the test looked for **New post**, while the native launch button is **Create post**. Correcting that test-only locator produced a separate successful **eight-capture** footer run on the same frozen UI source. All 72 captured states have passing checks across those two receipts. This is **64 + 8 evidence, not a clean monolithic 72-capture run**; the stopped attempt remains retained privately.

The earlier complete 60-auth run found **five failing paint samples in four dark loading/error scenes**, each at approximately **3.227395:1**. The native loading-screen pair was repaired and all 60 final auth captures now pass the computed scan. Fifty-three PNG hashes are unchanged; seven changed images comprise four loading/error repairs and three invitation timing captures. The old failure evidence remains intact.

## What was exercised

| Evidence | Accepted captured scope | Limit |
| --- | --- | --- |
| Auth/access: 60 captures | Owner setup, sign-in, rejected/held local submission, configured/unconfigured OIDC link presence, local/identity-provider account alternatives without project access, invitation loading/new/existing/accept/held/rejected/unavailable branches, distinct session/state loading and failure branches, state retry and native boundary reload. Both themes; representative 320px forms/errors/access layouts. | Synthetic responses and intercepted held/rejected mutations. No successful account/workspace creation, real sign-in, OIDC navigation or invitation delivery/acceptance. Boundary proof deliberately supplies a malformed collection to the real mounted boundary. |
| Queue read errors: four captures | Initial held read and previously verified empty state followed by held refresh. Neither held nor rejected reads claim that no queues or queue-selected posts exist. Native diagnostics remain visible; refresh makes exactly two queue reads. | Fictional reads, empty approvals and a local 503 response. No queue/provider writes or populated queue-management acceptance is inferred. |
| Post footer: eight captures | Actual composer at initial and end scroll positions, both themes at 1440/320px. All 16 Cancel/Save draft rectangles fit fully inside the dialog client area and viewport. | Open-only geometry proof; no save/cancel submission. The earlier clipped footer was independently observed in its original PNG before the native sticky anchor correction. |
| Root editor inventory: 36 earlier PNGs | Eighteen light/dark pairs: 17 root editor types plus the published-article child. All were opened and visually inspected. Narrow Providers keyboard access and both Ad details bottom compositions were subsequently inspected and accepted separately. | Opening an editor does not accept submission, upload, publication, activation, deletion, provider outcomes or every child/dirty/error branch. The post-footer repair has the separate final eight-capture proof above. |

The root types are campaign, post, placement, asset, asset-delivery, provider, project, workspace, ad, ad-details, connect, blog-draft, product-edit, product-create, product-price, product-state and collection-title. The published-article editor is the additional child, not an eighteenth root type.

The computed scan retains **56 unsupported paint records: 20 from queues and 36 from post compositions**, chiefly filters and unsupported background colors. Final manual inspection covered these compositions and found no visible paint defect. These records remain unsupported by the numeric method; zero numeric failures and manual inspection do not certify WCAG AA or complete accessibility. Explicit initial theme probes establish CSS/state behavior, not preference persistence.

## Selected exact screenshots

The dark 320px sign-in image uses the byte-identical earlier file. Original capture names and hashes remain in the receipt; the [unaltered originals](https://github.com/Ten98-IO-Company/ten98-code-system/releases/tag/archive-2026-10-20) preserve the complete evidence before deduplication.

| Native composition | Actual published capture | Observation |
| --- | --- | --- |
| Sign-in | [Light desktop](images/campaign-auth-editors/signin-light-1440.png), [dark 320px](../2026-10-19/images/consumer/campaign-login-dark-after-320-0.3.11.png) | Existing Campaign mark, story/form composition and native controls retained. |
| Owner setup | [Dark 320px](images/campaign-auth-editors/owner-setup-dark-320.png) | Native setup fields and guidance stay visible. |
| No project access | [Dark 320px](images/campaign-auth-editors/no-project-local-dark-320.png) | Workspace creation, refresh/sign-out and account alternatives remain available. |
| Invitation rejection | [Dark 320px](images/campaign-auth-editors/invitation-accept-401-dark-320.png) | Invited identity, sign-in recovery and full diagnostic remain readable. |
| State-read failure | [Dark before](images/campaign-auth-editors/state-error-before-dark-1440.png), [dark after](images/campaign-auth-editors/state-error-after-dark-1440.png) | Native loading/error paint pair repaired; state retry stays distinct from session failure. |
| Composer footer | [Initial dark 320px](images/campaign-auth-editors/post-footer-initial-dark-320.png), [end light 320px](images/campaign-auth-editors/post-footer-end-light-320.png) | Full action rectangles are contained at both scroll boundaries. |
| Queue failure | [Initial-read error, dark](images/campaign-auth-editors/queue-initial-read-error-dark-1440.png), [empty-refresh error, light](images/campaign-auth-editors/queue-empty-refresh-error-light-1440.png) | Error diagnostics replace unverified empty claims. |

## Remaining acceptance boundary

The prior native **950-check** gate belongs to its earlier generation. A separate complete gate on this final three-file UI generation now passes **950/950 checks** (923 top-level tests; zero failures, cancellations or skips) in **43.239 seconds**. Production build, final container build and its non-root, read-only, network-isolated smoke also pass. Root independently read those final results and verified all **208 source/test file hashes unchanged** against the final gate snapshot. This qualification comes from those gates, not screenshot inference.

Existing real-provider, backend/SQL, role/permission, destructive/paid-operation, collector and other unexercised child-state gates remain separate. These captures establish the stated fictional UI and geometry behavior only. The user's existing OOH page was preserved to protect its draft-capable forms; this handoff makes no final-generation readback claim for that tab.
