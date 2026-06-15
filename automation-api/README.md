# automation-api

REST API construida con NestJS que actúa como puente entre frameworks de testing automatizado (Cypress, Playwright, etc.) y el sistema de gestión de casos **TestRail**. Adicionalmente expone endpoints para consultar datos de Azure SQL y gestionar dispositivos headless.

Puerto por defecto: **3050**

---

## Tabla de contenidos

- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Variables de entorno](#variables-de-entorno)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Reporter (TestRail)](#reporter-testrail)
  - [Machine](#machine)
  - [Proof of Play](#proof-of-play)
  - [Player](#player)
  - [Store](#store)
- [Flujo de integración con TestRail](#flujo-de-integración-con-testrail)
- [Configuración en Cypress](#configuración-en-cypress)
- [Configuración en Playwright](#configuración-en-playwright)
- [Uso desde Postman](#uso-desde-postman)
- [Esquema de MongoDB](#esquema-de-mongodb)
- [Mapeo de estados TestRail](#mapeo-de-estados-testrail)

---

## Requisitos

- Node.js 18+
- MongoDB Atlas (para historial de ejecuciones)
- Azure SQL Server (para endpoints de máquinas / proof-of-play)
- Cuenta en TestRail con acceso de API

---

## Instalación y ejecución

```bash
npm install

# Desarrollo con hot-reload
npm run dev

# Desarrollo sin hot-reload
npm start

# Compilar a JS
npm run build

# Producción
npm run start:prod
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=...

# Autenticación de la API
TOKEN=tu-bearer-token-secreto

# Puerto (opcional, default 3050)
AUTOMATION_API_PORT=3050

# Azure SQL
SQL_SERVER=miservidor.database.windows.net

# Azure Identity (Managed Identity — producción)
AZURE_CLIENT_ID=xxx-xxx-xxx          # Omitir para system-assigned MI

# Azure Identity (Service Principal — solo desarrollo)
AZURE_SECRET_ID=client-secret-value  # Su presencia activa el modo service-principal
AZURE_TENANT_ID=tenant-id
```

---

## Autenticación

Todos los endpoints (excepto `/api/health`) requieren:

| Header | Valor requerido |
|---|---|
| `Authorization` | `Bearer {TOKEN}` |
| `User-Agent` | Debe coincidir con el patrón `Cypress/X.Y.Z` (ej: `Cypress/15.13.1`) |

Si la variable `TOKEN` no está configurada, la autenticación queda deshabilitada (modo desarrollo).

**Errores posibles:**
- `401 Unauthorized` — Token ausente o inválido
- `403 Forbidden` — User-Agent no válido

---

## Endpoints

### Reporter (TestRail)

#### `GET /api/health`

Verificación de estado del servicio. No requiere autenticación.

**Response `200`:**
```json
{
  "status": "ok",
  "service": "automation-api",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "activeSessions": 2
}
```

---

#### `POST /api/init`

Inicializa una sesión de reporte. Obtiene todos los tests del run de TestRail y construye el mapeo `CypressId ↔ TestRailTestId`. Debe llamarse **una vez** antes de comenzar la ejecución.

**Request Body:**
```json
{
  "runId": 1234,
  "project": "server",
  "framework": "cypress",
  "debug": false
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `runId` | `number` | ✅ | ID del test run en TestRail |
| `project` | `string` | ✅ | Nombre del proyecto (ej: `"server"`) |
| `framework` | `string` | ✅ | Framework utilizado (ej: `"cypress"`) |
| `debug` | `boolean` | ❌ | Activa logging detallado |

**Response `200`:**
```json
{
  "success": true,
  "runId": 1234,
  "executionId": "abc123def456",
  "mappingsLoaded": 55,
  "totalTests": 55
}
```

---

#### `POST /api/result`

Envía el resultado de un test individual a TestRail. Puede llamarse después de cada test.

**Request Body:**
```json
{
  "runId": 1234,
  "cypressId": "CP01PP",
  "status": "passed",
  "comment": "Test ejecutado correctamente",
  "elapsed": "45s",
  "defects": "BUG-123",
  "customComment": "Texto personalizado que sobreescribe comment"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `runId` | `number` | ✅ | ID del test run (debe tener sesión iniciada) |
| `cypressId` | `string` | ✅ | ID del test. Formatos aceptados: `CP01PP`, `@CP01PP`, `C123`, `@C123`, `123` |
| `status` | `string` | ✅ | `passed` \| `failed` \| `blocked` \| `retest` \| `untested` |
| `comment` | `string` | ❌ | Comentario genérico del resultado |
| `elapsed` | `string` | ❌ | Tiempo de ejecución (ej: `"1m 30s"`, `"45s"`) |
| `defects` | `string` | ❌ | IDs de defectos asociados |
| `customComment` | `string` | ❌ | Sobreescribe `comment` si está presente |

**Response `200`:**
```json
{
  "success": true,
  "resultId": 9876,
  "message": "Result recorded"
}
```

---

#### `POST /api/video`

Adjunta un video de ejecución a un resultado de TestRail. Usa `multipart/form-data`.

**Request (Form-Data):**

| Campo | Tipo | Descripción |
|---|---|---|
| `file` | `File` | Archivo de video (`.mp4`) |
| `runId` | `string` | ID del test run |
| `cypressId` | `string` | ID del test al que adjuntar el video |

**Response `200`:**
```json
{
  "success": true,
  "attachmentId": 5678,
  "message": "Video uploaded"
}
```

---

#### `GET /api/status/:runId`

Consulta el estado de una sesión activa.

**Params:** `runId` — ID del test run

**Response `200` (sesión activa):**
```json
{
  "exists": true,
  "runId": 1234,
  "executionId": "abc123def456",
  "project": "server",
  "framework": "cypress",
  "mappingsCount": 55,
  "resultsCount": 12,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

**Response `200` (sesión no encontrada):**
```json
{
  "exists": false
}
```

---

### Machine

#### `GET /api/machine/:dbKey/:serialNumber`

Obtiene información de una máquina/dispositivo desde Azure SQL.

**Params:**

| Param | Descripción |
|---|---|
| `dbKey` | Clave de base de datos (ej: `demo5`, `mcdqa`, `demo4`) |
| `serialNumber` | Número de serie del dispositivo |

**Response `200`:**
```json
{
  "MachineId": 42,
  "Name": "Player-Norte-01",
  "ActivationKey": "XXXX-YYYY-ZZZZ",
  "SerialNumber": "SN123456",
  "MessageKey": "abc-def-ghi"
}
```

---

### Proof of Play

#### `GET /api/proof-of-play/:dbKey/:machineId`

Obtiene los últimos eventos de reproducción de una máquina.

**Params:**

| Param | Descripción |
|---|---|
| `dbKey` | Clave de base de datos |
| `machineId` | ID numérico de la máquina |

**Query Params:**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `limit` | `number` | `25` | Cantidad máxima de registros a devolver |

**Response `200`:**
```json
[
  {
    "ProofOfPlayId": 1001,
    "MachineId": 42,
    "MediaComponentName": "Video_Promo_Enero.mp4"
  }
]
```

---

### Player

#### `POST /api/player`

Registra un dispositivo headless HTML player realizando un handshake con el servicio DexFrontend externo.

**Request Body:**
```json
{
  "baseUrl": "https://instancia.dexmanager.com",
  "activationKey": "XXXX-YYYY-ZZZZ"
}
```

**Body:**

| Attribute | Descripción |
|---|---|
| `baseUrl` | Instancia de Dex a donde debe apuntar |
| `activationKey` | Activation Key del tenant donde se quiere enrolar |

**Response:** Respuesta directa del servicio DexFrontend (confirmación de registro).

---

### Store

#### `DELETE /api/store/clean-products/:dbKey/:customerId`

Elimina todos los productos de un cliente en cascada (precios, disponibilidad, idiomas, componentes multimedia y productos).

**Params:**

| Param | Descripción |
|---|---|
| `dbKey` | Clave de base de datos |
| `customerId` | ID numérico del cliente |

**Response `200`:**
```json
{
  "success": true
}
```

---

## Flujo de integración con TestRail

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. before:run / before test suite                               │
│    POST /api/init                                               │
│    ├─ API fetches get_tests/{runId} from TestRail               │
│    ├─ Builds CypressId ↔ TestRailTestId map (in-memory)         │
│    └─ Returns executionId (MongoDB tracking)                    │
├─────────────────────────────────────────────────────────────────┤
│ 2. after:spec / after each test                                 │
│    POST /api/result  (one call per test)                        │
│    ├─ API maps CypressId → TestRail testId                      │
│    ├─ Calls TestRail add_result/{testId}                        │
│    └─ Persists result to MongoDB                                │
├─────────────────────────────────────────────────────────────────┤
│ 3. after:spec  (if video enabled)                               │
│    POST /api/video  (multipart/form-data)                       │
│    ├─ API stores file in ./tmp/uploads                          │
│    ├─ Calls TestRail add_attachment_to_result/{resultId}        │
│    ├─ Updates MongoDB with attachmentId                         │
│    └─ Deletes temp file                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Normalización de IDs

El servicio acepta todos estos formatos para `cypressId` y los normaliza automáticamente:

| Formato enviado | Normalizado |
|---|---|
| `@CP01PP` | `CP01PP` |
| `CP01PP` | `CP01PP` |
| `@C123` | `123` |
| `C123` | `123` |
| `123` | `123` |
| `C-123` | `123` |

---

## Configuración en Cypress

### Variables de entorno

```bash
AUTOMATION_API_URL=http://localhost:3050
AUTOMATION_API_TOKEN=tu-token-secreto
```

### `cypress.config.ts`

```typescript
import { defineConfig } from "cypress";

const AUTOMATION_API_URL = process.env.AUTOMATION_API_URL || 'http://localhost:3050';
const AUTOMATION_API_TOKEN = process.env.AUTOMATION_API_TOKEN;
const TEST_RAIL_RUN_ID = Number(process.env.TEST_RAIL_RUN_ID);
const USE_TESTRAIL = process.env.USE_TESTRAIL === 'true';

function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Cypress/15.13.1',
    ...extra,
  };
  if (AUTOMATION_API_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTOMATION_API_TOKEN}`;
  }
  return headers;
}

function extractCypressId(title: string | string[]): string | null {
  const extract = (str: string) => str.match(/@([^\s]+)/)?.[1] ?? null;
  if (Array.isArray(title)) {
    for (const el of title) {
      const id = extract(el);
      if (id) return id;
    }
    return null;
  }
  return extract(title);
}

export default defineConfig({
  video: true,
  e2e: {
    async setupNodeEvents(on, config) {
      const customComments: Record<string, string> = {};

      // Task para setear comentarios custom desde los tests
      on('task', {
        setTestRailComment: ({ testId, comment }: { testId: string; comment: string }) => {
          const cleanId = testId.startsWith('@') ? testId.substring(1) : testId;
          customComments[cleanId] = comment;
          return null;
        },
      });

      if (USE_TESTRAIL) {
        let initialized = false;

        async function ensureInit() {
          if (initialized) return;
          const res = await fetch(`${AUTOMATION_API_URL}/api/init`, {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify({
              runId: TEST_RAIL_RUN_ID,
              project: 'mi-proyecto',
              framework: 'cypress',
              username: process.env.TESTRAIL_USERNAME!,
              password: process.env.TESTRAIL_PASSWORD!,
              testRailUrl: 'https://miempresa.testrail.io',
            }),
          });
          if (!res.ok) throw new Error(`Init failed: ${res.status}`);
          initialized = true;
        }

        on('before:run', async () => {
          await ensureInit();
        });

        on('after:spec', async (_spec, results) => {
          if (!results?.tests) return;
          await ensureInit(); // lazy init para cypress open

          for (const test of results.tests) {
            const cypressId = extractCypressId(test.title);
            if (!cypressId) continue;

            await fetch(`${AUTOMATION_API_URL}/api/result`, {
              method: 'POST',
              headers: apiHeaders(),
              body: JSON.stringify({
                runId: TEST_RAIL_RUN_ID,
                cypressId,
                status: test.state === 'passed' ? 'passed' : 'failed',
                comment: test.state === 'failed'
                  ? `Test fallido: ${test.displayError}`
                  : 'Test ejecutado correctamente',
                elapsed: `${Math.ceil((test.duration || 0) / 1000)}s`,
                customComment: customComments[cypressId],
              }),
            }).catch(err => console.error(`Error sending result for ${cypressId}:`, err));
          }

          // Subir video si existe
          if (results.video) {
            const fs = require('fs');
            const FormData = require('form-data');
            const path = require('path');

            const seen = new Set<string>();
            for (const test of results.tests) {
              const cypressId = extractCypressId(test.title);
              if (!cypressId || seen.has(cypressId)) continue;
              seen.add(cypressId);

              const formData = new FormData();
              formData.append('file', fs.readFileSync(results.video), {
                filename: path.basename(results.video),
                contentType: 'video/mp4',
              });
              formData.append('runId', String(TEST_RAIL_RUN_ID));
              formData.append('cypressId', cypressId);

              await new Promise<void>((resolve, reject) => {
                const parsedUrl = new URL(`${AUTOMATION_API_URL}/api/video`);
                const lib = parsedUrl.protocol === 'https:' ? require('https') : require('http');
                const req = lib.request({
                  hostname: parsedUrl.hostname,
                  port: parsedUrl.port,
                  path: parsedUrl.pathname,
                  method: 'POST',
                  headers: apiHeaders(formData.getHeaders()),
                }, (res: any) => { res.resume(); res.on('end', resolve); });
                req.on('error', reject);
                formData.pipe(req);
              }).catch(err => console.error(`Video upload error for ${cypressId}:`, err));
            }
          }
        });
      }

      return config;
    },
  },
});
```

### Estructura de los tests

Cada test debe usar el ID de caso de TestRail como prefijo con `@` en el nombre del `it`:

```typescript
// cypress/e2e/tests/CP01PP.cy.ts
describe('Login, logout y recupero de contraseña', () => {
  const cypressId = '@CP01PP';

  it(cypressId, () => {
    // lógica del test...
    cy.screenshot({ capture: 'runner' });

    // Comentario personalizado en TestRail (opcional)
    cy.task('setTestRailComment', {
      testId: cypressId,
      comment: `Login exitoso con usuario: ${config.userName}`,
    });
  });
});
```

> El `describe` puede tener cualquier texto. El extractor busca `@IDENTIFICADOR` en el título del `it`.

---

## Configuración en Playwright

### `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  use: {
    video: 'on',
  },
});
```

### `global-setup.ts`

```typescript
import fetch from 'node-fetch';

const API_URL = process.env.AUTOMATION_API_URL || 'http://localhost:3050';
const API_TOKEN = process.env.AUTOMATION_API_TOKEN;

function headers() {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'Cypress/15.13.1',   // Requerido por el AuthGuard
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  };
}

export default async function globalSetup() {
  const res = await fetch(`${API_URL}/api/init`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      runId: Number(process.env.TEST_RAIL_RUN_ID),
      project: 'mi-proyecto',
      framework: 'playwright',
      username: process.env.TESTRAIL_USERNAME!,
      password: process.env.TESTRAIL_PASSWORD!,
      testRailUrl: 'https://miempresa.testrail.io',
    }),
  });

  if (!res.ok) throw new Error(`automation-api init failed: ${res.status}`);
  console.log('TestRail session initialized');
}
```

### `global-teardown.ts` (opcional — para marcar ejecución completada)

```typescript
export default async function globalTeardown() {
  // No hay endpoint de cierre explícito; la sesión vive en memoria hasta el restart.
}
```

### Reporter personalizado (`testrail-reporter.ts`)

```typescript
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fetch from 'node-fetch';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

const API_URL = process.env.AUTOMATION_API_URL || 'http://localhost:3050';
const API_TOKEN = process.env.AUTOMATION_API_TOKEN;
const RUN_ID = Number(process.env.TEST_RAIL_RUN_ID);

function headers(extra: Record<string, string> = {}) {
  return {
    'User-Agent': 'Cypress/15.13.1',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    ...extra,
  };
}

function extractId(title: string): string | null {
  return title.match(/@([^\s]+)/)?.[1] ?? null;
}

export default class TestRailReporter implements Reporter {
  async onTestEnd(test: TestCase, result: TestResult) {
    const cypressId = extractId(test.title);
    if (!cypressId) return;

    // Enviar resultado
    await fetch(`${API_URL}/api/result`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        runId: RUN_ID,
        cypressId,
        status: result.status === 'passed' ? 'passed' : 'failed',
        comment: result.status !== 'passed'
          ? `Error: ${result.error?.message}`
          : 'Test passed',
        elapsed: `${Math.ceil(result.duration / 1000)}s`,
      }),
    }).catch(console.error);

    // Subir video si existe
    const video = result.attachments.find(a => a.name === 'video');
    if (video?.path) {
      const form = new FormData();
      form.append('file', fs.readFileSync(video.path), {
        filename: path.basename(video.path),
        contentType: 'video/mp4',
      });
      form.append('runId', String(RUN_ID));
      form.append('cypressId', cypressId);

      await fetch(`${API_URL}/api/video`, {
        method: 'POST',
        headers: headers(form.getHeaders()),
        body: form,
      }).catch(console.error);
    }
  }
}
```

### `playwright.config.ts` con reporter

```typescript
export default defineConfig({
  reporter: [
    ['./testrail-reporter'],
    ['html'],
  ],
  globalSetup: './global-setup',
});
```

### Estructura de los tests en Playwright

```typescript
// tests/login.spec.ts
import { test } from '@playwright/test';

test('@CP01PP - Login y logout', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'testuser');
  // ...assertions...
});
```

---

## Uso desde Postman

### 1. Configurar variables de colección

| Variable | Valor |
|---|---|
| `base_url` | `http://localhost:3050` |
| `token` | `tu-bearer-token` |
| `run_id` | `1234` |

