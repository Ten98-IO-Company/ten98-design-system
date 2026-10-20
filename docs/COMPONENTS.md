# Component inventory and API

This is the public component inventory for `@ten98/ui`. Import React components from `@ten98/ui` and load `@ten98/ui/styles.css` once at the application root. Campaign and Discover also use the application-compatible entry point described below. The installed package’s emitted TypeScript declarations are the exact versioned API contract.

## Implemented primitives

| Export | Main props | Behavior and limits |
| --- | --- | --- |
| `Button` | Native button props; `variant`, `size`, `loading`, `icon`, `href?`, `component?`, `pressed?`, `fullWidth?` | Defaults to `type="button"`, primary and medium. Loading disables the button and sets busy state. `href` renders a styled anchor (through `component`, a router link with the `Link.component` contract); a disabled or loading anchor drops `href` and sets `aria-disabled`. `pressed` sets `aria-pressed` for toggles. An icon-only button (`icon`, no children) uses a 44px square and warns in development without `aria-label`. |
| `Badge` | `tone`, `palette?`, `dot`, children; span attributes | Status text with optional decorative dot. `palette` (`rose`, `amber`, `lime`, `emerald`, `sky`, `violet`, `fuchsia`) is a decorative user-tag colour that replaces the tone; both meet 4.5:1 in light and dark. Include meaningful text. |
| `Avatar` | `name`, `size`; span attributes | Initials with an accessible name; does not fetch images. |
| `Icon` | `name`, `size`, `title`; SVG attributes | Bundled stroke icons. Decorative by default; use `title` for a meaningful standalone image and label icon-only buttons. |
| `Card` | `title?`, `description?`, `actions?`, `as?` (`div`/`section`/`article`), `headingLevel?` (2–4, default 3), children; div attributes | Panel with optional header and a 16px gap between direct content children. Its built-in title is an `h3` unless `headingLevel` is set; a titled `section`/`article` is named by it; consider the screen's heading hierarchy. Group buttons in `FormActions`, fields in `FormGrid`. |
| `Input` | Native input attributes and ref | Styled input; choose its native `type`, constraints and controlled/uncontrolled state. |
| `Textarea` | Native textarea attributes and ref | Resizable multiline input; default four rows. |
| `Select` | Native select attributes and ref; `options?: {value, label, disabled?, group?}[]`, `placeholder?`, option children | Browser-native select. Options sharing a `group` render in one optgroup (first-seen order); `placeholder` is a disabled empty first option selected while the value is empty; children render after `options`. Searchable combobox and multiselect behavior are not included. |
| `Field` | `label`, `htmlFor?`, `required?`, `description?`, `error?`, children | Connects a label, description and error to its direct control child; marks invalid when an error exists. Without `htmlFor` an id is generated and applied to a child that has none. `required` adds an `aria-hidden` ` *` marker only; set `required` on the control. |
| `Checkbox` | Native input attributes except `type`; `label`; ref | Native checkbox inside its label. |
| `Switch` | `label`, `checked`, `onCheckedChange`; button attributes | Controlled switch button; the application saves the value. |
| `Tabs` | `items`, `value`, `onValueChange`, `label?`, `className?` | Controlled tabs and panels with arrow/Home/End navigation. Use route links for navigation between pages. |
| `Dialog` | `open`, `onOpenChange`, `title`, children; `description?`, `footer?`, `className?`, `closeDisabled?` | Native modal dialog with focus restoration. `closeDisabled` defaults to `false`; when true it disables the close button and suppresses Escape/backdrop close requests. The application handles drafts, submission and confirmation policy. |
| `Alert` | `title?`, `tone`, `variant?` (`default`/`inline`/`banner`), `onDismiss?`, `dismissLabel?`, `actions?`, children; div attributes | Danger uses an alert role and other tones a status role; pass `role` to override. `onDismiss` adds a labelled dismiss button. Optional recovery actions wrap in a separate row beneath the message. |
| `Progress` | `value?`, `label?`, `className?` | Determinate native progress from 0–100, with out-of-range values clamped. Omit `value` for an indeterminate bar (`aria-busy`, no value; animation stops under reduced motion). Supply confirmed progress rather than an invented percentage. |
| `Meter` | `value`, `min?`, `max?`, `low?`, `high?`, `optimum?`, `label?`, `valueLabel?` | Native `<meter>` for a scalar within a range (quota, score) with a visible label and reading. Not task progress. |
| `Skeleton` | Div attributes | Decorative placeholder; give the loading region its own status text. |
| `Separator` | Horizontal-rule attributes | Thematic separation. |
| `Tooltip` | `content`, one element child, `className?` | Pointer/focus tooltip with Escape dismissal. The child must pass `aria-describedby` to its focusable element. Keep essential instructions visible. |
| `Breadcrumb` | `items: {label, href?}[]`, `className?` | Basic anchor breadcrumbs; final item is current. For client routing, render the app's router links in a shell/header slot instead. |
| `Accordion` | `items: {title, content}[]`, `className?` | Independent native details/summary disclosures. |

