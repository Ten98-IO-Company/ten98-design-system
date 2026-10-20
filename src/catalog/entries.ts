import { inspectionEntries } from './inspection';
import { sidebarEntries } from './sidebar';
import { accountMenuEntries } from './account-menu';
import { reportingEntries } from './reporting';
import { templateEntries } from './templates';
import { layoutEntries } from './layout';
import { coordinationEntries } from './coordination';
import { assetsAudienceEntries } from './assets-audience';
import { analyticsEntries } from './analytics';
import { evidenceEntries } from './evidence';
import { compositionEntries } from './composition';
import { measurementEntries } from './measurement';
import { primitiveEntries } from './primitives';
import { patternEntries } from './patterns';
import { adapterEntries } from './adapters';
import type { ComponentEntry } from './model';

export const componentEntries: ComponentEntry[] = [...primitiveEntries, ...patternEntries, ...adapterEntries, ...evidenceEntries, ...compositionEntries, ...measurementEntries, ...coordinationEntries, ...assetsAudienceEntries, ...analyticsEntries, ...layoutEntries, ...templateEntries, ...reportingEntries, ...inspectionEntries, ...sidebarEntries, ...accountMenuEntries];
export const categories = ['All', ...new Set(componentEntries.map(entry => entry.category))];

export function findComponents(query: string, category = 'All') {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return componentEntries.filter(entry => (category === 'All' || category === entry.category)
    && terms.every(term => [entry.name, entry.category, entry.description, entry.usage, ...entry.states.map(state => state.name)].join(' ').toLocaleLowerCase().includes(term)));
}
