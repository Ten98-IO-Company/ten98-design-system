import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { build } from 'vite';
import { API } from 'typescript/unstable/sync';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ui from '../dist/index.js';
import * as app from '../dist/app.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = join(root, '.qa', 'catalogue-tests');
await mkdir(scratch, { recursive: true });
await writeFile(join(scratch, 'entry.ts'), [
  "export * from '../../src/catalog/entries';",
  "export * from '../../src/catalog/navigation';",
  "export * from '../../src/catalog/tokens';",
  "export * from '../../src/catalog/flows';",
  "export { formCode } from '../../src/catalog/Guides';",
  "export { brandCode, loginCode } from '../../src/catalog/BrandReference';",
  "export * from '../../src/catalog/TokenReference';",
].join('\n'));
await build({
  configFile: false, root, logLevel: 'silent',
  build: {
    ssr: join(scratch, 'entry.ts'), outDir: scratch, emptyOutDir: false,
    rolldownOptions: { output: { entryFileNames: 'catalogue.mjs' } },
  },
});
const catalogue = await import(pathToFileURL(join(scratch, 'catalogue.mjs')).href);
const { componentEntries, categories, findComponents, tokenNames, legacyAliases, tokenReferences, filterTokens, pages, detailTabs, componentSlug, readRoute, routeHref } = catalogue;
const names = componentEntries.map(entry => entry.name);
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `${label} must be unique`);

test('every public component has usable props, token links, examples and renderable states', () => {
  const exported = [...Object.keys(ui), ...Object.keys(app)].filter(name => /^[A-Z]/.test(name) || name === 'useSidebarNavigation');
  assert.deepEqual([...names].sort(), exported.sort(), 'Every shipped component is documented exactly once');
  unique(names, 'Component names');
  unique(names.map(componentSlug), 'Component URLs');
  unique(categories, 'Categories');
  for (const entry of componentEntries) {
    assert.ok(entry.description.trim() && entry.usage.trim(), `${entry.name} explains its purpose and usage`);
    assert.ok(entry.accessibility.length && entry.accessibility.every(Boolean), `${entry.name} includes accessibility guidance`);
    unique(entry.props.map(prop => prop.name), `${entry.name} props`);
    for (const prop of entry.props) assert.ok(prop.name && prop.type && prop.description, `${entry.name}.${prop.name} has a complete contract`);
    assert.ok(entry.props.length || entry.nativeProps, `${entry.name} documents its custom or native props`);
    for (const token of entry.tokens) assert.ok(tokenNames.includes(token), `${entry.name} references existing token ${token}`);
    for (const related of entry.related ?? []) assert.ok(names.includes(related), `${entry.name} links to existing component ${related}`);
    assert.ok(entry.states.length, `${entry.name} exposes supported states`);
    unique(entry.states.map(state => state.name), `${entry.name} states`);
    for (const state of entry.states) {
      assert.ok(state.name && state.description && state.code, `${entry.name}: ${state.name} includes its explanation and TSX`);
      assert.doesNotThrow(() => renderToStaticMarkup(state.preview), `${entry.name}: ${state.name} renders`);
    }
  }
});

