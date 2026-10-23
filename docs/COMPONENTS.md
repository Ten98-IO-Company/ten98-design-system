# Component inventory and API

This is the public component inventory for `@ten98/ui`. Import React components from `@ten98/ui` and load `@ten98/ui/styles.css` once at the application root. Campaign and Discover also use the application-compatible entry point described below. The installed package’s emitted TypeScript declarations are the exact versioned API contract.

## Implemented primitives

| Export | Main props | Behavior and limits |
| --- | --- | --- |
| `Button` | Native button props; `variant`, `size`, `loading`, `icon`, `href?`, `component?`, `pressed?`, `fullWidth?` | Defaults to `type="button"`, primary and medium. Loading disables the button and sets busy state. `href` renders a styled anchor (through `component`, a router link with the `Link.component` contract); a disabled or loading anchor drops `href` and sets `aria-disabled`. `pressed` sets `aria-pressed` for toggles. An icon-only button (`icon`, no children) uses a 44px square and warns in development without `aria-label`. |
| `Badge` | `tone`, `palette?`, `dot`, children; span attributes | Status text with optional decorative dot. `palette` (`rose`, `amber`, `lime`, `emerald`, `sky`, `violet`, `fuchsia`) is a decorative user-tag colour that replaces the tone; both meet 4.5:1 in light and dark. Include meaningful text. |
| `Avatar` | `name`, `size`; span attributes | Initials with an accessible name; does not fetch images. |
| `Icon` | `name`, `size`, `title`; SVG attributes | Bundled stroke icons (including `send`, `calendar`, `target`, `billboard`, `link`, `image`, `chart`). Decorative by default; use `title` for a meaningful standalone image and label icon-only buttons. |
| `Card` | `title?`, `description?`, `actions?`, `as?` (`div`/`section`/`article`), `headingLevel?` (2–6, default 3), children; div attributes | Panel with optional header and a 16px gap between direct content children. Its built-in title is an `h3` unless `headingLevel` is set; a titled `section`/`article` is named by it; consider the screen's heading hierarchy. Group buttons in `FormActions`, fields in `FormGrid`. |
| `Input` | Native input attributes and ref | Styled input; choose its native `type`, constraints and controlled/uncontrolled state. |
| `Textarea` | Native textarea attributes and ref | Resizable multiline input; default four rows. |
| `Select` | Native select attributes and ref; `options?: {value, label, disabled?, group?}[]`, `placeholder?`, option children | Browser-native select. Options sharing a `group` render in one optgroup (first-seen order); `placeholder` is a disabled empty first option selected while the value is empty; children render after `options`. For a searchable list use `Combobox`; for several choices use `CheckboxGroup`. |
| `Field` | `label`, `htmlFor?`, `required?`, `description?`, `error?`, children | Connects a label, description and error to its direct control child; marks invalid when an error exists. Without `htmlFor` an id is generated and applied to a child that has none. `required` adds an `aria-hidden` ` *` marker only; set `required` on the control. `count` (`{ value, max, measure? }`) shows "used / max characters" linked to the control, marks it invalid when over, and announces only when it nears or passes the limit. |
| `Checkbox` | Native input attributes except `type`; `label`; ref | Native checkbox inside its label. |
| `Switch` | `label`, `checked`, `onCheckedChange`; button attributes | Controlled switch button; the application saves the value. |
| `Tabs` | `items` (`disabled?` per item), `value`, `onValueChange`, `label?`, `keepMounted?` (default true; false renders only the active panel), `className?` | Controlled tabs and panels with arrow/Home/End navigation that skips disabled tabs. Use route links for navigation between pages. |
| `Dialog` | `open`, `onOpenChange`, `title`, children; `description?`, `footer?`, `className?`, `closeDisabled?`, `onBeforeClose?(reason: 'escape' | 'backdrop' | 'close-button')`, `eyebrow?`, `onSubmit?(data, event)`, `dirty?`, `discardMessage?` | Native modal dialog with focus restoration. `onBeforeClose` runs before Escape, backdrop and close-button closes; returning `false` keeps the dialog open with focus inside, so the app can show its own discard prompt. `closeDisabled` defaults to `false`; when true it disables the close button and suppresses Escape/backdrop close requests. The application handles drafts, submission and confirmation policy. `onSubmit` makes body and footer one form that submits once and cannot close while pending; `dirty` makes Escape, backdrop and close-button ask "Discard unsaved changes?" first (Escape in that prompt keeps editing). `size="wide"` (up to 880px) fits editors; the footer stays visible while the body scrolls. |
| `Alert` | `title?`, `tone`, `variant?` (`default`/`inline`/`banner`), `onDismiss?`, `dismissLabel?`, `actions?`, children; div attributes | Danger uses an alert role and other tones a status role; pass `role` to override. `onDismiss` adds a labelled dismiss button. Optional recovery actions wrap in a separate row beneath the message. |
| `Progress` | `value?`, `label?`, `className?` | Determinate native progress from 0–100, with out-of-range values clamped. Omit `value`, or pass a non-finite one, for an indeterminate bar (`aria-busy`, no value, never 0%; animation stops under reduced motion). Supply confirmed progress rather than an invented percentage. |
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
| `Stack` | `as?`, `gap?` (0–16 token step, default 4), `align?`; native form/fieldset attributes | Vertical rhythm. `as="form"` keeps `action`/`method`; direct buttons and badges keep their intrinsic width. `Stack`, `Inline`, `Grid`, `Heading` and `VisuallyHidden` accept `ref` (for example a host element a third-party map draws into). |
| `Inline` | `as?`, `gap?` (default 2), `align?`, `justify?`, `wrap?` | Wrapping horizontal run for toolbars, badges and metadata. |
| `Grid` | `as?`, `gap?`, `columns?` (1–6 or `auto`), `minItemWidth?` | Responsive columns; fixed counts drop to two under 960px and one under 600px. |
| `FormGrid`, `FormActions`, `FeatureControls` | div attributes | Field columns, the action row after them, and short report filters above full-width results. |
| `Text` | `as?`, `size?`, `tone?`, `weight?`, `align?`, `mono?`, `numeric?`, `truncate?` | Body text, values and inline emphasis; `as="time"` takes `dateTime`. |
| `Heading` | `level` (required), `size?` | Outline level is independent of visual size. |
| `Link` | `href`, `variant?`, `target?`, `component?` | Navigation; pass a router link as `component`. New-tab links get `noopener noreferrer`. |
| `Image` | `alt` (required), `fit?`, `aspect?`, `rounded?`, `fallback?` | Lazy, async-decoded responsive image. When it fails to load, `fallback` (default "Image unavailable") replaces it, never a broken-image glyph; a described image keeps its alt text as the fallback's name. |
| `Blockquote` | `source?`, `cite?` | Quoted text in a figure, with the attribution as its caption; the quote rule mirrors in RTL. |
| `List`, `ListItem` | `ordered?`, `gap?` | Prose lists with markers; use `Stack as="ul"` for unmarked layout lists. |
| `DescriptionList` | `items`, `columns?` | Native label/value pairs. |
| `Option`, `OptionGroup` | native option/optgroup attributes | `Select` children. |
| `VisuallyHidden` | `as?` | Screen-reader-only text. |

