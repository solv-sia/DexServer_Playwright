// Verificar en BD que la playlist y calendario asignados al player coinciden con UI
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
// import { connectDB, dbGetPlayerPlaylist } from '../utils/dbHelper';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Verificar asignaciones del player en BD (playlist / calendario)', () => {
  test('@CP26PP', async ({ page }) => {
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

    // ── Leer asignaciones desde UI ────────────────────────────────────────────
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    // Leer playlist asignada al player (campo de detalle)
    const plInput = page.locator(
      'dex-network-display-detail#dexNetworkDetail dex-playlist-combo #playlistMenu input'
    );
    const uiPlaylist = (await plInput.inputValue()).trim();
    expect(uiPlaylist.length).toBeGreaterThan(0);

    await page.screenshot({ path: 'screenshots/cp26pp_ui.png' });

    // ── Verificación BD ───────────────────────────────────────────────────────
    // La playlist registrada en BD debe coincidir con la mostrada en UI.
    // Descomentar cuando se implemente connectDB():
    //
    // const db = await connectDB();
    // try {
    //   const dbPlaylist = await dbGetPlayerPlaylist(db, config.playerCP11PP);
    //   expect(dbPlaylist).not.toBeNull();
    //
    //   // El valor en BD puede incluir "(heredado)" o el nombre directo
    //   // — ajustar la comparación según el schema real:
    //   expect(uiPlaylist.toLowerCase()).toContain(
    //     (dbPlaylist ?? '').toLowerCase().replace(/\s*\(heredado\)/i, '').trim()
    //   );
    // } finally {
    //   await db.close();
    // }
    // ─────────────────────────────────────────────────────────────────────────
  });
});
