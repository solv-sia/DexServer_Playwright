// Activar más players que licencias activas en el tenant
import { test } from '@playwright/test';
import config from '../utils/config';
import { loginWithSession } from '../utils/loginWithSession';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Activar mas players que licencias activas en el tenant', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP31PP', async ({ page }) => {
    test.setTimeout(300000);

    const player = await createPlayer(config.tenantActivationKeyCP11PP);
    cleanupIds.push(player.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await loginWithSession(page, config.userName, config.password, config.tenant31);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.clickAddButton();
    await networkPage.clickActivatePlayerButton();

    await networkPage.typeDisplayName(player.machineName);
    await networkPage.typeDisplayCode(player.activationKey!);

    await networkPage.clickSaveDialogButton();

    await globalPage.readErrorPopup(/No se puede activar el dispositivo; licencias excedidas|Can't activate the device; licenses exceeded/i);

    await page.screenshot({ path: 'screenshots/cp31pp.png' });
  });
});
