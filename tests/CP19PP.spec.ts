// Crear player, asignar playlist y calendario, y verificar el cambio en la UI del panel de detalle
import { test } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Update a player playlist/schedule and verify via HB API', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP19PP', async ({ page }) => {
    test.setTimeout(300000);

    const player = await createPlayer(config.tenantActivationKeyCP16PP, config.playerCP19PP);
    cleanupIds.push(player.machineId);

    const globalPage = new GlobalPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    // Navegar vía deep-link (doble goto): el panel de detalle no se inicializa correctamente
    // con un único goto cuando la URL es deep-link directo, por lo que se navega dos veces.
    // Se usa machineId para evitar búsqueda por nombre (nombres fijos colisionan entre corridas).
    const playerUrl = `${config.baseUrl}/DexFrontEnd/#!/network/${player.machineId}`;
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    // Asignar playlist por defecto; si no existe ninguna de las dos opciones → [BUG DATA]
    try {
      await networkDetailPage.setNewPlaylist(config.playlistDefaultCP19PP, config.playlistDefaultCP19BackUp);
    } catch {
      throw new Error(
        `[BUG DATA CP19PP] Ninguna de las playlists "${config.playlistDefaultCP19PP}" / ` +
        `"${config.playlistDefaultCP19BackUp}" existe en el entorno demo5. ` +
        'Deben estar pre-configuradas antes de ejecutar la suite.'
      );
    }

    // Asignar calendario; si no existe ninguno de los dos → [BUG DATA]
    try {
      await networkDetailPage.setNewSchedule(config.scheduleCP19PP, config.scheduleCP19BackUp);
    } catch {
      throw new Error(
        `[BUG DATA CP19PP] Ninguno de los calendarios "${config.scheduleCP19PP}" / ` +
        `"${config.scheduleCP19BackUp}" existe en el entorno demo5. ` +
        'Deben estar pre-configurados antes de ejecutar la suite.'
      );
    }

    await networkDetailPage.clickSave();
    await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    await page.screenshot({ path: 'screenshots/cp19pp_saved.png' });

    const expectedPL = networkDetailPage.plApplied;
    const expectedSH = networkDetailPage.shApplied;

    // Verificar atributos del player recargando el panel de detalle vía deep-link
    // (búsqueda por atributos: se navega al player y se leen sus campos asignados en la UI)
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    const plInput = page.locator('dex-network-display-detail#dexNetworkDetail dex-playlist-combo #playlistMenu input');
    const shInput = page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').first().locator('input');

    // Esperar hasta 10 s a que los campos del panel de detalle tengan valor (el panel carga async)
    let assignedPL = '';
    let assignedSH = '';
    for (let i = 0; i < 20; i++) {
      assignedPL = (await plInput.inputValue().catch(() => '')).trim();
      assignedSH = (await shInput.inputValue().catch(() => '')).trim();
      if (assignedPL && assignedSH) break;
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'screenshots/cp19pp_verify.png' });

    if (!assignedPL.toLowerCase().includes(expectedPL.toLowerCase())) {
      throw new Error(
        `[BUG APP CP19PP] El player "${player.machineName}" no muestra la playlist "${expectedPL}" ` +
        `en el panel de detalle tras guardar. Valor leído en UI: "${assignedPL}".`
      );
    }

    if (!assignedSH.toLowerCase().includes(expectedSH.toLowerCase())) {
      throw new Error(
        `[BUG APP CP19PP] El player "${player.machineName}" no muestra el calendario "${expectedSH}" ` +
        `en el panel de detalle tras guardar. Valor leído en UI: "${assignedSH}".`
      );
    }
  });
});
