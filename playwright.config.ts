import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import configJson from './utils/configuration.json';

dotenv.config({ path: path.resolve(__dirname, '.env.demo5') });

const reporters: Parameters<typeof defineConfig>[0]['reporter'] = [['html'], ['list']];
if (configJson.useTestRail) {
  reporters.push(['./utils/testrailReporter']);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1, // Tests run in sequence because CP02 → CP04 → CP05 share state
  timeout: 300000,
  expect: { timeout: 15000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  globalSetup: configJson.useTestRail ? './utils/globalSetup' : undefined,
  reporter: reporters,

  use: {
    baseURL: process.env.BASE_URL_DEX,
    actionTimeout: 30000,
    viewport: { width: 1920, height: 1440 },
    deviceScaleFactor: 1,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: { mode: 'on', size: { width: 1920, height: 1440 } },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts$/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
    },
  ],
});
