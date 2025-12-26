import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 * Phase 9: E2Eテスト（ユーザー視点で全機能を徹底検証）
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3247',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3247',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
