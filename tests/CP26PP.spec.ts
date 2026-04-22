// Enviar borrado de fábrica al player (CP26PP)
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Enviar borrado de fábrica al player', () => {
  test('@CP26PP', async ({ page }) => {
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

    await networkPage.clickDisplayCheck();
    await page.waitForTimeout(1000);
    await networkPage.clickBotonera();
    await page.waitForTimeout(1000);
    await networkPage.clickResetCommand();
    await page.waitForTimeout(1000);
    await networkPage.clickConfirmButton();
    await globalPage.readInfoPopup(/solicitud enviada|request sended/i);

    await page.screenshot({ path: 'screenshots/cp26pp.png' });

    const hbUrl = `${config.baseUrl}/DexFrontend/api/v3/heartBeatSync/${config.machineIdCP23PP}/${config.messageKeyCP23PP}`;
    let hasRESET = false;

    for (let i = 0; i < 10; i++) {
      const commandList: string[] = await page.evaluate(async (url) => {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        return data.CommandList ?? [];
      }, hbUrl);

      hasRESET = commandList.some((cmd: string) => String(cmd).includes('RESET'));
      if (hasRESET) break;
      await page.waitForTimeout(2000);
    }

    expect(hasRESET, 'El comando RESET no está en el CommandList del HB').toBe(true);
  });
});
