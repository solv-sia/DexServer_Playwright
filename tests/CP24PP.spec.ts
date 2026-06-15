// Enviar reinicio al player y verificar via HB API
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Enviar reinicio al player', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => { });
  });

  test('@CP24PP', async ({ page }) => {
    test.setTimeout(300000);

    const player = await createPlayer(config.tenantActivationKeyCP16PP, config.playerCP24PP);
    cleanupIds.push(player.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player.machineName);
    await page.waitForTimeout(5000);

    await networkPage.clickDisplayCheck();
    await networkPage.clickBotonera();
    await networkPage.clickRebootCommand();
    await networkPage.clickConfirmButton();
    await globalPage.readInfoPopup(/solicitud enviada|request sended/i);
    await page.screenshot({ path: 'screenshots/cp24pp.png' });

    const hbUrl = `${config.baseUrl}/DexFrontend/api/v3/heartBeatSync/${player.machineId}/${player.messageKey}`;
    let hasREBOOT = false;

    for (let i = 0; i < 10; i++) {
      const commandList: string[] = await page.evaluate(async (url) => {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        return data.CommandList ?? [];
      }, hbUrl);

      hasREBOOT = commandList.some((cmd: string) => String(cmd).includes('REBOOT'));
      if (hasREBOOT) break;
      await page.waitForTimeout(2000);
    }

    expect(hasREBOOT, 'El comando REBOOT no está en el CommandList del HB').toBe(true);
  });
});
