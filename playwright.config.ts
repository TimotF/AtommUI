import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', workers: 1, retries: 0, timeout: 30_000,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4174', viewport: { width: 1280, height: 900 }, channel: 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview', url: 'http://127.0.0.1:4174', reuseExistingServer: true },
});
