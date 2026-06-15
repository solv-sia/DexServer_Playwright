---
name: dex-reporter-frameworks
description: Integrate the automation-api (Dex Reporter) with any testing framework. Generates integration code for Cypress, Playwright, k6, and Postman/Newman to send test results to TestRail via the automation-api. Use when setting up test reporting, connecting a new framework to TestRail, or migrating from legacy reporters.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
version: 1.0.0
priority: HIGH
---

# Dex Reporter — Multi-Framework Integration

Generates integration code to connect any testing framework with the **automation-api** — a NestJS service that receives test results via HTTP and forwards them to TestRail, persisting every execution in MongoDB.

---

## API Reference

**Base URL:** `http://localhost:3050` (override with `AUTOMATION_API_URL` env var)

**Authentication** — all endpoints except `/api/health` require:
```
Authorization: Bearer <TOKEN>
User-Agent: Cypress/13.6.0.0
```

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/init` | Initialize session — loads TestRail mappings |
| POST | `/api/result` | Send individual test result |
| POST | `/api/video` | Upload video attachment (multipart/form-data) |
| GET | `/api/health` | Health check (no auth) |
| GET | `/api/status/:runId` | Session status |

### POST /api/init

```json
{
  "runId": 123,
  "project": "server",
  "framework": "cypress",
  "debug": true
}
```

> TestRail credentials (`TESTRAIL_URL`, `TESTRAIL_USERNAME`, `TESTRAIL_PASSWORD`) are read from the server's env vars — **do not send them in the request**.

### POST /api/result

```json
{
  "runId": 123,
  "cypressId": "C1234",
  "status": "passed",
  "comment": "optional",
  "elapsed": "5s",
  "defects": "BUG-123",
  "customComment": "optional, overrides comment"
}
```

**Accepted `cypressId` formats:** `C1234`, `@C1234`, `@1234`, `1234`

**Accepted `status` values:** `passed` | `failed` | `blocked` | `retest` | `untested`

### POST /api/video (multipart/form-data)

Fields: `file` (binary, max 100 MB), `runId` (string), `cypressId` (string)

---

## Integration Steps

### Step 1 — Detect framework

Identify the testing framework in the target project:

| Indicator | Framework |
|-----------|-----------|
| `cypress.config.ts` / `cypress.config.js` | Cypress |
| `playwright.config.ts` / `playwright.config.js` | Playwright |
| `*.k6.js` / `*.k6.ts` / `k6` in `package.json` | k6 |
| `*.postman_collection.json` / `newman` in `package.json` | Postman / Newman |

### Step 2 — Check environment variables

Ensure the following exist in the project's `.env` or CI config:

```env
AUTOMATION_API_URL=http://localhost:3050
AUTOMATION_API_TOKEN=your-bearer-token
TESTRAIL_RUN_ID=123
PROJECT_NAME=server
```

### Step 3 — Generate integration code

Follow the framework-specific guide:

- **Cypress** → [cypress-integration.md](cypress-integration.md)
- **Playwright** → [playwright-integration.md](playwright-integration.md)
- **k6** → [k6-integration.md](k6-integration.md)
- **Postman / Newman** → [postman-integration.md](postman-integration.md)

### Step 4 — Verify

After generating the integration code, remind the user to:

1. Confirm automation-api is running: `GET /api/health`
2. Set `AUTOMATION_API_TOKEN` to the value in `automation-api/.env` (`TOKEN=`)
3. Run one test and check `GET /api/status/:runId`
4. Verify the result appears in MongoDB (`executions` collection) and TestRail

---

## Case ID Convention

All frameworks use the same convention: embed the TestRail case ID in the test title using the `@C` prefix.

```
"Login flow @C1234 - valid credentials"
"[C1234] Submit form with valid data"
```

Extraction regex (works across all frameworks):

```
/@?C?-?(\d+)/i
```

More precisely, the server normalizes:
- `C1234` → `1234`
- `@C1234` → `1234`
- `@1234` → `1234`
- `1234` → `1234`

So any of those formats in the test title will match.

---

## Status Mapping

| Framework state | TestRail status |
|-----------------|-----------------|
| passed / pass | `passed` |
| failed / fail / error | `failed` |
| skipped / pending / todo | `untested` |
| blocked | `blocked` |
| timedOut | `failed` |

---

## Important Notes

- Call `/api/init` **once** per test run, before any results are sent
- The `project` field identifies the project in MongoDB (e.g. `"server"`, `"dexstore"`)
- The `framework` field is informational — any string is accepted
- If TestRail is unreachable, the result is still persisted in MongoDB with `testRailSent: false`
- Sessions are in-memory on the server — they are lost on restart
- Each `/api/init` call creates a new `Execution` document in MongoDB
