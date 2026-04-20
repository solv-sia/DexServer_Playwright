// Verificar en BD que las descargas del player quedaron completas (post CP34PP)
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
// import { connectDB, dbGetPlayerDownloads } from '../utils/dbHelper';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Verificar descargas completas en BD (post CP34PP)', () => {
  test('@CP36PP', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    // ── Verificación UI: las barras de progreso deben estar al 100% ───────────
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    const progressBars = page.locator(
      '.paper-material.display-info-container paper-progress'
    );
    const barCount = await progressBars.count();

    if (barCount > 0) {
      const allComplete = await progressBars.evaluateAll((bars: Element[]) =>
        bars.every(b => b.getAttribute('value') === '100')
      );
      expect(allComplete).toBe(true);
    }

    await page.screenshot({ path: 'screenshots/cp36pp_ui.png' });

    // ── Verificación BD ───────────────────────────────────────────────────────
    // Todas las descargas de PL_CP34PP deben tener status 'completed' o equivalente.
    // Descomentar cuando se implemente connectDB():
    //
    // const db = await connectDB();
    // try {
    //   const downloads = await dbGetPlayerDownloads(db, config.playerCP11PP, config.PL_CP34PP);
    //   expect(downloads.length).toBeGreaterThan(0);
    //
    //   const allDone = downloads.every(
    //     d => String(d.Status).toLowerCase() === 'completed' ||
    //          String(d.Status).toLowerCase() === 'done' ||
    //          String(d.Status) === '100'
    //   );
    //   expect(allDone).toBe(true);
    // } finally {
    //   await db.close();
    // }
    // ─────────────────────────────────────────────────────────────────────────
  });
});
