import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
// Compile modules separately so Next.js retains client boundaries and consumers can tree-shake.
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.lib.json'], { stdio: 'inherit' });
mkdirSync('dist', { recursive: true });
for (const file of readdirSync('src/lib').filter(name => name.endsWith('.css'))) cpSync(`src/lib/${file}`, `dist/${file}`);
writeFileSync('dist/styles.css', ['tokens.css', 'primitives.css', 'patterns.css', 'workspace.css'].map(file => readFileSync(`src/lib/${file}`, 'utf8')).join('\n'));