### 2. Pre-request script (colección)

```javascript
pm.request.headers.add({
  key: 'Authorization',
  value: `Bearer ${pm.collectionVariables.get('token')}`
});
pm.request.headers.add({
  key: 'User-Agent',
  value: 'Cypress/15.13.1'
});
```

### 3. Requests de ejemplo

**Health Check**
```
GET {{base_url}}/api/health
```

**Init Session**
```
POST {{base_url}}/api/init
Content-Type: application/json
Authorization: Bearer {{token}}
User-Agent: Cypress/15.13.1

{
  "runId": {{run_id}},
  "project": "mi-proyecto",
  "framework": "postman",
  "username": "usuario@empresa.com",
  "password": "api-token-testrail",
  "testRailUrl": "https://miempresa.testrail.io",
  "debug": true
}
```

**Send Result**
```
POST {{base_url}}/api/result
Content-Type: application/json
Authorization: Bearer {{token}}
User-Agent: Cypress/15.13.1

{
  "runId": {{run_id}},
  "cypressId": "CP01PP",
  "status": "passed",
  "comment": "Verificación manual exitosa",
  "elapsed": "2m 30s"
}
```

**Upload Video**
```
POST {{base_url}}/api/video
Authorization: Bearer {{token}}
User-Agent: Cypress/15.13.1
Content-Type: multipart/form-data

file: [seleccionar archivo .mp4]
runId: {{run_id}}
cypressId: CP01PP
```