## Form and content controls

| Component | Main props | Behavior |
| --- | --- | --- |
| `Disclosure` | `summary`, children, `open?`/`onOpenChange?` or `defaultOpen?`, `variant?`, `actions?` | Native details/summary; actions sit beside the summary, not inside it; browser-initiated opens such as find-in-page stay in sync. |
| `Fieldset` | `legend`, `description?`, `disabled?`, `hideLegend?`, `layout?` | Native fieldset grouping with an optional visually hidden legend. |
| `RadioGroup`, `CheckboxGroup` | `legend`, `name`, `options`, `value`/`defaultValue`, `onValueChange`, `error?` | Labelled 44px choice rows; checkbox lists can scroll in a labelled region (`maxHeight`). |
| `SegmentedControl` | `label`, `options`, `value`, `onValueChange` | Single choice with aria-pressed and roving focus; arrows follow the writing direction. |
| `Combobox` | `label`, `options`, `value`, `onValueChange`, `valueLabel?`, `allowCustom?`, `name?`, `onInputChange?`, `filter?`, `loading?`, `loadError?` | Type-to-filter list ported from the WAI-ARIA APG list-autocomplete pattern (see THIRD_PARTY_NOTICES.md); announces the result count; a hidden input carries the value for native forms. Options may carry a `description` shown under the label. An option with `disabled` (and `disabledReason`) is listed but not pickable, with the reason stated. For app-fetched results, `onInputChange` reports the typed text, `filter={false}` shows options as supplied, and `loading`/`loadError` are shown and announced; `valueLabel` names a value that is no longer among the results. |
| `Form` | `onSubmit?(data, event)`, `busy?`, `gap?`, `fieldErrors?`, native form attributes | A native form whose controls sit in a fieldset that is disabled while a submit is pending or `busy`; repeat submits are ignored, `FormData` includes the submitter, native validation runs first, and focus returns to the submitting control. `fieldErrors` (by field name; render each with `Field error`) moves focus to the first invalid field when it arrives. Without `onSubmit` it posts natively. Use it instead of a raw `form`. |
| `Popover` | `label`, `triggerLabel`, `triggerIcon?`, `triggerAriaLabel?`, `placement?`, `open?`/`onOpenChange?`, `disabled?`, children | A non-modal panel anchored to its trigger (native `popover`): top layer, Escape and outside click close it, focus moves in and back to the trigger. Placement flips above or below and stays inside the viewport, mirrored in RTL. The panel is a labelled non-modal dialog. |
| `MultiCombobox` | `label`, `options`, `values`, `onValuesChange`, `name?`, `required?`, `max?`, `inputValue?`/`onInputValueChange?`, plus the async props above | Several picks from a list: aria-multiselectable listbox with check marks, Enter or click toggles and keeps the list open, removable tags, Backspace in the empty input removes the last pick, announced adds and removals. One hidden input per value. Adds and removals are announced from the `values` the app commits, so a pick it rejects is never announced. `max` lists further options as not pickable with the reason; `inputValue` makes the typed text app-owned, never cleared on pick or blur. Behaviour follows Downshift `useMultipleSelection` and react-aria `useComboBox` loading. |
| `Pager` | `onPrevious?`, `onNext?`, `status?` | Previous/next navigation with a polite status; an absent handler disables that end. |
| `LoadMore` | `onLoadMore`, `hasMore`, `busy?`, `shown?`, `total?`, `itemLabel?`, `unavailableReason?`, `endMessage?` | Cursor "load more": a polite count status ("Showing 50 of 120 messages"), a button that stays focusable while busy, an explicit reason when more exist but cannot be loaded, and an end message. |
| `MediaPlayer` | `kind`, `label`, `src?`, `type?`, `poster?`, `width?`, `height?`, `tracks?`, `transcript?`, `downloadHref?`, `unavailable?` | Native audio or video controls named by a visible caption; nothing autoplays and only metadata preloads. Caption tracks and a collapsed transcript give text equivalents. A playback failure shows a reason and the download link; `unavailable` replaces the player. `preload="none"` fetches nothing until play, for long lists of voice notes. |
| `CodeBlock`, `InlineCode` | `code`, `language?`, `wrap?`, `maxHeight?`, `copy?` | Read-only code with an optional copy button; long blocks scroll in a focusable region. |
| `StatusLine` | `tone?`, `busy?`, `live?` | Inline loading or result status announced politely. |
| `Scroller` | `label`, children | Focusable, labelled horizontal scroll region for wide content. |
| `FieldList` | `legend`, `name`, `items`, `getKey`, `renderItem(item, index, {name, id})`, `onAdd`, `onRemove`, `onMove?`, `addLabel`, `removeLabel`, `min?`, `max?`, `emptyMessage?`, `error?` | Repeatable field rows in a fieldset; each row is a list item with a hidden "Item N of M" heading and `helpers.name('time')` yields `slots.0.time`. Add focuses the new row, Remove the next row or Add; a polite status announces added, removed and moved. Move up/down buttons only (no drag); min/max disable Remove/Add with the reason shown. Behaviour credited to react-aria reordering announcements (Apache-2.0) and APG dynamic-content guidance. |
| `AccountScopePicker` | `connections`, `accounts` (`null` = loading), `connectionId`, `accountId`, `onConnectionChange`, `onAccountChange`, `connectHref?`/`onConnect?`, `labels?`, `required?`, `error?`, `name?` | Choose a connection (Select, with an Expired/Error badge and explanation), then the account: radio buttons for up to six, a list-only Combobox for more. Changing the connection calls `onAccountChange('')` before the app sets any default. `name` yields `${name}.connection` and `${name}.account` for native forms. `disabled` shows both choices read-only. |
| `DateTimeField` | `label`, `type?`, `value`, `onValueChange`, `timeZoneLabel?` | Native date/time input that shows the app's time zone; the app converts zones. |
| `FileField` | `label`, `onFiles`, `files?`, `onRemove?`, `accept?`, `multiple?` | Keyboard file chooser plus a drop zone with an announced status; listed files show size, a status and a labelled remove button; an uploading file shows its `progress` (0-100) as a percentage, or an indeterminate bar when unknown. |
| `Meter` | `label`, `value`, `min?`, `max?`, `low?`, `high?`, `optimum?` | Native meter with a visible value. |
| `MetricGrid` | `minItemWidth?`, `list?`, `label?` | Responsive grid of `MetricCard`s; `unavailable` cards never read as 0. |

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
| `PasswordRecoveryFlow` | request `{email}`, reset `{password, confirmation, token?}` | Availability `loading`/`enabled`/`disabled`/`error`; `sent` and `invalid` states; `onRequestNewLink` adds a request-a-new-link action below the reset form; a password mismatch also shows a focused form-level alert. The token stays in memory; the flow never touches the URL. |
| `InvitationAcceptFlow` | `{name?, password?, token?}` | `loading`, `details`, `signin-required`, `mismatch`, `unavailable`, `accepted`. `signInLabel` renames the sign-in action; every busy state sets `aria-busy`. |
| `WorkspaceOnboarding` | `{name}` | Signed in without project access: create a workspace, refresh, account and sign out. |
| `OidcProviderButtons` | `providers`, `onStart?` | Providers with `href` are native links (one provider is fine); others call `onStart`. Loading, error and pending states: the error shows below the buttons, which stay usable, and `pending` shows a polite `pendingLabel` status. |
| `AuthStory`, `AppStateScreen`, `AuthErrorBoundary` | — | Side-panel story; full-screen `loading`/`error`/`unconfirmed`/`boundary` states; a boundary whose `onReload` recovers in place. |

