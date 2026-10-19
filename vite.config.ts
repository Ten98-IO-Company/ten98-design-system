import { defineConfig } from 'vite';
export default defineConfig({ build: { outDir: 'site-dist', cssTarget: 'esnext' }, server: { strictPort: true, watch: { ignored: ['**/.qa/**', '**/playwright-report/**', '**/test-results/**', '**/site-dist/**'] } } });
