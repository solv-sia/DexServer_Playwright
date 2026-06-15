# k6 Integration

k6 uses a functional lifecycle: `setup()` → VU iterations → `teardown()`. There are no per-test hooks like Mocha. The reporter integration uses `setup()` to initialize the session and sends results either inline within `group()` blocks or in bulk from `teardown()`.

---

## Approach A — Inline results per group (recommended)

Send each result immediately after each logical test block using `group()`.

```javascript
// load-test.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const API_URL = __ENV.AUTOMATION_API_URL || 'http://localhost:3050';
const API_TOKEN = __ENV.AUTOMATION_API_TOKEN || '';
const RUN_ID = parseInt(__ENV.TESTRAIL_RUN_ID || '0');
const PROJECT = __ENV.PROJECT_NAME || 'unknown';
const USE_TESTRAIL = __ENV.USE_TESTRAIL === 'true';

const REPORT_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_TOKEN}`,
  'User-Agent': 'Cypress/13.6.0.0',
};

function sendResult(caseId, status, comment, elapsed) {
  if (!USE_TESTRAIL) return;
  http.post(
    `${API_URL}/api/result`,
    JSON.stringify({ runId: RUN_ID, cypressId: caseId, status, comment, elapsed }),
    { headers: REPORT_HEADERS }
  );
}

export function setup() {
  if (!USE_TESTRAIL) return {};
  const res = http.post(
    `${API_URL}/api/init`,
    JSON.stringify({ runId: RUN_ID, project: PROJECT, framework: 'k6', debug: false }),
    { headers: REPORT_HEADERS }
  );
  const data = JSON.parse(res.body);
  console.log(`[dex-reporter] initialized — ${data.mappingsLoaded} mappings loaded`);
  return { initialized: true };
}

export default function () {
  const BASE = __ENV.BASE_URL || 'https://your-api.example.com';

  // C1234 — GET /health
  group('GET /health @C1234', () => {
    const start = Date.now();
    const res = http.get(`${BASE}/health`);
    const ok = check(res, { 'status 200': r => r.status === 200 });
    sendResult('C1234', ok ? 'passed' : 'failed', ok ? 'OK' : `status=${res.status}`, `${Math.ceil((Date.now() - start) / 1000)}s`);
  });

  // C1235 — POST /api/login
  group('POST /api/login @C1235', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE}/api/login`,
      JSON.stringify({ username: 'admin', password: 'secret' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    const ok = check(res, {
      'status 200': r => r.status === 200,
      'has token': r => JSON.parse(r.body).token !== undefined,
    });
    sendResult('C1235', ok ? 'passed' : 'failed', ok ? 'OK' : `status=${res.status}`, `${Math.ceil((Date.now() - start) / 1000)}s`);
  });

  sleep(1);
}

export function teardown(data) {
  if (!data?.initialized) return;
  const res = http.get(`${API_URL}/api/status/${RUN_ID}`, { headers: REPORT_HEADERS });
  console.log('[dex-reporter] run summary:', res.body);
}
```

---

## Approach B — Bulk results in teardown

Collect results in a shared array during the run, then send them all in `teardown()`.

> **Note:** k6 VUs are isolated — you cannot use a shared array across VUs directly. Use this approach only with `vus: 1` or the [SharedArray](https://grafana.com/docs/k6/latest/javascript-api/k6-data/sharedarray/) + custom metrics workaround.

For multi-VU scenarios, Approach A (inline per group) is safer.

---

## Approach C — External post-processing

Run k6 with JSON output and post-process with a Node.js script.

```bash
k6 run --out json=results.json load-test.js
node scripts/send-to-dex-reporter.js results.json
```

```javascript
// scripts/send-to-dex-reporter.js
const fs = require('fs');
const lines = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n');

const API_URL = process.env.AUTOMATION_API_URL || 'http://localhost:3050';
const TOKEN = process.env.AUTOMATION_API_TOKEN || '';
const RUN_ID = Number(process.env.TESTRAIL_RUN_ID || 0);

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
  'User-Agent': 'Cypress/13.6.0.0',
};

// Parse group check results from k6 JSON output
const groupResults = {};
for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (entry.type === 'Point' && entry.metric === 'checks') {
      const groupName = entry.data?.tags?.group || '';
      const m = groupName.match(/@?C?-?(\d+)/i);
      if (!m) continue;
      const caseId = m[1];
      const passed = entry.data.value === 1;
      if (!groupResults[caseId]) groupResults[caseId] = { passed: 0, failed: 0 };
      if (passed) groupResults[caseId].passed++;
      else groupResults[caseId].failed++;
    }
  } catch {}
}

(async () => {
  // init
  await fetch(`${API_URL}/api/init`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ runId: RUN_ID, project: process.env.PROJECT_NAME, framework: 'k6' }),
  });

  // send results
  for (const [caseId, counts] of Object.entries(groupResults)) {
    const status = counts.failed > 0 ? 'failed' : 'passed';
    await fetch(`${API_URL}/api/result`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ runId: RUN_ID, cypressId: caseId, status }),
    });
    console.log(`  ${caseId} → ${status}`);
  }
})();
```

---

## Env vars

```env
AUTOMATION_API_URL=http://localhost:3050
AUTOMATION_API_TOKEN=<TOKEN>
TESTRAIL_RUN_ID=123
PROJECT_NAME=server
USE_TESTRAIL=true
BASE_URL=https://your-api.example.com
```

Run with:

```bash
k6 run \
  -e AUTOMATION_API_URL=http://localhost:3050 \
  -e AUTOMATION_API_TOKEN=xxx \
  -e TESTRAIL_RUN_ID=123 \
  -e PROJECT_NAME=server \
  -e USE_TESTRAIL=true \
  -e BASE_URL=https://api.example.com \
  load-test.js
```

---

## Case ID convention

Embed the case ID in the `group()` name:

```javascript
group('Login endpoint @C1234', () => { ... });
group('[C5678] Checkout flow', () => { ... });
```
