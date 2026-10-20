import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
// Compile modules separately so Next.js retains client boundaries and consumers can tree-shake.
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.lib.json'], { stdio: 'inherit' });
mkdirSync('dist', { recursive: true });
const authCss = readFileSync('src/lib/auth.css', 'utf8');
const css = file => readFileSync(`src/lib/${file}`, 'utf8').replace("@import './auth.css';", authCss);
for (const file of readdirSync('src/lib').filter(name => name.endsWith('.css'))) writeFileSync(`dist/${file}`, css(file));
writeFileSync('dist/styles.css', ['tokens.css', 'primitives.css', 'patterns.css', 'workspace.css', 'products.css', 'navigation.css', 'structure.css'].map(css).join('\n'));
