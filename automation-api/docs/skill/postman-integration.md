# Postman / Newman Integration

Two approaches depending on how tests are run: **Collection Runner scripts** (GUI / Postman cloud) or **Newman programmatic** (CI/CD).

---

## Approach A — Collection Pre-request & Test Scripts

Add scripts directly in the Postman collection. Works with Postman GUI, Collection Runner, and Newman CLI.

### Collection-level Pre-request Script (runs once before the first request)

```javascript
// Collection > Pre-request Script tab
const apiUrl = pm.environment.get('AUTOMATION_API_URL') || 'http://localhost:3050';
const token = pm.environment.get('AUTOMATION_API_TOKEN') || '';
const runId = parseInt(pm.environment.get('TESTRAIL_RUN_ID') || '0');
const project = pm.environment.get('PROJECT_NAME') || 'unknown';
const useTestRail = pm.environment.get('USE_TESTRAIL') === 'true';

if (!useTestRail) return;

// Guard: only init once per collection run
if (pm.collectionVariables.get('dex_initialized')) return;

pm.sendRequest(
  {
    url: `${apiUrl}/api/init`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Cypress/13.6.0.0',
    },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ runId, project, framework: 'postman', debug: false }),
    },
  },
  (err, res) => {
    if (err) {
      console.error('[dex-reporter] init error:', err);
      return;
    }
    const data = res.json();
    console.log(`[dex-reporter] initialized — ${data.mappingsLoaded} mappings loaded`);
    pm.collectionVariables.set('dex_initialized', 'true');
  }
);
```

### Request-level Test Script (add to each request that maps to a TestRail case)

```javascript
// Request > Tests tab
const apiUrl = pm.environment.get('AUTOMATION_API_URL') || 'http://localhost:3050';
const token = pm.environment.get('AUTOMATION_API_TOKEN') || '';
const runId = parseInt(pm.environment.get('TESTRAIL_RUN_ID') || '0');
const useTestRail = pm.environment.get('USE_TESTRAIL') === 'true';

// Embed the case ID in the request name: "GET /health @C1234"
const requestName = pm.info.requestName || '';
const m = requestName.match(/@?C?-?(\d+)/i);
if (!useTestRail || !m) return;

const caseId = m[1];
const allPassed = pm.response.code >= 200 && pm.response.code < 300;
const status = allPassed ? 'passed' : 'failed';
const elapsed = `${Math.ceil(pm.response.responseTime / 1000)}s`;
const comment = allPassed ? 'Request passed' : `HTTP ${pm.response.code}`;

pm.sendRequest(
  {
    url: `${apiUrl}/api/result`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Cypress/13.6.0.0',
    },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ runId, cypressId: caseId, status, comment, elapsed }),
    },
  },
  (err) => {
    if (err) console.error('[dex-reporter] result error:', err);
  }
);
```

### Naming convention for requests

```
GET /api/health @C1234
POST /api/login @C1235
[C1236] Create user
```

---

## Approach B — Newman programmatic runner (CI/CD)

Use Newman's Node.js API to hook into events and send results after each request.

### scripts/run-collection.js

```javascript
const newman = require('newman');
const fetch = require('node-fetch'); // or use built-in fetch in Node 18+
const FormData = require('form-data');

const API_URL = process.env.AUTOMATION_API_URL || 'http://localhost:3050';
const API_TOKEN = process.env.AUTOMATION_API_TOKEN || '';
const RUN_ID = Number(process.env.TESTRAIL_RUN_ID || 0);
const PROJECT = process.env.PROJECT_NAME || 'unknown';
const USE_TESTRAIL = process.env.USE_TESTRAIL === 'true';

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_TOKEN}`,
  'User-Agent': 'Cypress/13.6.0.0',
};

function extractCaseId(name = '') {
  const m = name.match(/@?C?-?(\d+)/i);
  return m ? m[1] : null;
}