**Session Status**
```
GET {{base_url}}/api/status/{{run_id}}
Authorization: Bearer {{token}}
User-Agent: Cypress/15.13.1
```

**Get Machine**
```
GET {{base_url}}/api/machine/demo5/SN123456
Authorization: Bearer {{token}}
User-Agent: Cypress/15.13.1
```

**Proof of Play**
```
GET {{base_url}}/api/proof-of-play/demo5/42?limit=10
Authorization: Bearer {{token}}
User-Agent: Cypress/15.13.1
```

**Clean Products**
```
DELETE {{base_url}}/api/store/clean-products/demo5/100
Authorization: Bearer {{token}}
User-Agent: Cypress/15.13.1
```

---

## Esquema de MongoDB

Cada ejecución se persiste como documento `Execution`:

```typescript
{
  runId: number;
  project: string;
  framework: string;
  testRailUrl: string;
  status: 'initialized' | 'in_progress' | 'completed' | 'failed';
  mappingsLoaded: number;
  totalTests: number;
  cases: Array<{
    cypressId: string;
    status: string;
    statusId: number;           // ID de estado en TestRail
    comment: string;
    customComment?: string;
    elapsed?: string;
    defects?: string;
    testRailTestId?: number;
    testRailCaseId?: number;
    testRailResultId?: number;  // Disponible tras envío exitoso
    testRailSent: boolean;
    testRailError?: string;
    videoUploaded: boolean;
    videoAttachmentId?: number;
    receivedAt: Date;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    retest: number;
    untested: number;
    sentToTestRail: number;
    failedToSend: number;
  };
  startedAt: Date;
  completedAt?: Date;
}
```

---

## Mapeo de estados TestRail

| Estado enviado | ID en TestRail |
|---|---|
| `passed` | `1` |
| `blocked` | `2` |
| `untested` | `3` |
| `retest` | `4` |
| `failed` | `5` |

---

## Mapeo de bases de datos Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo5` | `DexDemo5Db` |
| `mcdqa` | `DexMcdDb__Qa` |
| `demo4` | `DexDemoDb` |

Para agregar nuevos entornos:
- Solicitar a Infra que la identidad de azure tenga acceso al entorno solicitado.
- Editar `src/sqlserver/sqlserver.constants.ts` agregar la key y su db correspondiente.