`variant` is `primary | secondary | ghost | danger`. Button and Avatar sizes are `sm | md | lg`. `Tone` is `neutral | accent | success | warning | danger | info`.

`cx(...values)` joins truthy class names. Exported types include `IconName`, `ButtonProps`, `CardProps`, `TabItem`, `DialogProps`, `Tone`, `Theme` and `Density`.

## Layout and text primitives

Applications compose every screen from these instead of writing elements, `className` or `style`. Spacing, size and tone props accept token steps only.

| Component | Main props | Behavior |
| --- | --- | --- |
| `Stack` | `as?`, `gap?` (0–16 token step, default 4), `align?`; native form/fieldset attributes | Vertical rhythm. `as="form"` keeps `action`/`method`; direct buttons and badges keep their intrinsic width. |
| `Inline` | `as?`, `gap?` (default 2), `align?`, `justify?`, `wrap?` | Wrapping horizontal run for toolbars, badges and metadata. |
| `Grid` | `as?`, `gap?`, `columns?` (1–6 or `auto`), `minItemWidth?` | Responsive columns; fixed counts drop to two under 960px and one under 600px. |
| `FormGrid`, `FormActions`, `FeatureControls` | div attributes | Field columns, the action row after them, and short report filters above full-width results. |
| `Text` | `as?`, `size?`, `tone?`, `weight?`, `align?`, `mono?`, `numeric?`, `truncate?` | Body text, values and inline emphasis; `as="time"` takes `dateTime`. |
| `Heading` | `level` (required), `size?` | Outline level is independent of visual size. |
| `Link` | `href`, `variant?`, `target?`, `component?` | Navigation; pass a router link as `component`. New-tab links get `noopener noreferrer`. |
| `Image` | `alt` (required), `fit?`, `aspect?`, `rounded?` | Lazy, async-decoded responsive image. |
| `List`, `ListItem` | `ordered?`, `gap?` | Prose lists with markers; use `Stack as="ul"` for unmarked layout lists. |
| `DescriptionList` | `items`, `columns?` | Native label/value pairs. |
| `Option`, `OptionGroup` | native option/optgroup attributes | `Select` children. |
| `VisuallyHidden` | `as?` | Screen-reader-only text. |

## A labelled form

```tsx
import { Button, Field, FormActions, Input, Option, Select, Stack } from '@ten98/ui';

export function ProjectForm() {
  return (
    <Stack as="form" onSubmit={event => event.preventDefault()}>
      <Field label="Project name" htmlFor="project-name" description="Visible to your workspace.">
        <Input name="name" required maxLength={120} />
      </Field>
      <Field label="Visibility" htmlFor="project-visibility">
        <Select name="visibility" defaultValue="workspace">
          <Option value="workspace">Workspace</Option>
          <Option value="private">Private</Option>
        </Select>
      </Field>
      <FormActions><Button type="submit" variant="primary">Create project</Button></FormActions>
    </Stack>
  );
}
```

The example stops submission so it can demonstrate the components without writing data. Connect it to the application's validated mutation flow. Give `Field` one direct control child and a unique `htmlFor`; omit the child's `id` or keep it identical. Wrapper elements and custom components must forward the generated accessibility attributes to the actual input.

## Authentication flows

Each flow renders the whole screen on `AuthLayout` with one `main` and one `h1`, and owns no request, session, redirect or message text. Forms post natively (`action`, `method`, `hiddenFields`) or call `onSubmit` with typed values whose keys match the native field names; `busy`, `error`, `unconfirmed`, `notice` and `fieldErrors` come from the app.

