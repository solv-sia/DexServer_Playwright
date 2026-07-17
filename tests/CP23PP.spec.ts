// Solicitar logs y capturas al player y verificar via HB API
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Solicitar logs y capturas al player', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => { });
  });

  test('@CP23PP', async ({ page }) => {
    test.setTimeout(300000);

    const player = await createPlayer(config.tenantActivationKeyCP16PP, config.playerCP23PP);
    cleanupIds.push(player.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player.machineName);
    await page.waitForTimeout(5000);

    // Enviar comando de logs
    await networkPage.clickDisplayCheck();
    await networkPage.clickBotonera();
    await networkPage.clickSendLogCommand();
    await networkPage.clickConfirmButton();
    await globalPage.readInfoPopup(/solicitud enviada|request sended/i);
    await page.waitForTimeout(5000);
  

    // Enviar comando de screenshot
    await networkPage.clickDisplayCheck();
    await networkPage.clickBotonera();
    await networkPage.clickSendScreenshotCommand();
    await networkPage.clickConfirmButton();
    await globalPage.readInfoPopup(/solicitud enviada|request sended/i);

    await page.screenshot({ path: 'screenshots/cp23pp.png' });

    const hbUrl = `${config.baseUrl}/DexFrontend/api/v3/heartBeatSync/${player.machineId}/${player.messageKey}`;
    let hasSNDLGS = false;
    let hasSCNSHT = false;

    for (let i = 0; i < 10; i++) {
      const commandList: string[] = await page.evaluate(async (url) => {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        return data.CommandList ?? [];
      }, hbUrl);

      if (!hasSNDLGS) hasSNDLGS = commandList.some((cmd: string) => String(cmd).includes('SNDLGS'));
      if (!hasSCNSHT) hasSCNSHT = commandList.some((cmd: string) => String(cmd).includes('SCNSHT'));
      if (hasSNDLGS && hasSCNSHT) break;
      await page.waitForTimeout(2000);
    }

    expect(hasSNDLGS, 'El comando SNDLGS no está en el CommandList del HB').toBe(true);
    expect(hasSCNSHT, 'El comando SCNSHT no está en el CommandList del HB').toBe(true);
  });
});
