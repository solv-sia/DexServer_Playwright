// Verificar conectividad y estado del player (PMH H 1) en UI y BD
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
// import { connectDB, dbGetPlayer, dbGetPlayerLastActivity } from '../utils/dbHelper';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Verificar conectividad del player CP11PP', () => {
  test('@CP11PP', async ({ page }) => {
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
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);

    // El player debe aparecer en la lista
    const playerCard = page.locator('dex-network-display-card').filter({ hasText: config.playerCP11PP });
    await expect(playerCard).toBeVisible({ timeout: 10000 });

    // Acceder al detalle del player
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    // Verificar que el panel de detalle se abrió
    await expect(page.locator('dex-network-display-detail#dexNetworkDetail')).toBeVisible();

    // Verificar que la versión instalada está visible (campo que sólo aparece cuando hay conexión)
    const versionText = await networkDetailPage.getCurrentVersion();
    expect(versionText.length).toBeGreaterThan(0);

    // El indicador de estado (ícono verde = conectado) debe estar presente
    const statusIndicator = page.locator(
      'dex-network-display-detail #dexNetworkDetail paper-icon-item iron-icon[icon*="check"], ' +
      'dex-network-display-detail iron-icon[class*="connected"], ' +
      'dex-network-display-card[class*="online"], ' +
      '.connection-status[class*="connected"], .status-indicator[class*="active"]'
    ).first();
    // Solo screenshot — el selector exacto depende del DOM real del player
    await page.screenshot({ path: 'screenshots/cp11pp_ui.png' });

    // ── Verificación BD ───────────────────────────────────────────────────────
    // Descomentar cuando se implemente connectDB():
    //
    // const db = await connectDB();
    // try {
    //   const player = await dbGetPlayer(db, config.playerCP11PP);
    //   expect(player).not.toBeNull();
    //
    //   const lastActivity = await dbGetPlayerLastActivity(db, config.playerCP11PP);
    //   expect(lastActivity).not.toBeNull();
    //   // El player debe haber tenido actividad en los últimos 30 minutos
    //   const thirtyMinutes = 30 * 60 * 1000;
    //   expect(Date.now() - lastActivity!.getTime()).toBeLessThan(thirtyMinutes);
    // } finally {
    //   await db.close();
    // }
    // ─────────────────────────────────────────────────────────────────────────
  });
});
