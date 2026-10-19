export const pages = ['Components', 'Flows', 'Templates', 'Design tokens', 'Brand & login', 'Getting started', 'Patterns', 'Guidelines', 'Changelog'] as const;
export type Page = typeof pages[number];
export const detailTabs = ['Overview', 'Examples', 'Props', 'Tokens', 'States'] as const;
export type DetailTab = typeof detailTabs[number];
export interface CatalogueRoute { page: Page; component?: string; tab: DetailTab; query: string; group: string }
const paths: Record<Page, string> = { Components: 'components', Flows: 'flows', Templates: 'templates', 'Design tokens': 'tokens', 'Brand & login': 'brand', 'Getting started': 'getting-started', Patterns: 'patterns', Guidelines: 'guidelines', Changelog: 'changelog' };
export const componentSlug = (name: string) => name.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();

export function readRoute(hash: string): CatalogueRoute {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const [section, component] = path.split('/');
  const params = new URLSearchParams(query);
  const page = pages.find(name => paths[name] === section) ?? 'Components';
  const tab = detailTabs.find(name => name.toLowerCase() === params.get('tab')) ?? 'Overview';
  return { page, component: (page === 'Components' || page === 'Flows') && component ? component : undefined, tab, query: params.get('q') ?? '', group: params.get('group') ?? 'All' };
}

export function routeHref(page: Page, options: { component?: string; tab?: DetailTab; query?: string; group?: string } = {}) {
  const params = new URLSearchParams();
  if (options.tab && options.tab !== 'Overview') params.set('tab', options.tab.toLowerCase());
  if (options.query) params.set('q', options.query);
  if (options.group && options.group !== 'All') params.set('group', options.group);
  return `#${paths[page]}${options.component ? '/' + componentSlug(options.component) : ''}${params.size ? '?' + params.toString() : ''}`;
}
