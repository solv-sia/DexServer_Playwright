// Crear player, asignar playlist y calendario, y verificar el cambio vía HB API
import { test, expect } from '@playwright/test';
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

    // Navegar vía deep-link (no por clic en tarjeta): los paneles abiertos desde tarjeta no confirman
    // los cambios de combo en el dirty state de Polymer, por lo que el botón guardar queda deshabilitado. El doble goto
    // asegura que el panel se inicialice correctamente. Se usa machineId para apuntar al player recién creado
    // en lugar de buscar por nombre (el nombre fijo colisiona con players de corridas anteriores).
    const playerUrl = `${config.baseUrl}/DexFrontEnd/#!/network/${player.machineId}`;
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await networkDetailPage.setNewPlaylist(config.playlistDefaultCP19PP, config.playlistDefaultCP19BackUp);
    await networkDetailPage.setNewSchedule(config.scheduleCP19PP, config.scheduleCP19BackUp);

    await networkDetailPage.clickSave();
    await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    await page.screenshot({ path: 'screenshots/cp19pp_saved.png' });

    // Verificar vía API de HB usando el machineId y messageKey del player creado
    const hbUrl = `${config.baseUrl}/DexFrontend/api/v3/heartBeatSync/${player.machineId}/${player.messageKey}`;
    let playlistId = 0;
    let scheduleId = 0;
    let lastHbData: Record<string, unknown> = {};

    for (let i = 0; i < 15; i++) {
      const hbData: Record<string, unknown> = await page.evaluate(async (url) => {
        const res = await fetch(url, { method: 'POST' });
        return res.json();
      }, hbUrl);

      lastHbData = hbData;
      playlistId = Number(hbData['CurrentPlaylistId'] ?? 0);
      scheduleId = Number(hbData['CurrentScheduleId'] ?? 0);
      if (playlistId && scheduleId) break;
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'screenshots/cp19pp_hb.png' });

    expect(playlistId, `HB CurrentPlaylistId should be non-zero. Full response: ${JSON.stringify(lastHbData)}`).toBeGreaterThan(0);
    expect(scheduleId, `HB CurrentScheduleId should be non-zero. Full response: ${JSON.stringify(lastHbData)}`).toBeGreaterThan(0);
  });
});
