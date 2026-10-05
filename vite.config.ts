import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2022',
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'atomm-ui', cssFileName: 'atomm-ui' },
    rolldownOptions: { external: (id: string) => /^(vue|vuetify)(\/|$)/.test(id) },
  },
});
