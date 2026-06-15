// Aprobar player manualmente: crear un player headless vía automation-api y activarlo en el tenant
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';
import { setSharedData } from '../utils/sharedData';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Aprobar player manualmente CP11PP', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP11PP', async ({ page }) => {
    test.setTimeout(300000);

    expect(
      config.tenantActivationKeyCP11PP,
      'tenantActivationKeyCP11PP debe estar configurado en configuration.json'
    ).toBeTruthy();

    const player = await createPlayer(config.tenantActivationKeyCP11PP);
    cleanupIds.push(player.machineId);
    expect(player.activationKey, 'El player debe tener ActivationKey para el diálogo de activación UI').toBeTruthy();
    const activationKey = player.activationKey!;
    const machineId = player.machineId;


    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.clickAddButton();
    await networkPage.clickActivatePlayerButton();

    await networkPage.typeDisplayName(config.playerCP11PP);
    await networkPage.typeDisplayCode(activationKey);
    await networkPage.clickSaveDialogButton();

    await globalPage.readInfoPopup(/Display creado|Display created/i);

    await networkPage.clearAndSearch(config.playerCP11PP);
    await networkPage.clickResultingPlayer();

    await networkDetailPage.completePlayerGroupSelect(config.nameGroup);
    await networkDetailPage.clickSave();
    await globalPage.readInfoPopup(/Player guardado|Player saved/i);

    await page.screenshot({ path: 'screenshots/cp11pp.png' });

    setSharedData('machineIdCP11PP', String(machineId));
  });
});
