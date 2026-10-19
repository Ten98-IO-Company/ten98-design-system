import { useState } from 'react';
import {
  FunnelBreakdown, RetentionTable, JourneyPath, RankComparison,
  type FunnelBreakdownProps, type RetentionTableProps, type JourneyPathProps, type RankComparisonProps,
} from '../lib/analytics.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

type DemoMode = 'ready' | 'selected' | 'empty' | 'loading' | 'error' | 'partial' | 'stale' | 'zero' | 'unavailable' | 'readonly' | 'graph';
const modes = ['ready', 'selected', 'empty', 'loading', 'error', 'partial', 'stale', 'zero', 'unavailable', 'readonly'] as const;
const stateNames: Record<DemoMode, string> = {
  ready: 'Supplied observations', selected: 'Controlled selection', empty: 'Empty result', loading: 'Loading with retained observations', error: 'Failed refresh with retained observations', partial: 'Partial coverage', stale: 'Stale snapshot', zero: 'Measured zero', unavailable: 'Unavailable observation', readonly: 'Read-only', graph: 'App-rendered graph slot',
};
const notices: Partial<Record<DemoMode, string>> = {
  loading: 'Loading a new observation. The retained result still uses the scope and timestamp above.',
  error: 'Refresh failed. The previous successful result and its original observation context remain visible.',
  partial: 'Partial coverage: the app reports an incomplete observation window. Missing observations are not zero.',
  stale: 'Stale snapshot: the latest attempt failed; the values retain their original observation date.',
  unavailable: 'An observation is unavailable. Its reason is shown separately from measured values.',
};
const surfaceTokens = ['--t98-font', '--t98-text', '--t98-muted', '--t98-surface', '--t98-border', '--t98-radius', '--t98-space-2', '--t98-space-3', '--t98-space-4', '--t98-text-sm'];
const selectionTokens = ['--t98-focus', '--t98-accent', '--t98-accent-soft', '--t98-control-touch'];
const prop = (name: string, type: string, description: string, required = false): ComponentProp => ({ name, type, description, required });
const contextProps = [
  prop('label', 'string', 'Visible heading and accessible section name.', true),
  prop('context', 'ReactNode', 'Visible applied scope, range, timezone, units, observation time and measurement definitions; all supplied by the app.', true),
  prop('notice', 'ReactNode', 'App-owned loading/error/partial/stale/permission explanation. Can compose Alert and actions; never alters data.'),
  prop('loading', 'boolean', 'Sets aria-busy while the consumer loads. Retained observations and their original context stay visible.'),
  prop('emptyMessage', 'ReactNode', 'App-supplied empty explanation; an empty collection is not a measured zero.'),
  prop('className', 'string', 'Additional class on the outer section.'),
];
const selectionProps = [
  prop('selectedId', 'string', 'Controlled stable step id; no automatic first selection.'),
  prop('onSelect', '(id: string) => void', 'Requests selection. Omit for read-only labels.'),
  prop('disabled', 'boolean', 'Disables supplied selection buttons using native disabled semantics.'),
];

