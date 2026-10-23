import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
// Compile modules separately so Next.js retains client boundaries and consumers can tree-shake.
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.lib.json'], { stdio: 'inherit' });
mkdirSync('dist', { recursive: true });
const authCss = readFileSync('src/lib/auth.css', 'utf8');
const css = file => readFileSync(`src/lib/${file}`, 'utf8').replace("@import './auth.css';", authCss);
for (const file of readdirSync('src/lib').filter(name => name.endsWith('.css'))) writeFileSync(`dist/${file}`, css(file));
// tokens.css and styles.css load the self-hosted font from ./fonts next to them.
cpSync('src/lib/fonts', 'dist/fonts', { recursive: true });
writeFileSync('dist/styles.css', ['tokens.css', 'primitives.css', 'patterns.css', 'workspace.css', 'products.css', 'navigation.css', 'structure.css', 'shell.css', 'controls.css', 'account-flows.css', 'workspace-flows.css', 'charts.css', 'spatial.css'].map(css).join('\n'));
