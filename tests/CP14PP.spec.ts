// Configurar ajustes a nivel tenant y validar herencia en players
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { GeneralPage } from '../pages/GeneralPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Set up tenant configuration and validate inheritance', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP14PP', async ({ page }) => {
    test.setTimeout(300000);

    // Crear player headless en customer 5 (QA Automation) vía automation-api
    const player = await createPlayer(config.tenantActivationKeyCP14PP, config.playerCP14PP);
    cleanupIds.push(player.machineId);


    const globalPage = new GlobalPage(page);
    const generalPage = new GeneralPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    // Limpiar ajustes del tenant
    await globalPage.clickMenuSetting();
    await globalPage.clickOptionGeneral();
    await generalPage.clickDeviceTab();
    await generalPage.setValueNone();
    await generalPage.clickBottomSave();
    await globalPage.readInfoPopup(/Datos guardados!|Data saved!/i);
    await page.screenshot({ path: 'screenshots/cp14pp_a.png' });

    // Limpiar player recién creado
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player.machineName);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.setPlayerName(config.playerCP14PP);
    await networkDetailPage.setGroupNone();
    await networkDetailPage.setInheritedPLDefault();
    await networkDetailPage.setInheritedSchedule();
    await networkDetailPage.setInheritedTP();
    await networkDetailPage.setInheritedHP();
    if (await networkDetailPage.decisionToSavePlayer()) {
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    }
    await page.waitForTimeout(5000);

    // Configurar ajustes tenant
    await globalPage.clickMenuSetting();
    await globalPage.clickOptionGeneral();
    await generalPage.clickDeviceTab();
    await generalPage.completePlaylistSelect(config.playlistNameToInherit);
    await generalPage.completeScheduleSelect(config.scheduleNameToInherit);
    await generalPage.completeHardwarePolicySelect(config.hardwarePolicyNameToInherit);
    await generalPage.completeTransmissionPolicySelect(config.transmissionPolicyNameToInherit);
    await generalPage.completeTimeZoneSelect(config.timeZoneToInherit);
    await generalPage.clickBottomSave();
    await globalPage.readInfoPopup(/Datos guardados!|Data saved!/i);
    await page.screenshot({ path: 'screenshots/cp14pp_b.png' });
    await page.waitForTimeout(5000);

    // Validar herencia en el player.
    // La propagación de los ajustes del tenant al player es eventual: a veces el
    // detalle aún muestra los valores viejos justo después de guardar. Reabrimos el
    // player y revalidamos hasta que aparezcan los valores heredados (igual que la
    // prueba manual, donde basta con volver a abrirlo un instante después).
    await expect(async () => {
      await globalPage.clickNetwork();
      await globalPage.waitSpinner();
      await networkPage.clearAndSearch(player.machineName);
      await networkPage.clickResultingPlayer();
      await networkDetailPage.validateInheritedValues({
        playlistName: config.playlistNameToInherit,
        hardwarePolicyName: config.hardwarePolicyNameToInherit,
        transmissionPolicyName: config.transmissionPolicyNameToInherit,
        scheduleName: config.scheduleNameToInherit,
        timeZone: config.timeZoneToInherit,
      });
    }).toPass({ timeout: 90000, intervals: [3000, 5000, 5000, 8000, 8000] });
    await page.screenshot({ path: 'screenshots/cp14pp_c.png' });
  });
});