function funnelFixture(mode: DemoMode): FunnelBreakdownProps {
  return {
    label: 'Checkout funnel · synthetic observations',
    context: 'Scope: example.test · 1–18 October 2026 · UTC · unique visitors · this order · 30-minute consecutive-step window · rates use landing entrants · observed 18 October, 08:00 UTC.',
    notice: notices[mode], loading: mode === 'loading', disabled: mode === 'loading',
    selectedId: mode === 'selected' ? 'purchase' : undefined,
    emptyMessage: 'No saved funnel steps match this scope. Configure the supported page or event conditions in the app.',
    steps: mode === 'empty' ? [] : [
      { id: 'landing', label: 'Landing page', count: '1,200', detail: 'Condition: page is /landing. The app defines identity and entry qualification.' },
      { id: 'purchase', label: 'Purchase accepted', count: mode === 'unavailable' ? null : mode === 'zero' ? 0 : '120',
        conversion: mode === 'unavailable' ? null : mode === 'zero' ? '0% of landing entrants' : '10% of landing entrants',
        reason: mode === 'unavailable' ? 'Purchase partition could not be read.' : undefined,
        conversionReason: mode === 'unavailable' ? 'The completion observation is missing.' : undefined,
        detail: 'Condition: accepted purchase event. Counts and rate text are independent app inputs.' },
    ],
  };
}
function FunnelDemo({ mode }: { mode: DemoMode }) {
  const props = funnelFixture(mode);
  const [selectedId, setSelectedId] = useState(props.selectedId);
  return <FunnelBreakdown {...props} selectedId={selectedId} onSelect={mode === 'readonly' ? undefined : setSelectedId} />;
}
function funnelCode(mode: DemoMode = 'ready') {
  const setup = `const props: FunnelBreakdownProps = ${JSON.stringify(funnelFixture(mode), null, 2)};`;
  return mode === 'readonly' ? tsx(['FunnelBreakdown', 'type FunnelBreakdownProps'], '<FunnelBreakdown {...props} />', setup)
    : tsx(['FunnelBreakdown', 'type FunnelBreakdownProps'], '<FunnelBreakdown {...props} selectedId={selectedId} onSelect={setSelectedId} />', `${setup}\nconst [selectedId, setSelectedId] = useState<string | undefined>(props.selectedId);`, ['useState']);
}

function retentionFixture(mode: DemoMode): RetentionTableProps {
  return {
    label: 'Weekly return retention · synthetic observations',
    context: 'Scope: example.test · signup cohorts 5–18 October 2026 · UTC · unique signed-in users returning in each calendar week · observed 18 October, 08:00 UTC. Percentages are supplied by the app.',
    notice: notices[mode], loading: mode === 'loading',
    emptyMessage: 'No eligible signup cohorts in this range. No retention percentage is implied.',
    columns: [{ id: 'week-0', label: 'Week 0' }, { id: 'week-1', label: 'Week 1' }, { id: 'week-2', label: 'Week 2' }],
    cohorts: mode === 'empty' ? [] : [
      { id: 'oct-5', label: '5–11 October', size: '200 users', cells: {
        'week-0': { status: 'observed', value: '100%' },
        'week-1': mode === 'unavailable' ? { status: 'unavailable', reason: 'Week 1 source partition is unavailable.' } : { status: 'observed', value: mode === 'zero' ? 0 : '24%', detail: mode === 'zero' ? 'Confirmed zero returning users in the observed interval.' : '48 returning users; 200 eligible users. The app supplied the rate.' },
        'week-2': { status: 'future', reason: 'Week 2 has not completed for this cohort.' },
      } },
      { id: 'oct-12', label: '12–18 October', size: '180 users', cells: {
        'week-0': { status: 'observed', value: '100%' },
        'week-1': { status: 'future', reason: 'Week 1 has not completed for this cohort.' },
        'week-2': { status: 'future', reason: 'Week 2 has not completed for this cohort.' },
      } },
    ],
  };
}
function retentionCode(mode: DemoMode = 'ready') {
  return tsx(['RetentionTable', 'type RetentionTableProps'], '<RetentionTable {...props} />', `const props: RetentionTableProps = ${JSON.stringify(retentionFixture(mode), null, 2)};`);
}