| Export | Values / states | Notes |
| --- | --- | --- |
| `SignInFlow` | `{email, password}` | Optional forgot-password, cancel and `providers` slot. Render `TwoFactorChallengeFlow` in its place when the app's result needs a second factor. |
| `FirstUserSetupFlow` | `{name, token, email, password, workspaceName?, sample}` | Setup token is a plain password-type field with length limits only; `sample` is a boolean. |
| `TwoFactorChallengeFlow` | `{code, mode}` | Authenticator (numeric, 6) and recovery-code (text, 21) modes; switching clears the code. |
| `PasswordRecoveryFlow` | request `{email}`, reset `{password, confirmation, token?}` | Availability `loading`/`enabled`/`disabled`/`error`; `sent` and `invalid` states. The token stays in memory; the flow never touches the URL. |
| `InvitationAcceptFlow` | `{name?, password?, token?}` | `loading`, `details`, `signin-required`, `mismatch`, `unavailable`, `accepted`. |
| `WorkspaceOnboarding` | `{name}` | Signed in without project access: create a workspace, refresh, account and sign out. |
| `OidcProviderButtons` | `providers`, `onStart?` | Providers with `href` are native links (one provider is fine); others call `onStart`. Loading, error and pending states. |
| `AuthStory`, `AppStateScreen`, `AuthErrorBoundary` | — | Side-panel story; full-screen `loading`/`error`/`unconfirmed`/`boundary` states; a boundary whose `onReload` recovers in place. |

## Implemented work patterns

| Export | Main props | Behavior and limits |
| --- | --- | --- |
| `AppShell` | `sidebar`, children; `topbar?`, `banners?`, `navigation?`, `sidebarLabel?`, `skipLinkLabel?`, `mainLabel?`, `header?` (legacy) | The whole app frame: skip link, named sidebar, topbar header outside `main`, banner stack and main landmark. With `navigation` it adds the mobile drawer (focus trap, Escape, shade) through `useSidebarNavigation`. |
| `AccountMenu` | `name`, `email?`, `avatar?`, `items?`, `linkComponent?`, `label?`, `defaultOpen?`; `children` (deprecated) | One header account disclosure. `items` are typed links, buttons (busy, disabled, danger) and separators, so apps write no elements; sign-out and navigation handlers stay app-owned. |
| `SidebarFooter` | `version`, children, `className?` | Settings, optional connection utilities and the actual app version. Keep profile identity and sign out in the header AccountMenu. |
| `AppTopbar` | `breadcrumb`, `menuToggle?`, `search?`, `badge?`, `actions?` | Breadcrumb with the current page, drawer toggle (inside `AppShell navigation`), search, status badge and account actions. |
| `SidebarNav` | `label`, `groups`, `linkComponent?`, `filter?`, `onNavigate?`, `emptyFilter?` | Grouped navigation. Items take `href` (a key your `linkComponent` resolves), `onSelect(item, event)` or both; `preventDefault()` in `onSelect` cancels navigation, modified clicks keep the browser default. `filter` matches labels and `keywords`; fully filtered groups hide. |
| `WorkspaceProjectSwitcher` | `workspaces`, `projects`, `workspaceId`, `projectId`, `onWorkspaceChange`, `onProjectChange`, `create?` | User > Workspace > Project selection with role caption, initials, loading, empty and create states. The app chooses the default project. |
| `SearchField` | `label`, `value`, `onValueChange`, `status?`, `onClear?`, `shortcut?`, `variant?` | Search input with a persistent polite status region, clear button and display-only shortcut hint. |
| `Banner`, `SidebarStatus` | `tone`, children/`label`, `action?`, `onDismiss?` | Workspace-level notices above content (sample data, a required security step) and the sidebar connection note. |
| `useSidebarNavigation` | `open`, `onOpenChange`, `sidebarRef`, `triggerRef`, `mediaQuery?` | Adds responsive drawer focus handling and inertness to existing app navigation. Spread returned `sidebarProps` and `contentProps` as described in [sidebar usage](SIDEBAR.md). The app owns routes, permissions and draft guards. |
| `PageHeader` | `title`, `eyebrow?`, `description?`, `actions?` | Page `h1`, context and actions; actions wrap on narrow screens. |
| `DataTable<T>` | `columns`, `rows`, `rowKey`, `caption`; options below | Local search, column sort, pagination and optional selection. Native table with scroll region. |
| `MetricCard` | `label`, `value`, `change?`, `trend?`, `chart?` | Formatted value and optional change/trend graphic. Application supplies all calculations and formatting. |
| `Sparkline` | `values`, `label`, `color?` | Display-only SVG trend; ignores nonfinite values. Include text/tabular detail when exact values matter. |
| `EmptyState` | `title`, `description`, `icon?`, `action?` | Empty or filtered-empty explanation and next action. |
| `ActivityFeed` | `items` | Ordered activity presentation. Application supplies readable timestamps and sanitized event content. |
| `ResourceCard` | `title`, `description`, `icon?`, `status?`, children, `actions?` | Shared presentation for a connection, server, property, campaign or other resource. |
| `SettingsSection` | `title`, `description`, children | Labelled section with explanation and fields; stacks at narrow widths. |
| `Stepper` | `steps`, `current` | Display-only ordered progress; `current` is a valid zero-based active step. The application owns navigation and validation. |

