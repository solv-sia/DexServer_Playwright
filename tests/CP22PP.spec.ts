// Crear player, cambiar versión (downgrade y upgrade), verificar via HB API
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Actualizar la version de los players (probar downgrade y upgrade)', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP22PP', async ({ page }) => {
    test.setTimeout(300000);

    const player = await createPlayer(config.tenantActivationKeyCP16PP, config.playerCP22PP);
    cleanupIds.push(player.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player.machineName);
     await page.waitForTimeout(3000);
    await networkPage.clickResultingPlayer();

    const hbUrl = `${config.baseUrl}/DexFrontend/api/v3/heartBeatSync/${player.machineId}/${player.messageKey}`;

    const setVersionAndVerifyHB = async (targetVersion: string) => {
      const versionInput = networkDetailPage['elements'].versionInput();
      await versionInput.fill(targetVersion, { force: true });
      await versionInput.press('ArrowDown');
      await versionInput.press('Enter');
      await networkDetailPage.clickSave();
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);
      await page.waitForTimeout(5000);

      let latestVersion = '';
      let lastHbData: Record<string, unknown> = {};

      for (let i = 0; i < 10; i++) {
        const hbData: Record<string, unknown> = await page.evaluate(async (url) => {
          const res = await fetch(url, { method: 'POST' });
          return res.json();
        }, hbUrl);

        lastHbData = hbData;
        latestVersion = String(hbData['LatestVersion'] ?? '');
        if (latestVersion === targetVersion) break;
        await page.waitForTimeout(3000);
      }

      expect(
        latestVersion,
        `HB LatestVersion should be ${targetVersion}. Full response: ${JSON.stringify(lastHbData)}`
      ).toBe(targetVersion);
    };

    const initialHb: Record<string, unknown> = await page.evaluate(async (url) => {
      const res = await fetch(url, { method: 'POST' });
      return res.json();
    }, hbUrl);
    const currentVersion = String(initialHb['LatestVersion'] ?? '');

    // Always start with whichever version differs from the current one
    const [firstVersion, secondVersion] = currentVersion === config.previousVersion
      ? [config.latestVersion, config.previousVersion]
      : [config.previousVersion, config.latestVersion];

    await setVersionAndVerifyHB(firstVersion);
    await page.screenshot({ path: 'screenshots/cp22pp_step1.png' });

    await setVersionAndVerifyHB(secondVersion);
    await page.screenshot({ path: 'screenshots/cp22pp_step2.png' });
  });
});
