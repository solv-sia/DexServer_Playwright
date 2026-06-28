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
- Call `globalPage.waitSpinner()` after any action that triggers a loading state — it waits for `#dexloader #main` to reach `display: none`
- Screenshots are captured manually at key points; the config also records video at 1920×1080
- Path aliases `@pages/*` and `@utils/*` are configured in `tsconfig.json` — use them instead of relative imports

### Navigation & Click Anti-patterns

**`DEX-APP` covers the viewport on non-root sections** (`#!/hardware-control`, `#!/settings/*`, etc.). Playwright's `.click()` uses `elementFromPoint()` to verify the target — if `DEX-APP` is the topmost element at the click coordinates, the click waits indefinitely and times out. Always use `dispatchEvent('click')` for header navigation icons. Exception: elements explicitly inside overlays/dialogs that float above `DEX-APP`.

**Never click the inner `#icon` of a `paper-icon-button` to trigger navigation.** The `#icon` lives inside the button's shadow root; a `dispatchEvent('click')` on it does not cross the shadow boundary to reach the `<a>` wrapper that triggers hash-based routing. Always target `paper-icon-button` directly. The `networkIcon` locator in `GlobalPage` uses the full shadow-piercing chain: `dex-app >> [name='master'] >> #dexHeader >> paper-icon-button.network-color[icon='device:devices']`.

**Page methods that submit forms must wait for the dialog/overlay to close.** Clicking a confirm/save button and returning immediately creates a race condition: the next action (search, navigation) may run before the server responds and the dialog dismisses. Pattern:
```ts
await this.elements.confirmButton().dispatchEvent('click');
await this.dialog().waitFor({ state: 'hidden', timeout: 15000 });
```
Then call `globalPage.waitSpinner()` in the test spec after the submit method returns, before any search or navigation that depends on the submitted data existing.

**`waitOverlayClosed()` in BasePage has a `.catch(() => {})` safety net** — it never throws, it just continues if the overlay doesn't close in time. Do not rely on it as proof that a dialog has fully closed; use explicit `waitFor({ state: 'hidden' })` on the dialog itself.

### Known Navigation URL Map

| `clickOn*Header()` method | Navigates to |
|---------------------------|--------------|
| `clickOnNetworkHeader()` / `clickNetwork()` | `#!/network` |
| `clickOnHardwarePolicyHeader()` | `#!/hardware-control` — **`#dexNetworkList` does NOT exist here** |
| `clickOnTransmissionPolicyHeader()` | `#!/transmission-policy` |
| `clickOnMediaLibraryHeader()` | `#!/media-library` |

When on `#!/hardware-control`, `page.locator('#dexNetworkList')` returns 0 matches. Any `NetworkPage` method called without first navigating to `#!/network` will timeout. Always call `globalPage.clickNetwork()` + `globalPage.waitSpinner()` before `NetworkPage` methods.
