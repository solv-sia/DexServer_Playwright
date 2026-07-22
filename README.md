# DexServer Playwright

Suite de tests E2E con Playwright para DexServer, una plataforma multi-tenant de gestión de señalización digital.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior

## Setup inicial

> **Si clonaste `dexserver_automation`:** todos los comandos se ejecutan desde la subcarpeta `playwright/`.
> ```bash
> cd playwright/
> ```
> A partir de ahí, seguí los pasos de abajo normalmente.

Estos pasos solo se ejecutan una vez al clonar el repositorio.

**1. Instalar dependencias**

```bash
npm install
```

**2. Descargar browsers de Playwright**

```bash
npx playwright install
```

> Sin este paso los tests fallan inmediatamente con el error `Executable doesn't exist`.

**3. Configurar variables de entorno**

Copiá el archivo de ejemplo y completá los valores reales:

```bash
# Windows
copy env.demo5.example .env.demo5

# macOS / Linux
cp env.demo5.example .env.demo5
```

Luego editá `.env.demo5` y completá cada variable (URL del servidor, credenciales de BD, etc.).

El archivo `.env.demo5` está en `.gitignore` — los valores reales nunca se commitean.

> Sin este paso los tests fallan con `Cannot navigate to invalid URL` porque `BASE_URL_DEX` queda vacío.

## Correr los tests

```bash
# Suite completa (entorno demo5)
npm run test:demo5

# Un solo archivo
npx dotenv -e .env.demo5 -- playwright test tests/CP01PP.spec.ts

# Tests que coincidan con un tag
npx dotenv -e .env.demo5 -- playwright test --grep "@CP08PP"

# Con browser visible
npm run test:headed

# Modo UI interactivo
npm run test:ui
```

> Nunca uses `npm test` directamente — falla sin las variables de entorno.

## TestRail

Los resultados se pueden subir a TestRail configurando `utils/configuration.json`.

### Sin TestRail (modo local — por defecto)

```json
{
  "useTestRail": false,
  "testRunId": 1065
}
```

Los tests corren y reportan en consola / HTML report de Playwright. No se toca TestRail. **Usar siempre este modo para verificaciones y desarrollo.**

### Con TestRail (subida oficial)

```json
{
  "useTestRail": true,
  "testRunId": 1065
}
```

Al terminar cada test, el resultado se sube automáticamente al run `1065` en TestRail. Activar **solo** para la subida oficial — una vez por run, con la suite completa estabilizada.

> **Importante:** no commitear `configuration.json` con `useTestRail: true`. El valor por defecto en el repo es siempre `false`.

## Estructura del proyecto

```
tests/          # Specs (CP01PP–CP2XPP), ejecutados en orden secuencial
pages/          # Page Objects (extienden BasePage)
utils/          # config.ts, sharedData.ts, dateFormatter.ts
fixtures/       # Fixtures de Playwright
auth/           # storageState.json generado por auth.setup.ts (gitignored)
```

Los tests corren con `workers: 1` porque comparten estado entre sí: `CP02PP` crea un customer, los tests siguientes lo consumen vía `utils/sharedData.ts`.
