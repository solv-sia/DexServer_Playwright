# Playwright Integration

Two approaches: **Custom Reporter** (recommended for full runs) or **Fixture helper** (per-test granular control).

---

## Approach A — Custom Reporter (recommended)

Create `reporter/dex-reporter.ts` in the project root, then register it in `playwright.config.ts`.

### reporter/dex-reporter.ts

```typescript
import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';

const API_URL = process.env.AUTOMATION_API_URL ?? 'http://localhost:3050';
const API_TOKEN = process.env.AUTOMATION_API_TOKEN ?? '';
const RUN_ID = Number(process.env.TESTRAIL_RUN_ID ?? '0');
const PROJECT = process.env.PROJECT_NAME ?? 'unknown';

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_TOKEN}`,
  'User-Agent': 'Cypress/13.6.0.0',
};

function extractCaseId(title: string): string | null {
  const m = title.match(/@?C?-?(\d+)/i);
  return m ? m[1] : null;
}

function mapStatus(status: TestResult['status']): string {
  switch (status) {
    case 'passed': return 'passed';
    case 'failed':
    case 'timedOut':
    case 'interrupted': return 'failed';
    case 'skipped': return 'untested';
    default: return 'untested';
  }
}

class DexReporter implements Reporter {
  private initialized = false;

  async onBegin(_config: FullConfig, _suite: Suite) {
    if (process.env.USE_TESTRAIL !== 'true') return;
    try {
      const res = await fetch(`${API_URL}/api/init`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          runId: RUN_ID,
          project: PROJECT,
          framework: 'playwright',
          debug: false,
        }),
      });
      const data = await res.json();
      console.log(`[dex-reporter] initialized — ${data.mappingsLoaded} mappings loaded`);
      this.initialized = true;
    } catch (err) {
      console.error('[dex-reporter] init failed:', err);
    }
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    if (!this.initialized) return;

    const title = test.title;
    const caseId = extractCaseId(title);
    if (!caseId) return;

    const status = mapStatus(result.status);
    const elapsed = `${Math.ceil(result.duration / 1000)}s`;
    const comment = result.status === 'failed'
      ? `FAILED: ${result.errors.map(e => e.message).join(' | ')}`
      : 'Test passed';

    try {
      await fetch(`${API_URL}/api/result`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ runId: RUN_ID, cypressId: caseId, status, comment, elapsed }),
      });
    } catch (err) {
      console.error(`[dex-reporter] result failed for ${caseId}:`, err);
    }
  }

  async onEnd(_result: FullResult) {
    if (this.initialized) {
      const res = await fetch(`${API_URL}/api/status/${RUN_ID}`, { headers: HEADERS });
      const data = await res.json();
      console.log('[dex-reporter] run complete —', JSON.stringify(data));
    }
  }
}

export default DexReporter;
```

### playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['./reporter/dex-reporter.ts'],
  ],
  // ... rest of config
});
```

---

## Approach B — Fixture helper

Use when you want selective reporting or already have a custom base fixture.

### fixtures/dex-reporter.fixture.ts

```typescript
import { test as base } from '@playwright/test';
import * as fs from 'fs';

const API_URL = process.env.AUTOMATION_API_URL ?? 'http://localhost:3050';
const API_TOKEN = process.env.AUTOMATION_API_TOKEN ?? '';
const RUN_ID = Number(process.env.TESTRAIL_RUN_ID ?? '0');

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_TOKEN}`,
  'User-Agent': 'Cypress/13.6.0.0',
};

function extractCaseId(title: string): string | null {
  const m = title.match(/@?C?-?(\d+)/i);
  return m ? m[1] : null;
}

export const test = base.extend({
  dexReport: [async ({}, use, testInfo) => {
    await use(undefined);

    if (process.env.USE_TESTRAIL !== 'true') return;
    const caseId = extractCaseId(testInfo.title);
    if (!caseId) return;

    const status =
      testInfo.status === 'passed' ? 'passed' :
      testInfo.status === 'skipped' ? 'untested' :
      'failed';

    await fetch(`${API_URL}/api/result`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        runId: RUN_ID,
        cypressId: caseId,
        status,
        elapsed: `${Math.ceil(testInfo.duration / 1000)}s`,
        comment: testInfo.status === 'failed'
          ? `FAILED: ${testInfo.error?.message ?? 'unknown'}`
          : 'Test passed',
      }),
    }).catch(err => console.error('[dex-reporter]', err));
  }, { auto: true }],
});

export { expect } from '@playwright/test';
```

### Usage in test files

```typescript
import { test, expect } from '../fixtures/dex-reporter.fixture';

test('Login with valid credentials @C1234', async ({ page }) => {
  await page.goto('/login');
  // ...
});
```

---

## Global setup (init once)

If using Approach B, add a `globalSetup` to call `/api/init`:

```typescript
// global-setup.ts
export default async function globalSetup() {
  if (process.env.USE_TESTRAIL !== 'true') return;
  await fetch(`${process.env.AUTOMATION_API_URL}/api/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AUTOMATION_API_TOKEN}`,
      'User-Agent': 'Cypress/13.6.0.0',
    },
    body: JSON.stringify({
      runId: Number(process.env.TESTRAIL_RUN_ID),
      project: process.env.PROJECT_NAME,
      framework: 'playwright',
    }),
  });
}
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  // ...
});
```

---

## Env vars

```env
AUTOMATION_API_URL=http://localhost:3050
AUTOMATION_API_TOKEN=<TOKEN>
TESTRAIL_RUN_ID=123
PROJECT_NAME=server
USE_TESTRAIL=true
```

---

## Test title format

```typescript
test('Submit checkout form @C5678', async ({ page }) => { ... });
test('[C1234] Login with valid credentials', async ({ page }) => { ... });
```
