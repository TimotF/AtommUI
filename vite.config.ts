import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'node:fs';
export default defineConfig({
  plugins: [vue(), { name: 'compact-profile-css', generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'compact.css', source: readFileSync(new URL('./src/compact.css', import.meta.url)) });
  } }],
  build: {
    target: 'es2022',
    lib: { entry: { index: 'src/index.ts', theme: 'src/theme.ts', three: 'src/three.ts' }, formats: ['es'], fileName: (_format, entryName) => entryName === 'index' ? 'atomm-ui.js' : `${entryName}.js`, cssFileName: 'atomm-ui' },
    rolldownOptions: { external: (id: string) => /^(vue|vuetify|three|@xmldom\/xmldom)(\/|$)/.test(id) },
  },
});