`MetricCard.trend` is `up | down | neutral`. Up is shown in the success color and down in danger; use neutral for measures where increasing/decreasing does not imply good/bad. Its `chart` is an array of numbers. It does not provide chart axes, tooltips or financial/analytics calculations.

`ActivityItem` has `id`, `title`, `time`, optional `description`, `icon` and `tone`. Its tone is `neutral | success | warning | danger | info`. Keep IDs stable and format the `time` string in the consuming application.

## DataTable contract

```tsx
import { Badge, DataTable, type DataColumn } from '@ten98/ui';

type Project = { id: string; name: string; status: string; members: number };

const columns: DataColumn<Project>[] = [
  { key: 'name', header: 'Project' },
  {
    key: 'status',
    header: 'Status',
    render: row => <Badge tone={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge>,
    sortValue: row => row.status,
  },
  { key: 'members', header: 'Members' },
];

export function ProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <DataTable
      caption="Workspace projects"
      columns={columns}
      rows={projects}
      rowKey={row => row.id}
      pageSize={10}
      selectable
      onSelectionChange={keys => console.log('Selected project IDs', keys)}
    />
  );
}
```

| Prop/type | Contract |
| --- | --- |
| `columns` | Readonly `DataColumn<T>[]`; each column has a unique `key`, `header`, optional `render(row)` and `sortValue(row)` |
| `rows` | Readonly array of the current local dataset |
| `rowKey` | Returns a unique, stable string for every row |
| `caption` | Accessible table name and part of the search label |
| `searchable` | Defaults to `true` |
| `searchPlaceholder` | Defaults to “Search records…” |
| `pageSize` | Defaults to `5`; invalid values fall back to 5 |
| `selectable` | Defaults to `false`; enables row checkboxes |
| `onSelectionChange` | Receives the selected row keys |
| `emptyTitle` | Defaults to “No records found” |

Search and sort use the raw property matching `column.key`, or `sortValue` when supplied. A custom `render` changes the display only; provide `sortValue` for derived or formatted cells. Numbers sort numerically and other values use an `Intl.Collator`. Source rows are not mutated.

Selection persists across filtering and pages. The header checkbox selects or clears the current page only, with a mixed state for partial page selection. Removed rows are pruned from selection. The app owns bulk actions, access checks and result feedback; it should explain the selection scope before an operation.

This is a small local-dataset table. It does not expose controlled server query/sort/page state, remote totals, virtualization, editable cells or column resizing. Use an application-owned table integration for those requirements and reuse these tokens and visual conventions. Do not pass one server page and label it as a full collection.

`filterAndSortRows(rows, columns, query?, sort?)` is exported for the same nonmutating local operations. `TableSort` contains `key` and `direction: 'asc' | 'desc'`. `DataColumn`, `DataTableProps`, `TableSort`, `MetricCardProps` and `ActivityItem` are exported types.

## Shared workspace compositions