function journeyFixture(mode: DemoMode): JourneyPathProps {
  return {
    label: 'Landing to cart path · synthetic observations',
    context: 'Scope: example.test · 1–18 October 2026 · UTC · sessions · first three supplied transitions after /landing · top 10 paths only · observed 18 October, 08:00 UTC. This bounded path is not a complete journey census or a funnel conversion measure.',
    notice: notices[mode], loading: mode === 'loading', disabled: mode === 'loading',
    selectedId: mode === 'selected' ? 'cart' : undefined,
    emptyMessage: 'No observed path matches these boundaries. No journey count is implied.',
    steps: mode === 'empty' ? [] : [
      { id: 'landing', label: '/landing', count: '800', detail: 'App-defined starting boundary; session count.' },
      { id: 'product', label: '/product', count: '320', detail: 'Second supplied transition. Counts are not summed or converted into rates.' },
      { id: 'cart', label: '/cart', count: mode === 'unavailable' ? null : mode === 'zero' ? 0 : '64', reason: mode === 'unavailable' ? 'This path dimension was not available in the retained snapshot.' : undefined, detail: 'Third supplied transition; downstream paths are outside this scope.' },
    ],
  };
}
function JourneyDemo({ mode }: { mode: DemoMode }) {
  const props = journeyFixture(mode);
  const [selectedId, setSelectedId] = useState(props.selectedId);
  return <JourneyPath {...props} selectedId={selectedId} onSelect={mode === 'readonly' ? undefined : setSelectedId}
    graph={mode === 'graph' ? <figure><figcaption>App supplied path diagram</figcaption><p>/landing → /product → /cart</p></figure> : undefined} />;
}
function journeyCode(mode: DemoMode = 'ready') {
  const setup = `const props: JourneyPathProps = ${JSON.stringify(journeyFixture(mode), null, 2)};`;
  return mode === 'readonly' ? tsx(['JourneyPath', 'type JourneyPathProps'], '<JourneyPath {...props} />', setup)
    : tsx(['JourneyPath', 'type JourneyPathProps'], `<JourneyPath {...props} selectedId={selectedId} onSelect={setSelectedId}${mode === 'graph' ? '\n  graph={<figure><figcaption>App supplied path diagram</figcaption><p>/landing → /product → /cart</p></figure>}' : ''} />`, `${setup}\nconst [selectedId, setSelectedId] = useState<string | undefined>(props.selectedId);`, ['useState']);
}

function rankFixture(mode: DemoMode): RankComparisonProps {
  return {
    label: 'Project rank history · synthetic observations',
    context: 'Scope: example.test · Google · UAE · mobile · UTC · position within top 100 organic results. Lower position numbers rank higher. Dates and configuration belong to each original observation; changes are app supplied.',
    currentLabel: '18 October 2026, 08:00 UTC', previousLabel: '11 October 2026, 08:00 UTC',
    notice: notices[mode], loading: mode === 'loading',
    emptyMessage: 'No completed rank observations for saved keywords in this configuration.',
    rows: mode === 'empty' ? [] : [
      { id: 'shared-inbox', label: 'shared inbox', current: mode === 'unavailable' ? null : 3, previous: 6,
        currentReason: mode === 'unavailable' ? 'Latest source access was revoked; no current observation is supplied.' : undefined,
        change: mode === 'unavailable' ? null : '3 positions higher', changeReason: mode === 'unavailable' ? 'A current observation is required for comparison.' : undefined,
        source: 'Synthetic rank provider · Google UAE mobile · observed top 100', detail: 'Target: example.test/inbox' },
      { id: 'team-inbox', label: 'team inbox', current: null, previous: mode === 'partial' ? null : 24,
        currentReason: 'Not found within the observed top 100; position beyond that range is unknown.',
        previousReason: mode === 'partial' ? 'The previous run did not cover this keyword.' : undefined,
        change: null, changeReason: 'No compatible pair of observed ranks.', source: 'Synthetic rank provider · Google UAE mobile · observed top 100' },
    ],
  };
}
function rankCode(mode: DemoMode = 'ready') {
  return tsx(['RankComparison', 'type RankComparisonProps'], '<RankComparison {...props} />', `const props: RankComparisonProps = ${JSON.stringify(rankFixture(mode), null, 2)};`);
}