test('every copyable component, state and guide example compiles as a standalone strict TSX file', async t => {
  const examples = componentEntries.flatMap(entry => [
    [entry.name, entry.example],
    ...entry.states.map((state, index) => [`${entry.name}-${index + 1}`, state.code]),
  ]);
  for (const recipe of catalogue.flowRecipes) examples.push([recipe.id, recipe.code]);
  for (const name of ['formCode', 'brandCode', 'loginCode', 'tokenExampleCode']) examples.push([name, catalogue[name]]);
  const directory = join(scratch, 'examples');
  await mkdir(directory, { recursive: true });
  for (const [name, code] of examples) {
    assert.equal(typeof code, 'string', `${name} provides a complete example`);
    assert.match(code, /import\s[\s\S]+from\s+['"]@ten98\/ui(?:\/app|\/tokens)?['"]/, `${name} imports the public API`);
    assert.match(code, /export default function\s+\w+\(/, `${name} is a standalone component file`);
    await writeFile(join(directory, `${name}.tsx`), code);
  }
  // Explicit files keep stale scratch examples from affecting later test runs.
  const config = join(scratch, 'tsconfig.json');
  // Frameworks supply this ambient type for native CSS imports.
  await writeFile(join(directory, 'styles.d.ts'), "declare module '*.css';\n");
  await writeFile(config, JSON.stringify({
    compilerOptions: { target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true },
    files: ['examples/styles.d.ts', ...examples.map(([name]) => `examples/${name}.tsx`)],
  }));
  const api = new API({ cwd: root });
  let snapshot;
  try {
    snapshot = api.updateSnapshot({ openProjects: [config] });
    const project = snapshot.getProject(config);
    assert.ok(project, 'The generated TSX project loads');
    assert.equal(project.rootFiles.length, examples.length + 1, 'The compiler checks every copyable file and the CSS declaration');
    const program = project.program;
    const diagnostics = [
      ...program.getConfigFileParsingDiagnostics(), ...program.getProgramDiagnostics(), ...program.getGlobalDiagnostics(),
      ...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics(),
    ];
    assert.deepEqual(diagnostics, [], JSON.stringify(diagnostics, null, 2));
  } finally {
    snapshot?.dispose();
    api.close();
  }
  t.diagnostic(`${examples.length} standalone TSX files compile against the public declarations`);
});

test('copied template states render the same content as their live previews', async () => {
  const states = componentEntries.filter(entry => entry.name.endsWith('Template')).flatMap(entry => entry.states);
  const directory = join(scratch, 'template-copies');
  await mkdir(directory, { recursive: true });
  for (const [index, state] of states.entries()) await writeFile(join(directory, `state-${index}.tsx`), state.code);
  const entry = join(directory, 'entry.ts');
  await writeFile(entry, states.map((_, index) => `export { default as State${index} } from './state-${index}';`).join('\n'));
  await build({
    configFile: false, root, logLevel: 'silent',
    resolve: { alias: { '@ten98/ui': join(root, 'dist/index.js') } },
    build: { ssr: entry, outDir: directory, emptyOutDir: false, rolldownOptions: { output: { entryFileNames: 'copies.mjs' } } },
  });
  const copies = await import(pathToFileURL(join(directory, 'copies.mjs')).href);
  for (const [index, state] of states.entries()) assert.equal(renderToStaticMarkup(createElement(copies[`State${index}`])), renderToStaticMarkup(state.preview), state.name);
});

test('flow recipes render and have complete task/state/ownership contracts', () => {
  unique(catalogue.flowRecipes.map(recipe => recipe.id), 'Flow URLs');
  for (const recipe of catalogue.flowRecipes) {
    assert.ok(recipe.steps.length >= 3 && recipe.states.length >= 5 && recipe.ownership && recipe.products);
    assert.doesNotThrow(() => renderToStaticMarkup(createElement(recipe.Preview)));
    assert.equal(readRoute(routeHref('Flows', { component: recipe.id })).component, recipe.id);
  }
  const researched = catalogue.flowRecipes.filter(recipe => recipe.researchId);
  assert.deepEqual(researched.map(recipe => recipe.researchId).sort(), [...Array.from({ length: 8 }, (_, i) => `C${i + 1}`), ...Array.from({ length: 17 }, (_, i) => `D${i + 1}`)].sort(), 'All 25 research flows appear exactly once');
  for (const recipe of researched) {
    assert.ok(recipe.references?.length && recipe.acceptance?.length >= 3, `${recipe.researchId} has reference comparisons and concrete acceptance cases`);
    for (const reference of recipe.references) assert.ok(reference.label && new URL(reference.url).protocol === 'https:');
  }
});

test('component search and shareable URLs retain filters, tabs and special characters', () => {
  for (const page of pages) {
    for (const tab of detailTabs) {
      const options = { tab, query: 'email & rôle? #2', group: 'Data display' };
      assert.deepEqual(readRoute(routeHref(page, options)), { page, component: undefined, ...options });
    }
  }
  for (const name of names) {
    const route = readRoute(routeHref('Components', { component: name, tab: 'States' }));
    assert.equal(route.component, componentSlug(name));
    assert.equal(route.tab, 'States');
  }
  for (const hash of ['', '#unknown', '#components/button?tab=unknown', '#components/%broken?q=%E0%A4%A']) {
    assert.doesNotThrow(() => readRoute(hash));
    assert.equal(readRoute(hash).page, 'Components');
    assert.equal(readRoute(hash).tab, 'Overview');
  }
  assert.deepEqual(findComponents(''), componentEntries);
  assert.ok(findComponents(' bUtToN  LOADING ').some(entry => entry.name === 'Button'), 'Search covers component names and state names regardless of case');
  assert.deepEqual(findComponents('Button nonexistent-state-4589'), [], 'All search terms must match');
  for (const category of categories.slice(1)) {
    const result = findComponents('', category);
    assert.ok(result.length && result.every(entry => entry.category === category), `Category ${category} limits results`);
  }
  assert.deepEqual(findComponents('unmatched-catalogue-term-4589'), []);
});

test('token names, aliases and typed references resolve to the shipped CSS source', async () => {
  const css = await readFile(join(root, 'dist', 'tokens.css'), 'utf8');
  const compatibility = await readFile(join(root, 'dist', 'app-tokens.css'), 'utf8');
  const declared = new Set([...css.matchAll(/(--t98-[\w-]+)\s*:/g)].map(match => match[1]));
  assert.deepEqual(new Set(tokenNames), declared, 'The catalogue covers the full shipped token inventory');
  unique(tokenNames, 'Canonical tokens');
  const shippedAliases = Object.fromEntries([...compatibility.matchAll(/(--[\w-]+)\s*:\s*var\(\s*(--[\w-]+)\s*\)/g)]
    .filter(([, alias, canonical]) => !alias.startsWith('--t98-') && canonical.startsWith('--t98-'))
    .map(([, alias, canonical]) => [alias, canonical]));
  assert.deepEqual(legacyAliases, shippedAliases, 'The catalogue covers every shipped compatibility alias');
  assert.ok(Object.keys(legacyAliases).length, 'Existing apps have documented aliases');
  for (const [alias, canonical] of Object.entries(legacyAliases)) {
    assert.ok(declared.has(canonical), `${alias} resolves to canonical ${canonical}`);
  }
  for (const [token, reference] of Object.entries(tokenReferences)) {
    const path = reference.replace(/^tokens\./, '').replace(/\[(\d+)\]/g, '.$1').split('.');
    const value = path.reduce((current, key) => current?.[key], ui.tokens);
    assert.equal(value, `var(${token})`, `${reference} resolves to the documented CSS variable`);
    assert.ok(declared.has(token));
  }
  assert.deepEqual(filterTokens(''), tokenNames);
  assert.ok(filterTokens(' aCcEnT COLORS ').includes('--t98-accent'), 'Token search combines semantic names and categories');
  assert.ok(filterTokens('tokens.space[4]').includes('--t98-space-4'), 'Typed token paths are searchable');
  assert.deepEqual(filterTokens('accent nonexistent-token-4589'), []);
});