| Export | Exact props | Behavior and limits |
| --- | --- | --- |
| `ProductSwitcher` | `products: readonly ProductOption[]`, `value: string`, `onValueChange(value: string)`, `label?`, `disabled?` | Labelled native select; label defaults to “Product”. Options contain `id`, `name`, optional `description`. The application changes navigation, scope and loaded data. |
| `DateRangeField` | `label: string`, `start: string`, `end: string`, `onChange(range: DateRange)`, `disabled?` | Two native date inputs. Use ISO date-only values (`YYYY-MM-DD`) or an empty string; edits with start after end show an error and do not call `onChange`. No timezone conversion, presets or date arithmetic. |
| `CopyButton` | `value: string`, `label?` | Copies through the browser Clipboard API. Label defaults to “Copy”; a status reports success/failure and clears after 2.5 seconds. Requires the browser to permit clipboard access. |
| `SecretField` | `label: string`, `value: string` | Read-only password/text display with a labelled Show/Hide button. Masking is presentation: the supplied value is already available to the browser. The application controls whether a user may receive or reveal a secret. |
| `ConfirmDialog` | `open`, `onOpenChange`, `title: string`, `description: string`, `onConfirm: () => void \| Promise<void>`, `confirmLabel?`, `danger?`, `confirmationText?` | Confirm label defaults to “Confirm”; `danger` defaults to false. Optional confirmation text must match exactly. Disables confirmation and closing while pending, closes after success, and keeps a generic error visible for retry after rejection. The callback must throw/reject on failure. |
| `ToastProvider` | children | Provides one current notification, replacing the previous message. It clears after five seconds and has a dismiss button. Mount once around consumers of `useToast`. |
| `useToast` | No arguments; returns `{ toast(message: string, tone?: Tone): void }` | Default tone is `success`. Calling outside `ToastProvider` throws. Use for brief feedback; keep errors requiring action, histories and essential instructions in the page. |
| `AuthLayout` | `brand: ReactNode`, `title?: string`, children; `description?`, `aside?`, `footer?` | Uses the canonical Campaign login presentation and existing `AppBrand` slot. Providing `aside` creates a split layout that stacks below 760px; omitting it gives a full-width single panel. Supply `title` for the layout's h1, or omit it when the native form supplies its own heading. Keep one h1 and use `auth-story-title` on a paragraph for a story heading. The application owns form submission, providers, recovery, sessions and routing. |
| `PermissionMatrix` | `roles: readonly string[]`, `permissions: readonly Permission[]`, `value: Readonly<Record<string, readonly string[]>>`, `onChange(role: string, permissionId: string, allowed: boolean)`, `disabled?` | Controlled checkbox table. Each role maps to its allowed permission IDs; omitted roles have no selections. Application code validates, saves and authorizes all changes on the server. |

`AuthLayout` and `AppBrand` work with `@ten98/ui/styles.css` alone. Existing compatibility apps may retain their app-tokens.css, app.css and product.css loading order. Both entry points include the same canonical brand/auth CSS; do not load global app.css solely for AuthLayout. Story headings allow long words to wrap when text is enlarged, while the decorative orbit remains clipped to its panel. Pass the established story children as an `aside` fragment so its brand, story and footnote retain their spacing. The auth container supplies field and action spacing; omit additional form row gaps and keep spacing for app-owned headings and feedback on those elements.

Additional exported types are `ProductOption`, `DateRange`, `ConfirmDialogProps` and `Permission`. `Permission` contains `id`, `label` and optional `description`. Keep product IDs, permission IDs and role names stable and unique. These components do not provide authentication, authorization, secret storage or provider execution.

## Permissions, confirmation and feedback

```tsx
'use client';

import { useState } from 'react';
import {
  Button, ConfirmDialog, PermissionMatrix, ToastProvider, useToast,
} from '@ten98/ui';

const roles = ['Editor', 'Viewer'];
const permissions = [
  { id: 'projects.read', label: 'View projects' },
  { id: 'projects.edit', label: 'Edit projects' },
];

function AccessPanel({ onRevoke }: { onRevoke: () => Promise<void> }) {
  const [value, setValue] = useState<Record<string, string[]>>({
    Editor: ['projects.read', 'projects.edit'],
    Viewer: ['projects.read'],
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  return <>
    <PermissionMatrix
      roles={roles}
      permissions={permissions}
      value={value}
      onChange={(role, permissionId, allowed) => setValue(current => ({
        ...current,
        [role]: allowed
          ? [...(current[role] ?? []), permissionId]
          : (current[role] ?? []).filter(id => id !== permissionId),
      }))}
    />
    <Button variant="danger" onClick={() => setConfirmOpen(true)}>
      Revoke workspace access
    </Button>
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Revoke workspace access?"
      description="The selected member will lose access to this workspace."
      confirmLabel="Revoke access"
      confirmationText="REVOKE"
      danger
      onConfirm={async () => {
        await onRevoke();
        toast('Workspace access revoked.', 'success');
      }}
    />
  </>;
}

export function AccessScreen({ onRevoke }: { onRevoke: () => Promise<void> }) {
  return <ToastProvider><AccessPanel onRevoke={onRevoke} /></ToastProvider>;
}
```

