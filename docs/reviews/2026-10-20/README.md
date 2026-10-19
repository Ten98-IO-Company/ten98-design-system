# UI reviews - 20 October 2026

[Campaign native route before/after review](campaign-screen-audit.md): 29 routes in light/dark, 58 before captures on shared 0.3.14 and 58 visually reviewed route after captures on released 0.3.15. [Before summary](native-baseline.json) preserves 74 measured failures; [after summary](native-after.json) records zero measured text failures, clear route/theme/containment/error assertions and all 200 unsupported paint records. Eleven byte-identical redacted synthetic figures from each generation are published. Manual review found no observed route-state regression; unsupported paint is not numerically certified. Child/editor/auth/role/additional data acceptance and the subsequent queue error-edge proof remain separate.

[Discover remaining flows](discover-remaining-flows.md) tracks its independent app-owned simplification work.

[One auth layout](auth-layout.md) records the shared 0.3.15 correction, complete browser gate, final screenshot comparison and preserved API boundaries.

[Campaign native auth, editors and error states](campaign-auth-editors.md) records the separate 60 auth/access, four queue-error and eight post-footer scenes, editor opening/bottom checks and narrow navigation. It preserves the test-only 64+8 run boundary and observed-paint limits.

Use the [official Campaign C1-C8 reference register](../2026-10-19/visual-campaign.md), [template/settings references](../2026-10-19/visual-templates.md) and [new partial reference figures](campaign-screen-audit.md#reference-boundaries). These are public vendor UI/documentation references, not authenticated vendor interaction or functional/dark-theme parity. Keep ten98 branding and native provider safeguards.
