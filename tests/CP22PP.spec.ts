// Downgrade y upgrade de versión de player (CP11PP player)
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Actualizar la version de los players (probar downgrade y upgrade)', () => {
  test('@CP22PP', async ({ page }) => {
    test.setTimeout(300000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(2000);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(2000);

    const currentVersion = await networkDetailPage.getCurrentVersion();
    const previousVersion = config.previousVersion.trim();
    const latestVersion = config.latestVersion.trim();
    const maxRetries = 8;

    let firstVersion: string;
    let secondVersion: string;

    if (currentVersion.trim() === latestVersion) {
      firstVersion = previousVersion;
      secondVersion = latestVersion;
    } else if (currentVersion.trim() === previousVersion) {
      firstVersion = latestVersion;
      secondVersion = previousVersion;
    } else {
      firstVersion = previousVersion;
      secondVersion = latestVersion;
    }

    const setAndVerifyVersion = async (targetVersion: string) => {
      const versionInput = networkDetailPage['elements'].versionInput();
      await versionInput.fill(targetVersion, { force: true });
      await versionInput.press('ArrowDown');
      await versionInput.press('Enter');
      await networkDetailPage.clickSave();
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);

      for (let i = 0; i < maxRetries; i++) {
        const ver = await networkDetailPage.getCurrentVersion();
        if (ver.trim() === targetVersion) break;
        await page.waitForTimeout(15000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await globalPage.waitSpinner();
        await page.waitForTimeout(15000);
      }
    };

    await setAndVerifyVersion(firstVersion);
    await setAndVerifyVersion(secondVersion);

    await page.screenshot({ path: 'screenshots/cp22pp.png' });
  });
});
