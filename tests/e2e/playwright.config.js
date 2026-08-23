const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: { 
        browserName: 'firefox',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: { 
        browserName: 'webkit',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
});