async function main() {
  if (USE_TESTRAIL) {
    const res = await fetch(`${API_URL}/api/init`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ runId: RUN_ID, project: PROJECT, framework: 'postman', debug: false }),
    });
    const data = await res.json();
    console.log(`[dex-reporter] initialized — ${data.mappingsLoaded} mappings loaded`);
  }

  newman.run(
    {
      collection: require('./your-collection.postman_collection.json'),
      environment: require('./your-env.postman_environment.json'),
      reporters: 'cli',
    },
    async (err, summary) => {
      if (err) throw err;

      if (!USE_TESTRAIL) return;

      // Process results per execution
      for (const execution of summary.run.executions) {
        const name = execution.item.name || '';
        const caseId = extractCaseId(name);
        if (!caseId) continue;

        const assertions = execution.assertions || [];
        const failed = assertions.filter(a => a.error).length;
        const status = failed > 0 ? 'failed' : 'passed';
        const elapsed = `${Math.ceil((execution.response?.responseTime ?? 0) / 1000)}s`;
        const comment = failed > 0
          ? assertions.filter(a => a.error).map(a => a.error.message).join('; ')
          : 'All assertions passed';

        await fetch(`${API_URL}/api/result`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ runId: RUN_ID, cypressId: caseId, status, comment, elapsed }),
        }).catch(e => console.error(`[dex-reporter] ${caseId}:`, e));
      }

      const statusRes = await fetch(`${API_URL}/api/status/${RUN_ID}`, { headers: HEADERS });
      const statusData = await statusRes.json();
      console.log('[dex-reporter] run summary:', JSON.stringify(statusData, null, 2));
    }
  );
}

main().catch(console.error);
```

### package.json script

```json
{
  "scripts": {
    "test:testrail": "node scripts/run-collection.js"
  },
  "dependencies": {
    "newman": "^6.0.0"
  }
}
```

### Run

```bash
AUTOMATION_API_URL=http://localhost:3050 \
AUTOMATION_API_TOKEN=xxx \
TESTRAIL_RUN_ID=123 \
PROJECT_NAME=server \
USE_TESTRAIL=true \
npm run test:testrail
```

---

## Approach C — Newman CLI + post-processing

Export Newman results as JSON and post-process with a script.

```bash
newman run collection.json \
  --environment env.json \
  --reporters cli,json \
  --reporter-json-export newman-results.json

node scripts/newman-to-dex-reporter.js newman-results.json
```

```javascript
// scripts/newman-to-dex-reporter.js
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const API_URL = process.env.AUTOMATION_API_URL || 'http://localhost:3050';
const TOKEN = process.env.AUTOMATION_API_TOKEN || '';
const RUN_ID = Number(process.env.TESTRAIL_RUN_ID || 0);
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
  'User-Agent': 'Cypress/13.6.0.0',
};

(async () => {
  await fetch(`${API_URL}/api/init`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ runId: RUN_ID, project: process.env.PROJECT_NAME, framework: 'postman' }),
  });

  for (const execution of data.run.executions) {
    const name = execution.item.name || '';
    const m = name.match(/@?C?-?(\d+)/i);
    if (!m) continue;

    const caseId = m[1];
    const assertions = execution.assertions || [];
    const failed = assertions.filter(a => a.error).length;
    const status = failed > 0 ? 'failed' : 'passed';

    await fetch(`${API_URL}/api/result`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        runId: RUN_ID,
        cypressId: caseId,
        status,
        elapsed: `${Math.ceil((execution.response?.responseTime ?? 0) / 1000)}s`,
      }),
    });
    console.log(`  ${caseId} → ${status}`);
  }
})();
```

---

## Postman Environment variables

Create a Postman environment with:

| Variable | Value |
|----------|-------|
| `AUTOMATION_API_URL` | `http://localhost:3050` |
| `AUTOMATION_API_TOKEN` | `<TOKEN from automation-api/.env>` |
| `TESTRAIL_RUN_ID` | `123` |
| `PROJECT_NAME` | `server` |
| `USE_TESTRAIL` | `true` |
