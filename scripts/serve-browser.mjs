import { readdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';

// Test the built catalogue and real HTML fixtures without development-module traffic or HMR.
const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = resolve(root, '.qa/browser-site');
if (!outDir.startsWith(resolve(root) + sep)) throw new Error('Browser build must remain inside this workspace');
const fixtures = readdirSync(resolve(root, 'tests')).filter(file => file.endsWith('.html')).map(file => resolve(root, 'tests', file));
await build({ configFile: false, root, logLevel: 'error', build: {
  // Exercise native light-dark()/color-scheme inheritance as shipped in the library CSS.
  cssTarget: 'esnext', outDir, emptyOutDir: true,
  rolldownOptions: { input: [resolve(root, 'index.html'), ...fixtures] },
} });
const server = await preview({ configFile: false, root, logLevel: 'error', build: { outDir }, preview: {
  host: '127.0.0.1', port: 5196, strictPort: true,
} });
process.stdout.write('Built catalogue and native fixtures ready at http://127.0.0.1:5196/\n');
