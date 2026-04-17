# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests (sequential, uses .env.demo5)
npm run test:demo5

# Run a single test file
npx dotenv -e .env.demo5 -- playwright test tests/CP08PP.spec.ts

# Run tests matching a tag
npx dotenv -e .env.demo5 -- playwright test --grep "@CP08PP"

# Run with visible browser
npm run test:headed

# Interactive UI mode
npm run test:ui
```

Environment variables (BASE_URL, etc.) are loaded from `.env.demo5` via `dotenv-cli`. Never run `npm test` directly — it will fail without environment variables.

## Architecture

**Playwright E2E test suite** for DexServer, a multi-tenant digital signage/media management platform. Tests run **sequentially** (`workers: 1`) because test cases share state across the CP01–CP10 test chain.

### Test Chain & Shared State

Tests are labeled `CP01PP`–`CP10PP` and execute in order. Earlier tests produce data consumed by later ones:
- `CP02PP` creates a customer and stores its name in `utils/sharedData.ts`
- `CP04PP`, `CP05PP`, etc. read from `sharedData.ts` to operate on that customer

The auth flow (`tests/auth.setup.ts`) runs once before the suite, writing session cookies to `auth/storageState.json`. All subsequent tests reuse this state instead of logging in again.

### Page Object Model

All pages extend `BasePage` (`pages/BasePage.ts`), which provides:
- `findElement({ get, find })`: traverses shadow DOM boundaries using `>>` CSS selectors — used because the app uses web components heavily
- `typeInPaperInput()`: helper for Polymer `<paper-input>` shadow DOM inputs

Each page class has a private `elements` object of locator factory functions and public action/assertion methods. Assertions are bundled into page methods (e.g., `verifyDashboard()`), not spread across test files.

### Key Utilities

| File | Purpose |
|------|---------|
| `utils/config.ts` + `utils/configuration.json` | Centralizes all test data: credentials, file paths, static strings |
| `utils/sharedData.ts` | In-memory store for data passed between test cases (customer names, IDs) |
| `utils/dateFormatter.ts` | Generates unique timestamped names to avoid collisions between runs |

### Common Patterns

- Use `{ force: true }` on fills/clicks for web components that intercept pointer events
- Call `globalPage.waitSpinner()` after any action that triggers a loading state — it waits for `#main` to reach `display: block`
- Screenshots are captured manually at key points; the config also records video at 1920×1080
- Path aliases `@pages/*` and `@utils/*` are configured in `tsconfig.json` — use them instead of relative imports
