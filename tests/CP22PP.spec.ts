// Crear player, cambiar versión (downgrade y upgrade), verificar via HB API
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { createPlayer, deletePlayer, getHeartBeatByMachineId } from '../utils/automationApi';

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
    const networkDetailPage = new NetworkDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    // Open the player detail via deep-link URL (not a card click). The card-opened panel
    // binds the version combo differently and never commits the change; the URL-opened
    // one does. The first goto can drop to #!/network, so navigate twice.
    const playerUrl = `${config.baseUrl}/DexFrontEnd/#!/network/${player.machineId}`;
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const setVersionAndVerifyHB = async (targetVersion: string) => {
      // setVersionToInstall selects the version and clicks Save (within the brief enabled window).
      await networkDetailPage.setVersionToInstall(targetVersion);
      await page.waitForTimeout(3000);

      let latestVersion = '';
      let lastHbData: Record<string, unknown> = {};

      // Read the heartbeat via the dexaut QA endpoint, which surfaces the player's
      // configured "version to install" as LatestVersion.
      for (let i = 0; i < 10; i++) {
        const hbData = await getHeartBeatByMachineId(player.machineId);

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

    // The player is born displaying the handshake version (config.previousVersion,
    // 6.4.2408.2600) in the "version to install" combo. Install the OTHER version first
    // (latestVersion) so it's a real change the combo commits, then previousVersion —
    // now also a real change (latest -> previous downgrade).
    const firstVersion = config.latestVersion;
    const secondVersion = config.previousVersion;

    await setVersionAndVerifyHB(firstVersion);
    await page.screenshot({ path: 'screenshots/cp22pp_step1.png' });

    await setVersionAndVerifyHB(secondVersion);
    await page.screenshot({ path: 'screenshots/cp22pp_step2.png' });
  });
});
