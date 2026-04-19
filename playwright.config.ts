import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.demo5') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1, // Tests run in sequence because CP02 → CP04 → CP05 share state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html'], ['list']],

  use: {
    baseURL: process.env.BASE_URL_DEX,
    actionTimeout: 15000,
    viewport: null, // null = uses the actual browser window size
    launchOptions: {
      args: ['--start-maximized'],
    },
    trace: 'on-first-retry',
    screenshot: 'on',
    video: { mode: 'on', size: { width: 1920, height: 1080 } },
  },

  projects: [
    // Runs once before the main suite to save auth session
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
