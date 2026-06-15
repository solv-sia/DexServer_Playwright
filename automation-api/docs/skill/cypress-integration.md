# Cypress Integration

Integrate automation-api reporter into a Cypress project using native `on()` event hooks in `cypress.config.ts`.

---

## Where to add the code

Edit the project's `cypress.config.ts`. Locate the `setupNodeEvents(on, config)` function inside `e2e` (or `component`).

---

## Full integration example

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';
import * as fs from 'fs';

const API_URL = process.env.AUTOMATION_API_URL ?? 'http://localhost:3050';
const API_TOKEN = process.env.AUTOMATION_API_TOKEN ?? '';
const RUN_ID = Number(process.env.TESTRAIL_RUN_ID ?? '0');
const PROJECT = process.env.PROJECT_NAME ?? 'unknown';
const USE_TESTRAIL = process.env.USE_TESTRAIL === 'true';

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_TOKEN}`,
  'User-Agent': 'Cypress/13.6.0.0',
};

function extractCypressId(title: string | string[]): string | null {
  const re = /@?C?-?(\d+)/i;
  const candidates = Array.isArray(title) ? title : [title];
  for (const s of candidates) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

export default defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on('before:run', async () => {
        if (!USE_TESTRAIL) return;
        const res = await fetch(`${API_URL}/api/init`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({
            runId: RUN_ID,
            project: PROJECT,
            framework: 'cypress',
            debug: false,
          }),
        });
        const data = await res.json();
        console.log(`[dex-reporter] initialized — ${data.mappingsLoaded} mappings loaded`);
      });

      on('after:spec', async (_spec, results) => {
        if (!USE_TESTRAIL || !results?.tests) return;

        for (const test of results.tests) {
          const cypressId = extractCypressId(test.title);
          if (!cypressId) continue;

          const status =
            test.state === 'passed' ? 'passed' :
            test.state === 'pending' ? 'untested' :
            'failed';

          try {
            await fetch(`${API_URL}/api/result`, {
              method: 'POST',
              headers: HEADERS,
              body: JSON.stringify({
                runId: RUN_ID,
                cypressId,
                status,
                comment: test.state === 'failed'
                  ? `FAILED: ${test.displayError ?? 'unknown error'}`
                  : 'Test passed',
                elapsed: `${Math.ceil((test.duration ?? 0) / 1000)}s`,
              }),
            });
          } catch (err) {
            console.error(`[dex-reporter] failed to send result for ${cypressId}:`, err);
          }

          // Optional: upload video
          if (results.video && test.state === 'failed') {
            try {
              const form = new FormData();
              form.append('file', new Blob([fs.readFileSync(results.video)]), 'video.mp4');
              form.append('runId', String(RUN_ID));
              form.append('cypressId', cypressId);
              await fetch(`${API_URL}/api/video`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${API_TOKEN}`, 'User-Agent': 'Cypress/13.6.0.0' },
                body: form,
              });
            } catch (err) {
              console.error(`[dex-reporter] video upload failed for ${cypressId}:`, err);
            }
          }
        }
      });
    },
  },
});
```

---

## Env vars

```env
AUTOMATION_API_URL=http://localhost:3050
AUTOMATION_API_TOKEN=<value of TOKEN in automation-api/.env>
TESTRAIL_RUN_ID=123
PROJECT_NAME=server
USE_TESTRAIL=true
```

---

## Test title format

```typescript
it('Login with valid credentials @C1234', () => { ... });
it('[C5678] Submit checkout form', () => { ... });
```

---

## Migration from legacy DexReporter

Replace this block:

```typescript
import DexReporter from '@cypress-monorepo/shared/reporter/dex-reporter';
const dexReporter = new DexReporter({ ... });
dexReporter.registerCypressHandler(on, config);
```

With the `before:run` + `after:spec` handlers shown above.

Do **not** delete `shared/reporter/dex-reporter.ts` — other projects may still use it.
