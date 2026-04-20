// Verificar en BD que los eventos de descarga del player existen y son recientes
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
// import { connectDB, dbGetDownloadEvents } from '../utils/dbHelper';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Verificar eventos de descarga del player en BD', () => {
  test('@CP24PP', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    // ── Verificación UI: el player sigue visible y accesible ──────────────────
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);

    const playerCard = page.locator('dex-network-display-card').filter({ hasText: config.playerCP11PP });
    await expect(playerCard).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/cp24pp_ui.png' });

    // ── Verificación BD ───────────────────────────────────────────────────────
    // Verificar que existen eventos de descarga recientes para el player.
    // Descomentar cuando se implemente connectDB():
    //
    // const db = await connectDB();
    // try {
    //   const events = await dbGetDownloadEvents(db, config.playerCP11PP);
    //   expect(events.length).toBeGreaterThan(0);
    //
    //   // El evento más reciente no debe tener más de 24 horas de antigüedad
    //   const latestEvent = events[0];
    //   const eventTime = new Date(latestEvent.CreatedAt as string).getTime();
    //   const oneDayMs = 24 * 60 * 60 * 1000;
    //   expect(Date.now() - eventTime).toBeLessThan(oneDayMs);
    // } finally {
    //   await db.close();
    // }
    // ─────────────────────────────────────────────────────────────────────────
  });
});
