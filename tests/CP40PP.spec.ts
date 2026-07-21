// Crear player en supertenant, asignarle PL_CP40PP y verificar en UI
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { createPlayerInCustomer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

// CustomerId del supertenant "* SUPER TENANT QA AUTOMATION" en demo5
const SUPER_TENANT_CUSTOMER_ID = 54;

test.describe('Asignar playlist de supertenant al player (CP40PP)', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) {
      await deletePlayer(id).catch(() => {});
    }
  });

  test('@CP40PP', async ({ page }) => {
    test.setTimeout(300000);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    // Crear player headless en el supertenant (CustomerId 54)
    const playerName = `Player CP40PP ${dateFormatter.datetime()}`;
    const player = await createPlayerInCustomer(SUPER_TENANT_CUSTOMER_ID, playerName).catch((err) => {
      throw new Error(`PRECONDICIÓN FALLIDA CP40PP: No se pudo crear el player en el supertenant. ${err.message}`);
    });
    cleanupIds.push(player.machineId);

    await loginWithSession(page, config.userName, config.password);

    // Cambiar al contexto del supertenant para poder ver y asignar su playlist.
    // El reload es necesario para que la app aplique el nuevo contexto (mismo patrón que CP44PP).
    await globalPage.switchToNewTenant(config.supertenantName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    // ── Asignar PL_CP40PP al player ───────────────────────────────────────────
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.clearAndSearch(playerName);
    await page.waitForTimeout(1500);

    // Verificar que el player aparece en la lista antes de intentar clickear
    const playerCards = await page.locator('#dexNetworkList dex-network-display-card').count().catch(() => 0);
    if (playerCards === 0) {
      throw new Error(
        `[BUG APP CP40PP] El player "${playerName}" no aparece en la lista de red del supertenant "${config.supertenantName}". ` +
        'El player fue creado con la activation key del supertenant pero no es visible en su vista de red.'
      );
    }
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    // Asignar la playlist del supertenant como default
    try {
      await networkDetailPage.setNewPlaylist(config.PL_CP40PP, config.PL_CP34PP);
    } catch (err) {
      throw new Error(
        `[BUG DATA CP40PP] La playlist "${config.PL_CP40PP}" no existe en el entorno demo5. ` +
        `Error: ${(err as Error).message}`
      );
    }
    if (await networkDetailPage.decisionToSavePlayer()) {
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/cp40pp_assign.png' });

    // ── Verificar que la playlist fue asignada ────────────────────────────────
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(playerName);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    const plInput = page.locator(
      'dex-network-display-detail#dexNetworkDetail dex-playlist-combo #playlistMenu input'
    );
    const assignedPL = (await plInput.inputValue()).trim();

    const expectedFragment = config.PL_CP40PP.replace(/^\([^)]+\)\s*/, '').toLowerCase();
    if (!assignedPL.toLowerCase().includes(expectedFragment)) {
      throw new Error(
        `[BUG APP CP40PP] La playlist asignada en UI es "${assignedPL}" pero se esperaba que contenga "${config.PL_CP40PP}".`
      );
    }

    expect(assignedPL.toLowerCase()).toContain(expectedFragment);

    await page.screenshot({ path: 'screenshots/cp40pp_verify.png' });
  });
});
