// Solicitar logs y capturas al player (CP11PP player)
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Solicitar logs y capturas al player', () => {
  test('@CP23PP', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player1);
    await globalPage.waitSpinner();

    // Enviar comando de logs
    await networkPage.clickDisplayCheck();
    await page.waitForTimeout(1000);
    await networkPage.clickBotonera();
    await page.waitForTimeout(1000);
    await networkPage.clickSendLogCommand();
    await page.waitForTimeout(1000);
    await networkPage.clickConfirmButton();
    await globalPage.readInfoPopup(/solicitud enviada|request sended/i);

    // Enviar comando de screenshot
    await networkPage.clickDisplayCheck();
    await page.waitForTimeout(1000);
    await networkPage.clickBotonera();
    await page.waitForTimeout(1000);
    await networkPage.clickSendScreenshotCommand();
    await page.waitForTimeout(1000);
    await networkPage.clickConfirmButton();
    await globalPage.readInfoPopup(/solicitud enviada|request sended/i);

    await page.screenshot({ path: 'screenshots/cp23pp.png' });

    // Polling: hace el fetch desde el contexto del browser (misma sesión/cookies)
    const hbUrl = `${config.baseUrl}/DexFrontend/api/v3/heartBeatSync/${config.machineIdCP23PP}/${config.messageKeyCP23PP}`;
    let hasSNDLGS = false;
    let hasSCNSHT = false;

    for (let i = 0; i < 10; i++) {
      const commandList: string[] = await page.evaluate(async (url) => {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        return data.CommandList ?? [];
      }, hbUrl);

      hasSNDLGS = commandList.some((cmd: string) => String(cmd).includes('SNDLGS'));
      hasSCNSHT = commandList.some((cmd: string) => String(cmd).includes('SCNSHT'));
      if (hasSNDLGS && hasSCNSHT) break;
      await page.waitForTimeout(2000);
    }

    expect(hasSNDLGS, 'El comando SNDLGS no está en el CommandList del HB').toBe(true);
    expect(hasSCNSHT, 'El comando SCNSHT no está en el CommandList del HB').toBe(true);
  });
});