## Implemented work patterns

| Export | Main props | Behavior and limits |
| --- | --- | --- |
| `AppShell` | `sidebar`, children; `topbar?`, `banners?`, `navigation?`, `sidebarLabel?`, `skipLinkLabel?`, `mainLabel?`, `header?` (legacy) | The whole app frame: skip link (focuses `main` without touching the URL hash), named sidebar, topbar header outside `main`, banner stack and main landmark. With `navigation` it adds the mobile drawer (focus trap, Escape, shade) through `useSidebarNavigation`. |
| `AccountMenu` | `name`, `email?`, `avatar?`, `items?`, `linkComponent?`, `label?`, `defaultOpen?`; `children` (deprecated) | One header account disclosure. `items` are typed links, buttons (busy, disabled, danger) and separators, so apps write no elements; sign-out and navigation handlers stay app-owned. |
| `SidebarFooter` | `version`, children, `className?` | Settings, optional connection utilities and the actual app version. Keep profile identity and sign out in the header AccountMenu. |
| `AppTopbar` | `breadcrumb`, `wrap?` (wrap long labels instead of truncating), `menuToggle?`, `search?`, `badge?`, `actions?` | Breadcrumb with the current page, drawer toggle (inside `AppShell navigation`), search, status badge and account actions. |
| `SidebarNav` | `label`, `groups`, `linkComponent?`, `filter?`, `onNavigate?`, `emptyFilter?` | Grouped navigation. Items take `href` (a key your `linkComponent` resolves), `onSelect(item, event)` or both; `preventDefault()` in `onSelect` cancels navigation, modified clicks keep the browser default. `filter` matches labels and `keywords`; fully filtered groups hide. |
| `SectionNav` | `label`, `items` (`id`, `label`, `href`, `current?`, `badge?`), `linkComponent?`, `onSelect?(item, event)` | URL-bound section strip (Tabs without panels): a nav landmark with a list of links, `aria-current="page"` on the current one, one scrollable row on narrow screens, 44px targets. Not tabs: no `role="tab"`, no arrow keys. `onSelect` is the same guard as `SidebarNav` (`preventDefault()` cancels navigation; modified clicks keep the browser default). |
| `WorkspaceProjectSwitcher` | `workspaces`, `projects`, `workspaceId`, `projectId`, `onWorkspaceChange`, `onProjectChange`, `create?` | User > Workspace > Project selection with role caption, initials, loading, empty and create states. The app chooses the default project. |
| `SearchField` | `label`, `value`, `onValueChange`, `status?`, `onClear?`, `shortcut?`, `variant?` | Search input with a persistent polite status region, clear button and display-only shortcut hint. |
| `Banner`, `SidebarStatus` | `tone`, children/`label`, `action?`, `onDismiss?` | Workspace-level notices above content (sample data, a required security step) and the sidebar connection note. |
| `useSidebarNavigation` | `open`, `onOpenChange`, `sidebarRef`, `triggerRef`, `mediaQuery?` | Adds responsive drawer focus handling and inertness to existing app navigation. Spread returned `sidebarProps` and `contentProps` as described in [sidebar usage](SIDEBAR.md). The app owns routes, permissions and draft guards. |
| `PageHeader` | `title`, `eyebrow?`, `description?`, `actions?` | Page `h1`, context and actions; actions wrap on narrow screens. |
| `DataTable<T>` | `columns`, `rows`, `rowKey`, `caption` or `ariaLabel`; options below | Local search, column sort, pagination and optional selection, or a controlled view of server-sorted, filtered and paged rows. Native table with scroll region. |
| `MetricCard` | `label`, `value` or `unavailable`, `change?`, `trend?`, `chart?`, `hint?` | Formatted value and optional change/trend graphic. `unavailable` replaces the value, change and chart and is never shown as 0. Application supplies all calculations and formatting. |
| `MetricGrid` | children (`MetricCard`s), `minItemWidth?: 'sm' | 'md' | 'lg'`, `list?` + `label` | Responsive auto-fill grid of MetricCards (10, 14 or 18rem minimum). `list` with `label` exposes a labelled list; `label` alone adds a labelled group. |
| `Sparkline` | `values`, `label`, `color?` | Display-only SVG trend; ignores nonfinite values. Include text/tabular detail when exact values matter. |
| `EmptyState` | `title`, `description: ReactNode`, `icon?`, `action?` | Empty or filtered-empty explanation and next action. |
| `ActivityFeed` | `items` (`description?` is ReactNode) | Ordered activity presentation. Application supplies readable timestamps and sanitized event content. |
| `ResourceCard` | `title`, `description: ReactNode`, `icon?`, `status?`, children, `actions?`, `media?`, `tags?` | Shared presentation for a connection, server, property, campaign or other resource. `media` puts a thumbnail at the top in place of the icon; `tags` lists short labels as badges. |
| `SettingsSection` | `title`, `description`, children | Labelled section with explanation and fields; stacks at narrow widths. |
| `SettingsPanel` | `title`, `description?`, `onSubmit?(form: FormData)` or native `action`/`method`, `submitLabel?`, `submitDisabled?`, `actions?`, children, plus `busy`, `busyLabel`, `error`, `unconfirmed`, `notice`, `fieldErrors`, `disabled`, `hideTitle` | The section frame the library's own settings flows use, for an app's own settings screens: heading, outcome alerts, a fieldset that locks busy or read-only content, single-submit (a double submit calls `onSubmit` once) and focus on a new error or invalid field. Built-in flows share this implementation, so every flow takes `hideTitle` to drop its visible heading inside a Dialog that already shows it (the section keeps the title as its name). |
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
| `caption` / `ariaLabel` | Accessible table name and part of the search label. Provide exactly one; `caption` is visually hidden unless `captionHidden={false}` |
| `searchable` | Defaults to `true` |
| `searchPlaceholder` | Defaults to “Search records…” |
| `pageSize` | Defaults to `5`; invalid values fall back to 5 |
| `selectable` | Defaults to `false`; enables row checkboxes |
| `onSelectionChange` | Receives the selected row keys |
| `selectedKeys` | Controlled selection. The table keeps no selection state, reflects the set in the row and select-all checkboxes, and does not prune it; the app updates it from `onSelectionChange` |
| `activeKey`, `onRowActivate(row, key)` | List-detail. `activeKey` marks one row `aria-current="true"` (not `aria-selected`, which a native table row does not support and which would blur with checkbox selection). With `onRowActivate`, a click on a cell or Enter/Space on the focused row activates it; clicks on checkboxes, buttons, links and other controls do not. Rows become one roving tab stop: ArrowUp/ArrowDown move between rows, Home/End jump |
| `rowDetail(row)`, `expandedKeys`, `onExpandedChange(keys)` | Adds a leading disclosure column. The button has `aria-expanded` and `aria-controls`; an expanded row's detail renders in a following full-width row (`colSpan`), also when stacked. Expansion is uncontrolled unless `expandedKeys` is given |
| `emptyTitle` | Defaults to “No records found” |
| `emptyDescription` | Replaces “New records will appear here.”; `null` shows the title alone |
| `emptyState` | Replaces the default empty state |
| `searchable`, `sortable`, `pagination` | Each `false` removes that feature; all three `false` is a plain table with no toolbar. Per column, `sortable: false` removes one sort button |
| `sort`, `onSortChange(sort)` | Controlled sort. The table does not reorder rows; it reflects `sort` in `aria-sort` and reports the next `{ key, direction }` |
| `page`, `onPageChange(change)` | Controlled paging: `{ index, size, total? }` (zero-based `index`) or `{ cursor: { hasPrevious, hasNext } }`, each with optional `status`. Rows are not sliced. `change` is `{ direction, index? }`. Without `total`, Next is offered while the page is full |
| `search`, `onSearchChange(query)` | Controlled search; the application filters |
| `rowActions(row)`, `rowActionsLabel` | Trailing actions cell with a visually hidden column header (default “Actions”) |
| `loading` | Busy status line and `aria-busy`; the empty state is withheld |
| `unavailable` | Error/unavailable content (with the app's retry) that replaces the rows and pager. Distinct from empty |
| `stickyHeader`, `density`, `responsive` | Header stays visible while the region scrolls vertically; `'comfortable' | 'compact'`; `'scroll'` or `'stack'` (label/value pairs below 600px, table roles kept) |
| `footerCells` | Totals row aligned by index to `columns` |

Column options: `align` (`start | end | center`), `numeric` (end-aligned, tabular numerals), `wrap`, `minWidth` (`sm | md | lg`), `rowHeader` (`th scope="row"`), `hidden`. A missing cell value (`null`, `undefined`, `NaN`, or a `render` result of those) shows “—” with hidden text “Not available”; it is never shown as 0.

Search and sort use the raw property matching `column.key`, or `sortValue` when supplied. A custom `render` changes the display only; provide `sortValue` for derived or formatted cells. Numbers sort numerically and other values use an `Intl.Collator`. Source rows are not mutated.

Row keyboard behaviour is a behaviour-only port of the WAI-ARIA APG grid/table guidance and react-aria's `useTable` row actions (Apache-2.0). The scroll region stays a separate tab stop so a wide table can be scrolled by keyboard.

Selection persists across filtering and pages. The header checkbox selects or clears the current page only, with a mixed state for partial page selection. Removed rows are pruned from selection. The app owns bulk actions, access checks and result feedback; it should explain the selection scope before an operation.

By default this is a small local-dataset table. For a server collection supply `sort`/`onSortChange`, `page`/`onPageChange` and `search`/`onSearchChange`: the app fetches, sorts, filters and slices, and the table only presents the rows it is given and reports the user's request. Give `page.total` (or use a cursor) so the pager never presents one page as the full collection. It does not provide virtualization, editable cells or column resizing.

`filterAndSortRows(rows, columns, query?, sort?)` is exported for the same nonmutating local operations. `TableSort` contains `key` and `direction: 'asc' | 'desc'`. `DataColumn`, `DataTableProps`, `TableSort`, `TableIndexPage`, `TableCursorPage`, `TablePageChange`, `MetricCardProps`, `MetricGridProps` and `ActivityItem` are exported types.

## Shared workspace compositions

| Export | Exact props | Behavior and limits |
| --- | --- | --- |
| `ProductSwitcher` | `products: readonly ProductOption[]`, `value: string`, `onValueChange(value: string)`, `label?`, `disabled?` | Labelled native select; label defaults to “Product”. Options contain `id`, `name`, optional `description`. The application changes navigation, scope and loaded data. |
| `DateRangeField` | `label: string`, `start: string`, `end: string`, `onChange(range: DateRange, problem: string \| null)`, `disabled?`, `min?`, `max?`, `maxDays?`, `endExclusive?`, `error?` | Two native date inputs. Use ISO date-only values (`YYYY-MM-DD`) or an empty string. Every edit calls `onChange`, even an invalid range, with the shown `problem` (or `null`) so the app can block submission; the field then explains it (end before start, outside `min`/`max`, longer than `maxDays` counting both ends) and marks both inputs invalid. `endExclusive` shows and edits the last included day while reporting the day after, for half-open APIs. `error` replaces the built-in checks. No timezone conversion or presets. |
| `CopyButton` | `value: string`, `label?`, `messages?` | Copies through the browser Clipboard API, then the legacy copy command. If both fail the value is selected in a visible read-only field with a notice, so a person can copy it by hand. Label defaults to “Copy”; success clears after 2.5 seconds. |
| `SecretField` | `label: string`, `value: string` | Read-only password/text display with a labelled Show/Hide button. Masking is presentation: the supplied value is already available to the browser. The application controls whether a user may receive or reveal a secret. |
| `ReviewConfirm` | `title`, `acknowledgements`, `reviewKey`, `confirmLabel`, `onConfirm`, `children?`, `onCancel?`, `tone?`, `busy?`, `disabledReason?`, `error?` | Inline, non-modal review before a consequential action: a summary, required acknowledgements bound to `reviewKey` (a new key clears them and announces it), and a confirm button that stays focusable (`aria-disabled`) with a visible reason until every check is made. Confirms once per press; `tone="danger"` uses the danger rule and button. Use `ConfirmDialog` for a modal interruption. `autoFocus` moves focus to its heading when it replaces the control that opened it. |
| `useConfirmDialog(defaults?)` | Returns `[confirm, dialog]`: render `dialog`, then `await confirm({ title, description, confirmLabel?, cancelLabel?, danger?, confirmationText?, acknowledgement? })`. Resolves `true` on confirm and `false` on cancel, Escape, a newer request, or unmount. Focus returns to the control that opened it. `defaults` apply to every request (for example `{ danger: true }`). Use it instead of `window.confirm`. |
| `ConfirmDialog` | `open`, `onOpenChange`, `title: string`, `description: string`, `onConfirm: () => void \| Promise<void>`, `confirmLabel?`, `danger?`, `confirmationText?`, `children?: ReactNode`, `acknowledgement?: string` | `children` render above the actions; `acknowledgement` adds a required checkbox and, with `confirmationText`, both must be satisfied before confirming. Confirm label defaults to “Confirm”; `danger` defaults to false. Optional confirmation text must match exactly. Disables confirmation and closing while pending, closes after success, and keeps a generic error visible for retry after rejection. The callback must throw/reject on failure. `cancelLabel` names the close button, for example "Keep editing". |
| `ToastProvider` | children | Provides one current notification, replacing the previous message. It clears after five seconds and has a dismiss button. Mount once around consumers of `useToast`. |
| `useToast` | No arguments; returns `{ toast(message: string, tone?: Tone): void }` | Default tone is `success`. Calling outside `ToastProvider` throws. Use for brief feedback; keep errors requiring action, histories and essential instructions in the page. |
| `AuthLayout` | `brand: ReactNode`, `title?: string`, children; `description?`, `aside?`, `footer?`, `surface?` (`card`, `plain`) | Uses the canonical Campaign login presentation and existing `AppBrand` slot. Providing `aside` creates a split layout that stacks below 760px; omitting it gives a full-width single panel. On wide screens the split story panel fills at least the viewport height. Supply `title` for the layout's h1, or omit it when the native form supplies its own heading. Keep one h1 and use `auth-story-title` on a paragraph for a story heading. The application owns form submission, providers, recovery, sessions and routing. `surface="card"` shows the form as a bordered card on the canvas: centred on its own, or centred in the form column beside an `aside`. Since 0.21.0 the default is `card` without an `aside` and `plain` (the open form column) with one. The auth flows and `AppStateScreen` accept the same `surface`. |
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
| `ValidationSummary` | Per-destination preflight results (`items`: `target`, `status` error/warning/ok, `messages` with optional `href` to the field), a polite counted status ("1 destination needs a fix, 1 to check"), `checkedAt`, `onRecheck`, `busy`, and `stale`, which keeps old results but marks them out of date with its own Check again action. |
| `EvidenceSummary`, `ReviewSummary`, `OperationResults` | App-supplied provenance, exact before/after scope and per-target receipt stages. Compact evidence keeps essential warnings visible. Operation statuses: `submitted`, `accepted`, `delivered`, `observed`, `pending`, `unknown`, `confirmed`, `error` (Failed), and the neutral `suppressed` and `skipped` for targets deliberately not sent. |
| `SandboxedPreview` | Untrusted HTML (such as an email) in a `sandbox=""` frame with a content policy placed before the document: no scripts, forms, popups, link navigation, meta refresh or network loads; only inline styles and data images, plus https images with `allowRemoteImages`. `viewport` (375 or 600px) scrolls inside a focusable region; `height` sm/md/lg; white canvas in every theme. |
| `DestinationPicker`, `MediaStrip`, `ContentPreview` | Controlled exact-account selection, media identity/alt text/order and approximate previews. A `MediaItem` with `url` and `type` and no `preview` is previewed as an image, video or audio player; known `width`/`height`, `duration` and `size` are listed and missing ones are left out. `ContentPreview` takes `chrome`: `card` (default), `post`, `story` (9:16, text on a solid scrim) or `message` (an outgoing bubble), all neutral with no platform logos, colours or trademarks. It also takes `device` (mobile 375px or desktop 600px), `thread` (later posts, numbered), `captionLimit` (a plain-text caption cut with a Show full caption toggle that states `aria-expanded`), `poll` and `firstComment`. App owns validation, uploads and provider renderers. |
| `AppliedFilters`, `TrackerStatus`, `ComparisonMetric` | Applied scope, independent installation/receipt observations and supplied comparison values. No freshness or metric math is inferred. |
| `SelectableList` | The list side of `DetailWorkspace`: a listbox of items (`title`, `preview` clipped to two lines, `meta`, `leading`, `unread`, `status`, `disabled`) with one roving tab stop. Arrows, Home and End move focus without selecting; Enter, Space or a click calls `onSelect`. Unread counts are stated in text; the selected item has a bar and a tint. `footer` takes `LoadMore`. |
| `PublishingAgenda`, `DetailWorkspace`, `ConversationThread` | Explicit timezone, responsive list/detail and history/composer slots. Messages take `direction` (shown as Received or Sent), per-message `actions` (a group named by author and time) and `removed` with `removedReason` (content and attachments withheld), and `replies` nest up to three levels; `headingLevel` sets the thread heading (DetailWorkspace takes it too, with panes one level below). `hasOlder`/`onLoadOlder`/`olderLoading`/`olderUnavailableReason` put a `LoadMore` above the first message. App owns schedules, navigation guards, drafts, sending and moderation. |
| `AssetDetails`, `AudienceSummary` | Provenance, versions, rights and supplied consent/suppression/import outcomes. No asset pipeline or audience authorization is implemented. |
| `FunnelBreakdown`, `RetentionTable`, `JourneyPath`, `RankComparison` | Supplied counts, rates, cohort states, paths and nullable native ranks. Keep specialized branching graphs and counting semantics in the app. |
| `EvidenceDetail`, `ReportPanel`, `RunCostSummary` | Payload access states, independent widgets and explicit quoted/pending/settled/uncertain accounting. No paid action is generated. |
| `VisualEvidenceFrame`, `ReplayControls` | Alignment-gated overlay, separately authorized evidence and controlled playback/seek requests. Optional `rankedListLabel` names coordinate groups truthfully; omission preserves the ranked-element defaults. Omit unsupported inactivity skipping; a supplied preference without a callback is read-only. App owns capture and replay engine. |
| `OverviewTemplate`, `CollectionTemplate`, `DetailTemplate`, `EditorTemplate`, `SettingsTemplate` | Fixed slot order by task. Compose one inside the app's main landmark; preserve native form association. See [layout rules](LAYOUTS-AND-USAGE.md). |
| `FlowSection` | Smaller feature composition with an h2, optional description/scope/actions and spaced app-owned children. Several feature sections compose a full page template; a flow never mounts a page template. |

The emitted declarations remain the exact prop contract. Existing apps use `product.css` after `app.css`; new screens may load `styles.css`. Long main-API badges wrap within their containing surface.

## Charts

Presentation only: the application computes every value, total and summary; the library draws and describes them. Geometry is a small internal port of d3 pure functions (ISC; see `THIRD_PARTY_NOTICES.md`) with no d3 dependency.

- Data contract: `ChartValue = number | null`; `ChartPoint { x, xLabel, y, state?: 'observed' | 'partial' | 'unavailable', note? }`; `ChartSeries { id, label, points, role?: 'primary' | 'comparison', tone?: 1-5, unavailable? }`.
- Missing is never zero. A null or unavailable point is a hatched column labelled "Unavailable" (and "Unavailable" in the data table); a partial point has a dashed outline or ring and "(partial)" in the table; a line breaks at a gap. A comparison series is outlined, not filled. Series differ by pattern, dash and marker as well as colour (`--t98-chart-1` to `--t98-chart-5`).
- `TimeSeriesChart` (`kind`: `bars`, `grouped-bars`, `stacked-bars`, `line`, `area`; `xScale`, `xDomain`, `yDomain`, `formatY`, `baselineLabel`, `formatXTick`, `tableColumns`, `onInspect`, `notice`, `loading`, `emptyMessage`). The plot fills the figure (measured with a ResizeObserver, deterministic 640px server width), keeps a minimum width per point and scrolls inside its focusable region; it stays left to right in RTL. Axis labels are thinned to every Nth point (first and last always kept), never overlap, and a long label is truncated with the full text in a hover title; `formatXTick(point, index)` supplies short labels and the data table keeps the full text. `fit="compress"` fits every point into the figure (for example 90 daily or 60 per-minute points) instead of scrolling, with thinned labels and the same keyboard inspection and table; `minStep` sets the minimum width per point (48 scrolling; none compressing, so the chart takes the figure width). `ChartPoint.title` replaces a mark's hover text; announcements keep the value. Line styles combine five tones with a dash pattern that shifts every five series, so up to 25 series stay distinct; bars have five fills, so fold extra series with `foldChartSeries(series, keep, label)`, which sums known values per point, marks a point `partial` when some folded values are missing and unavailable when all are. ArrowLeft/Right move the point, Home/End jump, ArrowUp/Down switch series; a polite live region announces "x · series: value (partial|unavailable)". The `summary` is referenced by the SVG through `aria-describedby`, with a computed "N points, minimum, maximum, N unavailable" line and a `<details>` data table of every point.
- `WeekdayHourGrid`: a weekday by hour table (`values` of seven rows × 24, `weekdays`, `formatValue?`, `hourLabels?`) inside a focusable scroll region, forced left to right. Every cell shows its value as text at 4.5:1 or better; shading is supplementary, in square-root steps; null or missing cells are hatched and read Unavailable.
- `BarList`: ordered list with visible value text, optional `secondary` value (`value: null` reads Unavailable), `href` links, `onSelect` buttons with `aria-pressed`, and a `reason` for partial or unavailable items. `busy` makes selectable rows inert with `aria-disabled` (focus stays on the row) while the app applies a filter. Selectable rows are 44px targets.
- `ProportionBar` and `ShareChart`: legend with counts and shares; `total` null shows "Unavailable" and 0 shows the empty message ("No samples" by default). `ShareChart` adds an `aria-hidden` donut and a table with a total row. A segment `count` of `null` reads Unavailable in the legend and table, is left out of the graphic, and a note names it; it is never drawn as 0. A `total` of `null` keeps each segment's count and states that shares cannot be shown. The donut shrinks with its card. Segments, swatches and donut slices share per-tone hatch, dot and stripe fills, so they never differ by colour alone.
- `Sparkline` and `MetricCard.chart` accept `(number | null)[]`; a missing value leaves a gap.
- Forced-colors mode uses system colours with visible hatching. Charts are checked at 320px and doubled text for page overflow.

## Maps, evidence and calendar

| Exports | Usage and ownership |
| --- | --- |
| `EmbedHost` | Sized, named host for a third-party SDK such as a map: `label` (region name), `ref` to the empty mount the SDK owns, `size` `sm` 230px / `md` 300px / `lg` 390px, `narrowSize` under 760px, or `aspect` `video` / `wide` / `square`. `busy` covers the mount with `loadingLabel`; `fallback` replaces it (for example a missing key) while the mount stays hidden in place. The app keeps the SDK loader and keys. |
| `CountryMap` | Choropleth over app-supplied `shapes` and `viewBox`; the library ships no geometry, so the app supplies and attributes the paths. Countries with `rows` form one roving tab stop (arrows move in name order and mirror in RTL, Shift with arrows pans, `+`/`-` zoom 1-4); others show a no-data pattern. A details table always lists values plus Mapped, Unknown and Not recorded totals (`null` reads Unavailable, never 0). `approximate` adds a visible simplified-boundaries note; `overlapping` marks values as non-additive estimates, so the Mapped total reads "Not summed: estimates overlap". |
| `HeatmapPlane`, `HeatmapRankedList` | Image-role click-density (square-root opacity) or scroll-band overlay for `VisualEvidenceFrame`, forced left-to-right, with a table equivalent for the ranked slot. A null count or share reads Unavailable. `pointSize` (percent of the plane width, default 7) shrinks click points for tall documents with many groups. |
| `IsolatedPlayerFrame` | Runs an app-owned player script (for example rrweb) on hostile data in a `data:` document, whose opaque origin keeps `allow-scripts allow-same-origin` away from the app; `srcDoc`, `src`, `blob:` and same-origin sources are refused. The document starts with a CSP that blocks every connection; the script loads with a per-mount nonce (`integrity` supported). Protocol v1 over a MessageChannel: the only window message transfers the port; the player must answer with this mount's token before `payload` is sent; `ready`/`tick`/`ended` are schema-checked; anything else, or no `ready` within `timeoutMs` (8000), destroys the player, with a Retry that remounts. `ref.send()` validates play, pause, speed and position. An `ArrayBuffer` or typed-array `payload` (for example the recording encoded with `TextEncoder`) is transferred as a fresh copy instead of deep-cloned: about 3 ms instead of about 260 ms for a 13.5 MB recording. Threat model: issue #17. |
| `ReplayViewer` | Hosts an app-authorized `srcDoc` or `src` with no referrer, never `allow-same-origin`. A `srcDoc` document runs no scripts by default (`sandbox=""` and `script-src 'none'`), because a script could navigate its own frame to send data out; a `contentPolicy` that allows scripts must pin them with `'sha256-…'` sources or a fresh, unpredictable `'nonce-…'` (at least 22 characters, new on every render, never taken from the recording or a build id) (any other script source, including `'unsafe-inline'`, is refused with a visible reason); run scripted players on hostile data in `IsolatedPlayerFrame`. A `src` player keeps `sandbox="allow-scripts"`. The policy (`contentPolicy`, default `defaultReplayContentPolicy`) is placed before the document and allows inline styles and data/blob media while blocking every fetch; a `src` player must send its own CSP header. `reason` replaces the frame when unavailable. `ReplayControls` render outside the frame. |
| `CalendarMonth` | Month grid only (use `PublishingAgenda` for lists). Follows the APG date-picker grid: one tab stop, arrows (mirrored in RTL), Home/End within the week, PageUp/PageDown call `onPrev`/`onNext`. UTC dates, explicit `locale`, today and outside-month states, a day name that states its entry count, and a create button that stays visible and disabled with `createDisabledReason`. `isCreatable(iso)` limits which days offer Create (for example `iso => iso >= today`). Long entry labels wrap inside their day. |

## Domain boundaries

Integration cards combine `ResourceCard`, `Badge`, `Button` and fields. The shared workspace compositions cover common presentation and interaction; business rules, credentials, protocols and execution stay in the consuming application.

Specialized domain components remain future work until a real tool defines their behavior. Examples include rich-text editors, workflow canvases, drag-based calendar editing, floor-plan viewers, terminals and softphones. `PublishingAgenda` already provides app-resolved calendar records as an accessible list. See [suite coverage](UX-PATTERNS.md#coverage-for-all-ten-tools) for the boundary of every planned product.
