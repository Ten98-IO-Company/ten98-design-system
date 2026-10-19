# One auth layout

The user's review found that the generic AuthLayout conflicted with the Brand & login reference. Both already used AppBrand; the duplication was separate layout rules and repeated login structure.

The 0.3.15 correction retains the six public props and makes AuthLayout use Campaign's established split story/form composition. Brand & login and the component catalogue call the same wrapper and reuse the same story. Brand and auth rules now live in one CSS source, included by both stylesheet entry points. `styles.css` works alone; an app does not need global compatibility styles solely for this component. Native authentication, setup, providers, errors and routing remain application-owned.

The form title is one h1. Campaign's story uses a paragraph with its existing headline styling. Generic aside instructions and recovery links stay visible at 320px; only explicitly marked Campaign decoration follows the original mobile collapse. The single-panel variant remains available through the existing optional aside prop.

The same patch removes duplicate padded-panel header insets and settings-field margins inside form grids, preserving an explicit 18px row gap. Calendar and Account reports can share those corrections without native per-panel overrides. Plain panel headings retain their existing inset.

## Verification boundary

The initial four focused Playwright checks passed before independent review identified the mobile guidance regression. The regression was corrected and a meaningful visibility check added; the full final browser qualification is recorded in [release validation](../../VALIDATION.md). Build, 58 native checks and all 511 standalone strict TSX examples pass on the corrected source.

The browser fixtures compare the standalone stylesheet's rendered brand geometry/colors with the existing native Campaign fixture; exercise both themes, desktop and 320px, single/split panels, invalid email, required password and exact FormData; and retain Brand & login's setup, busy and app-owned error states. Existing legacy checks protect native light geometry and dark contrast with old-paint negative controls. These are local UI checks, not a change to either app's authentication service.

The complete runtime/style gate passes **172/172 in 3.2 minutes**. Final screenshot inspection caught missing whitespace in the copied story when its br elements hide; the corrected example and added text-containment check pass **4/4 affected tests in 7.9 seconds**. Campaign's original native source already had spaces. The public component, styles and declarations did not change after the full gate.

| Actual image | Comparison |
| --- | --- |
| [Brand login light](images/auth/brand-login-light-1440.png), [dark](images/auth/brand-login-dark-1440.png) | Same established story, logo geometry, orbit and centered form composition as the [original Campaign login](../2026-10-19/images/consumer/campaign-login-light-reference-0.3.11.png). The catalogue preview has its own available height; it is not a full native-page screenshot. |
| [Narrow light](images/auth/brand-login-light-320.png), [dark](images/auth/brand-login-dark-320.png) | Actual host viewport 320px. The inner reference frame is narrower because catalogue margins remain; headline containment and native form controls stay usable. |
| [AuthLayout split state](images/auth/component-split-light-1440.png) | The component now uses the same presentation and story. Consumer form contents remain app-owned. |
