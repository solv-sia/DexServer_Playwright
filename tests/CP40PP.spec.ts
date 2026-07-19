// Asignar playlist de supertenant al player y verificar en UI y BD
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
// import { connectDB, dbGetPlayerPlaylist } from '../utils/dbHelper';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Asignar playlist de supertenant al player (CP40PP)', () => {
  test('@CP40PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    // ── Asignar PL_CP40PP al player ───────────────────────────────────────────
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);

    // Verificar que el player aparece en la lista antes de intentar clickear
    const playerCards = await page.locator('#dexNetworkList dex-network-display-card').count().catch(() => 0);
    if (playerCards === 0) {
      throw new Error(
        `[BUG APP CP40PP] El player "${config.playerCP11PP}" no aparece en la lista de red para testermation2. ` +
        'El player fue creado y aprobado en CP11PP (clave de activación distinta a la del tenant FODNMR). ' +
        'Posible causa: el player pertenece a un contexto de tenant diferente al que ve testermation2 al iniciar sesión, ' +
        'o la visibilidad multi-tenant no está habilitada en esta versión.'
      );
    }
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    // Asignar la playlist del supertenant como default
    await networkDetailPage.setNewPlaylist(config.PL_CP40PP, config.PL_CP34PP);
    if (await networkDetailPage.decisionToSavePlayer()) {
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/cp40pp_assign.png' });

    // ── Verificar que la playlist fue asignada ────────────────────────────────
    // Recargar y verificar el campo en la UI
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    const plInput = page.locator(
      'dex-network-display-detail#dexNetworkDetail dex-playlist-combo #playlistMenu input'
    );
    const assignedPL = (await plInput.inputValue()).trim();

    // La playlist asignada debe contener el nombre de PL_CP40PP
    // (puede aparecer con el prefijo del tenant entre paréntesis)
    expect(assignedPL.toLowerCase()).toContain(
      config.PL_CP40PP.replace(/^\([^)]+\)\s*/, '').toLowerCase()
    );

    await page.screenshot({ path: 'screenshots/cp40pp_verify.png' });

    // ── Verificación BD ───────────────────────────────────────────────────────
    // Descomentar cuando se implemente connectDB():
    //
    // const db = await connectDB();
    // try {
    //   const dbPlaylist = await dbGetPlayerPlaylist(db, config.playerCP11PP);
    //   expect(dbPlaylist).not.toBeNull();
    //   expect((dbPlaylist ?? '').toLowerCase()).toContain(
    //     config.PL_CP40PP.replace(/^\([^)]+\)\s*/, '').toLowerCase()
    //   );
    // } finally {
    //   await db.close();
    // }
    // ─────────────────────────────────────────────────────────────────────────
  });
});