The matrix edits a local draft in this example. Add the application's validated save flow before treating permission changes as persistent. Supply `onRevoke` from an authorized mutation; it must reject when the operation fails so the confirmation remains open. Use server-side authorization for every privileged request, including requests made without this UI.

## Existing application components

`@ten98/ui/app` exports `AppIcon`, `AppBrand`, `AppField`, `AppSelect`, `AppBadge`, `AppEmpty` and `AppStat`. They preserve Campaign and Discover's existing markup, class names and native form behavior. In AuthLayout, text inputs, selects and actions have a minimum control height of max(44px, var(--t98-control-touch, 2.75rem)), so they grow with root text size; checkbox and radio glyph sizing is unchanged. AppField keeps native required validation and its visible asterisk, but hides that decorative marker from assistive technology so the accessible name remains the supplied label. They use `@ten98/ui/app-tokens.css` and `@ten98/ui/app.css`; these styles are separate from the main component API. See [INTEGRATION.md](INTEGRATION.md) for props, styling and ownership.

## Campaign and Discover presentation

All 28 additive exports have live props, state specimens, tokens, accessibility notes and complete public TSX examples in the catalogue.

| Exports | Usage and ownership |
| --- | --- |
| `EvidenceSummary`, `ReviewSummary`, `OperationResults` | App-supplied provenance, exact before/after scope and per-target receipt stages. Compact evidence keeps essential warnings visible. |
| `DestinationPicker`, `MediaStrip`, `ContentPreview` | Controlled exact-account selection, media identity/alt text/order and approximate previews. App owns validation, uploads and provider renderers. |
| `AppliedFilters`, `TrackerStatus`, `ComparisonMetric` | Applied scope, independent installation/receipt observations and supplied comparison values. No freshness or metric math is inferred. |
| `PublishingAgenda`, `DetailWorkspace`, `ConversationThread` | Explicit timezone, responsive list/detail and history/composer slots. App owns schedules, navigation guards, drafts and sending. |
| `AssetDetails`, `AudienceSummary` | Provenance, versions, rights and supplied consent/suppression/import outcomes. No asset pipeline or audience authorization is implemented. |
| `FunnelBreakdown`, `RetentionTable`, `JourneyPath`, `RankComparison` | Supplied counts, rates, cohort states, paths and nullable native ranks. Keep specialized branching graphs and counting semantics in the app. |
| `EvidenceDetail`, `ReportPanel`, `RunCostSummary` | Payload access states, independent widgets and explicit quoted/pending/settled/uncertain accounting. No paid action is generated. |
| `VisualEvidenceFrame`, `ReplayControls` | Alignment-gated overlay, separately authorized evidence and controlled playback/seek requests. Optional `rankedListLabel` names coordinate groups truthfully; omission preserves the ranked-element defaults. Omit unsupported inactivity skipping; a supplied preference without a callback is read-only. App owns capture and replay engine. |
| `OverviewTemplate`, `CollectionTemplate`, `DetailTemplate`, `EditorTemplate`, `SettingsTemplate` | Fixed slot order by task. Compose one inside the app's main landmark; preserve native form association. See [layout rules](LAYOUTS-AND-USAGE.md). |
| `FlowSection` | Smaller feature composition with an h2, optional description/scope/actions and spaced app-owned children. Several feature sections compose a full page template; a flow never mounts a page template. |

The emitted declarations remain the exact prop contract. Existing apps use `product.css` after `app.css`; new screens may load `styles.css`. Long main-API badges wrap within their containing surface.

## Domain boundaries

Integration cards combine `ResourceCard`, `Badge`, `Button` and fields. The shared workspace compositions cover common presentation and interaction; business rules, credentials, protocols and execution stay in the consuming application.

Specialized domain components remain future work until a real tool defines their behavior. Examples include rich-text editors, workflow canvases, drag-based calendar editing, floor-plan viewers, terminals and softphones. `PublishingAgenda` already provides app-resolved calendar records as an accessible list. See [suite coverage](UX-PATTERNS.md#coverage-for-all-ten-tools) for the boundary of every planned product.
