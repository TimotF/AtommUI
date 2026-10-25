import { defineConfig } from '@playwright/test';
const port=Number(process.env.ATOMM_UI_TEST_PORT??4174);
export default defineConfig({
  testDir: './tests/browser', workers: 1, retries: 0, timeout: 30_000,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1280, height: 900 }, channel: 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: `npm run preview -- --port ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: !process.env.ATOMM_UI_TEST_PORT },
});
