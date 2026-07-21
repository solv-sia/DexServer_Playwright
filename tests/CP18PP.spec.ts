// Crear player con nombre timestamped, asignarle playlist y calendario LNL,
// y verificar que aparece en la lista al buscar por nombre, playlist y calendario
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Search and consult players', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP18PP', async ({ page }) => {
    test.setTimeout(300000);

    const playerName = `Player CP18PP ${dateFormatter.datetime()}`;
    const player = await createPlayer(config.tenantActivationKeyCP16PP, playerName);
    cleanupIds.push(player.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    // Navegar al player vía deep-link (doble goto) para abrir el panel de detalle correctamente
    const playerUrl = `${config.baseUrl}/DexFrontEnd/#!/network/${player.machineId}`;
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    // Asignar playlist LNL; si no existe en demo5 → [BUG DATA]
    try {
      await networkDetailPage.setNewPlaylist(config.LNLplaylistName, config.LNLplaylistName);
    } catch {
      throw new Error(
        `[BUG DATA CP18PP] La playlist "${config.LNLplaylistName}" no existe en el entorno demo5. ` +
        'Debe estar pre-configurada antes de ejecutar la suite.'
      );
    }

    // Asignar calendario LNL; si no existe en demo5 → [BUG DATA]
    try {
      await networkDetailPage.setNewSchedule(config.LNLscheduleName, config.LNLscheduleName);
    } catch {
      throw new Error(
        `[BUG DATA CP18PP] El calendario "${config.LNLscheduleName}" no existe en el entorno demo5. ` +
        'Debe estar pre-configurado antes de ejecutar la suite.'
      );
    }

    await networkDetailPage.clickSave();
    await globalPage.readInfoPopup(/Player guardado|Player saved/i);

    // Volver a la lista de red para ejecutar las búsquedas
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    // Buscar por nombre del player recién creado
    try {
      await networkPage.checkDisplayPropertyValue({ playerName: player.machineName });
    } catch {
      throw new Error(
        `[BUG APP CP18PP] El player "${player.machineName}" no apareció en la lista al buscarlo por nombre.`
      );
    }
    await page.screenshot({ path: 'screenshots/cp18pp_player.png' });

    // Buscar por playlist asignada
    try {
      await networkPage.checkDisplayPropertyValue({ playlistName: config.LNLplaylistName });
    } catch {
      throw new Error(
        `[BUG APP CP18PP] No se encontraron players al buscar por la playlist "${config.LNLplaylistName}". ` +
        `El player "${player.machineName}" debería aparecer porque se le asignó esa playlist.`
      );
    }
    await page.screenshot({ path: 'screenshots/cp18pp_playlist.png' });

    // Buscar por calendario asignado
    try {
      await networkPage.checkDisplayPropertyValue({ scheduleName: config.LNLscheduleName });
    } catch {
      throw new Error(
        `[BUG APP CP18PP] No se encontraron players al buscar por el calendario "${config.LNLscheduleName}". ` +
        `El player "${player.machineName}" debería aparecer porque se le asignó ese calendario.`
      );
    }
    await page.screenshot({ path: 'screenshots/cp18pp_schedule.png' });

    await networkPage.clearSearchField();
    await page.waitForTimeout(500);
  });
});
