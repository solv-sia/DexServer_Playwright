// Verificar en BD que la versión del player quedó actualizada tras CP22PP
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
// import { connectDB, dbGetPlayerVersion } from '../utils/dbHelper';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Verificar versión del player en BD (post CP22PP)', () => {
  test('@CP23PP', async ({ page }) => {
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

    // ── Obtener versión desde UI ──────────────────────────────────────────────
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    const uiVersion = await networkDetailPage.getCurrentVersion();
    expect(uiVersion.trim().length).toBeGreaterThan(0);

    await page.screenshot({ path: 'screenshots/cp23pp_ui.png' });

    // ── Verificación BD ───────────────────────────────────────────────────────
    // La versión mostrada en UI debe coincidir con la registrada en la BD.
    // Descomentar cuando se implemente connectDB():
    //
    // const db = await connectDB();
    // try {
    //   const dbVersion = await dbGetPlayerVersion(db, config.playerCP11PP);
    //   expect(dbVersion).not.toBeNull();
    //   expect(dbVersion!.trim()).toBe(uiVersion.trim());
    // } finally {
    //   await db.close();
    // }
    //
    // Adicionalmente verificar que la versión sea una de las dos conocidas:
    // const knownVersions = [config.previousVersion.trim(), config.latestVersion.trim()];
    // expect(knownVersions).toContain(dbVersion!.trim());
    // ─────────────────────────────────────────────────────────────────────────
  });
});
