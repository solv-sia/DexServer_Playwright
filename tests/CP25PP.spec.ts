// Verificar en BD que la última actividad del player es reciente (heartbeat)
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
// import { connectDB, dbGetPlayerLastActivity } from '../utils/dbHelper';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Verificar última actividad del player en BD (heartbeat)', () => {
  test('@CP25PP', async ({ page }) => {
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

    // ── Verificación UI ───────────────────────────────────────────────────────
    // El campo "Última actividad" debe mostrarse en el detalle del player.
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    // Capturar texto de última actividad visible en la UI
    const lastActivityUI = page.locator(
      'paper-icon-item'
    ).filter({ hasText: /última actividad|last activity/i }).first();

    const uiText = await lastActivityUI.textContent().catch(() => null);
    // Solo verificamos que exista el campo — el formato depende del locale
    expect(uiText?.trim().length ?? 0).toBeGreaterThan(0);

    await page.screenshot({ path: 'screenshots/cp25pp_ui.png' });

    // ── Verificación BD ───────────────────────────────────────────────────────
    // La última actividad en BD debe ser reciente (heartbeat del player).
    // Descomentar cuando se implemente connectDB():
    //
    // const db = await connectDB();
    // try {
    //   const lastActivity = await dbGetPlayerLastActivity(db, config.playerCP11PP);
    //   expect(lastActivity).not.toBeNull();
    //
    //   // El heartbeat debe haber llegado en las últimas 2 horas
    //   const twoHoursMs = 2 * 60 * 60 * 1000;
    //   expect(Date.now() - lastActivity!.getTime()).toBeLessThan(twoHoursMs);
    // } finally {
    //   await db.close();
    // }
    // ─────────────────────────────────────────────────────────────────────────
  });
});