export const analyticsEntries: ComponentEntry[] = [
  {
    name: 'FunnelBreakdown', category: 'Data display', description: 'Ordered funnel steps with independent app supplied counts, conversion text, reasons and controlled selection.',
    usage: 'Use for Discover D4 results after the app defines identity, order, window and denominator. Supply already formatted counts and rates independently. The component performs no count/rate math and does not build or run a funnel query. Keep the applied scope and observation context visible while refreshing.',
    props: [...contextProps, prop('countLabel', 'string', 'App-supplied counting-unit label, such as Estimated visitors. Defaults to Count.'), prop('steps', 'readonly FunnelStep[]', 'Stable id, label, count:string | number | null; optional count reason, conversion:string | null, conversionReason and detail:ReactNode. Null means unavailable; omitted conversion is not rendered.', true), ...selectionProps],
    tokens: [...surfaceTokens, ...selectionTokens],
    accessibility: ['A labelled section and ordered list retain the supplied step order. Count/rate labels and unavailable reasons remain visible as text.', 'Selection uses native buttons with aria-pressed, Tab, Enter and Space. Without onSelect the labels are read-only; selectedId never falls back to the first step.', 'Details are visible without hover. App owns any navigation, focus transfer and condition editing.', 'Step headings and detail text wrap on narrow screens. Rates have no bar width or color-only meaning.'], related: ['ComparisonMetric', 'AppliedFilters', 'JourneyPath', 'Alert'],
    example: funnelCode(), states: modes.map(mode => ({ name: stateNames[mode], description: notices[mode] ?? (mode === 'zero' ? 'A supplied completion count of zero and supplied 0% remain distinct from unavailable data.' : mode === 'selected' ? 'The app controls the selected step; native buttons request a new id.' : mode === 'readonly' ? 'Omitting onSelect removes interactive selection buttons.' : 'Synthetic app inputs; selection changes only local presentation state.'), preview: <FunnelDemo mode={mode} />, code: funnelCode(mode) })),
  },
  {
    name: 'RetentionTable', category: 'Data display', description: 'Native cohort table with explicitly observed, future and unavailable cells; measured zero remains zero.',
    usage: 'Use for Discover D5 cohort results. The app supplies columns, cohort sizes, retention values and temporal cell status; no local pagination, query or retention calculation runs. A missing column-id cell renders unavailable. Future cells and missing evidence never become zero. Put cohort definition, timezone, units and observation timestamp in context.',
    props: [...contextProps, prop('columns', 'readonly RetentionColumn[]', 'Stable column id and visible temporal label in app supplied order.', true), prop('cohorts', 'readonly RetentionCohort[]', 'Stable id, cohort label, size:string | number | null, optional sizeReason, and cells keyed by column id. Cell union: observed with value:string | number; future/unavailable with optional reason. All cells accept detail:ReactNode.', true)],
    tokens: [...surfaceTokens, '--t98-cell-padding', '--t98-focus'],
    accessibility: ['Native table, caption, column headers and row headers preserve cohort/period relationships; no ARIA grid or local DataTable behavior is added.', 'A labelled, focusable horizontal scroll region preserves the semantic table at narrow widths.', 'Observed values, Not yet observed, and Unavailable are distinct visible text. Reasons and details stay visible without hover.', 'Read-only by design; app-owned interactive detail content must use its own native control semantics.'], related: ['JourneyPath', 'FunnelBreakdown', 'EvidenceSummary'],
    example: retentionCode(), states: modes.filter(mode => mode !== 'selected').map(mode => ({ name: stateNames[mode], description: notices[mode] ?? (mode === 'zero' ? 'Observed numeric zero stays 0 alongside explicitly future cells.' : mode === 'readonly' ? 'A semantic read-only table with always-visible reasons and details.' : 'The synthetic cohort grid preserves app supplied temporal meaning and unavailable evidence.'), preview: <RetentionTable {...retentionFixture(mode)} />, code: retentionCode(mode) })),
  },
  {
    name: 'JourneyPath', category: 'Data display', description: 'Ordered app supplied path steps, counts and details, with controlled selection and an optional app-rendered graph slot.',
    usage: 'Use for Discover D5 bounded journey inspection. The app owns path discovery, aggregation, identity, truncation and graph rendering. Supply top-N and transition limits in context. The linear ordered path remains available beside an optional graph; selection requests never run a query or alter ordering.',
    props: [...contextProps, prop('countLabel', 'string', 'App-supplied counting-unit label, such as Estimated visitors. Defaults to Count.'), prop('steps', 'readonly JourneyStep[]', 'Stable id, label, count:string | number | null, optional reason and detail:ReactNode in the app supplied order.', true), ...selectionProps, prop('graph', 'ReactNode', 'Optional app-rendered visualization; app supplies its accessible description. The ordered text path is always retained.')],
    tokens: [...surfaceTokens, ...selectionTokens],
    accessibility: ['An ordered list expresses path sequence in document order, including RTL; labels, counts, limits and details are readable text.', 'Native selection buttons expose aria-pressed and support Tab, Enter and Space. Omitting onSelect produces read-only labels.', 'Graph content never replaces the linear keyboard-accessible path. The app owns graph navigation and any graph accessibility.', 'Long route labels and visible details wrap at narrow widths; selection is also identified by the word Selected.'], related: ['RetentionTable', 'FunnelBreakdown', 'AppliedFilters'],
    example: journeyCode(), states: [...modes, 'graph' as const].map(mode => ({ name: stateNames[mode], description: notices[mode] ?? (mode === 'zero' ? 'Confirmed zero remains an observed count; no path rate is inferred.' : mode === 'graph' ? 'A consumer-rendered diagram occupies the graph slot while the ordered path remains available.' : mode === 'selected' ? 'Selection is controlled by stable step id and changes only local demonstration state.' : mode === 'readonly' ? 'No selection callback means a read-only ordered path.' : 'Synthetic app supplied path order, session counts and truncation context.'), preview: <JourneyDemo mode={mode} />, code: journeyCode(mode) })),
  },
  {
    name: 'RankComparison', category: 'Data display', description: 'Current and previous app supplied ranks, observation labels, change text, reasons and source/coverage in a semantic table.',
    usage: 'Use for Discover D13 compatible rank observations. The app owns engine/location/device compatibility, history, rank meaning, source coverage and change calculation. Null means unavailable or outside observed coverage with a reason; it never means rank zero. Failed attempts can retain older valid observations with their original dates and scope.',
    props: [...contextProps, prop('currentLabel', 'string', 'Actual date/range of the supplied current observation; retained data keeps its original label.', true), prop('previousLabel', 'string', 'Actual date/range of the supplied previous observation.', true), prop('rows', 'readonly RankComparisonRow[]', 'Stable id, label, current/previous:string | number | null, required change:string | null and source:string; optional currentReason, previousReason, changeReason and detail:ReactNode. No rank or delta is calculated.', true)],
    tokens: [...surfaceTokens, '--t98-cell-padding', '--t98-focus'],
    accessibility: ['Native table with caption, row headers and explicitly labelled observation columns preserves comparison relationships.', 'The labelled focusable scroll region exposes all columns on narrow screens without changing table semantics.', 'Unavailable ranks and changes show independent visible reasons. App supplied text explains change direction without color alone.', 'Read-only presentation; no sorting, ranking engine, scheduled run or history mutation is implied.'], related: ['ComparisonMetric', 'EvidenceSummary', 'DateRangeField'],
    example: rankCode(), states: modes.filter(mode => mode !== 'selected' && mode !== 'zero').map(mode => ({ name: stateNames[mode], description: notices[mode] ?? (mode === 'readonly' ? 'The table presents supplied rank history with no query or run actions.' : 'Synthetic rank observations preserve source, coverage and missing-rank reasons. No delta is inferred.'), preview: <RankComparison {...rankFixture(mode)} />, code: rankCode(mode) })),
  },
];
