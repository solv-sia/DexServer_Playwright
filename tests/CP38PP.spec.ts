// Asignar sucursal a grupo syncro y verificar herencia en player
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

const syncGroupName = 'Grupo CP38PP ' + dateFormatter.datetime();

test.describe('Assign branch to sync group and verify player inherits it', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP38PP', async ({ page }) => {
    test.setTimeout(300000);

    // Precondición: crear player headless vía API
    const player = await createPlayer(config.tenantActivationKeyCP14PP, config.playerCP38PP);
    cleanupIds.push(player.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    // Crear grupo sincronizado con el nuevo player
    await networkPage.clickMoreBtn();
    await networkPage.clickSyncGroupBtn();

    await groupDetailPage.completeGroupNameInput(syncGroupName);
    await groupDetailPage.completePlaylistSelect(config.syncPlaylistName);
    await groupDetailPage.completeScheduleSelect(config.syncScheduleName);
    await groupDetailPage.completeTransmissionPolicySelect(config.syncTransmissionPolicyName);
    await groupDetailPage.completeHardwarePolicySelect(config.syncHardwarePolicyName);
    await groupDetailPage.completeIpMulticastInput1(config.ipMulticast1);
    await groupDetailPage.completeIpMulticastInput2(config.ipMulticast2);
    await groupDetailPage.completeIpMulticastInput3(config.ipMulticast3);
    await groupDetailPage.completeSynchronizationSelect(config.synchronizationTime);

    await groupDetailPage.completeChannelOneSelect(player.machineName);
    await groupDetailPage.decisionConfirmPlayer();

    // Asignar la primera sucursal disponible del combo
    const assignedStore = await groupDetailPage.selectFirstStoreOption();

    await groupDetailPage.clickSaveGroupBtn();
    await globalPage.waitSpinner();
    await page.screenshot({ path: 'screenshots/cp38pp_group.png' });

    // Navegar al player headless desde la tarjeta del grupo sincronizado (el player es el canal 1)
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(syncGroupName);
    await page.waitForTimeout(2500);
    await networkPage.clickResultingPlayer();

    await page.screenshot({ path: 'screenshots/cp38pp_player_detail_before.png' });
    await networkDetailPage.validateInheritedValues({
      storeName: assignedStore,
    });
    await page.screenshot({ path: 'screenshots/cp38pp_player_inherited_store.png' });
  });
});
