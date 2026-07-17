// Crear grupo SYNC y asignar players validando herencia
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Create SYNC Group', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP20PP', async ({ page }) => {
    test.setTimeout(300000);

    const syncGroupName = 'Grupo Sincronizado Automation ' + dateFormatter.datetime();

    const [player1, player2] = await Promise.all([
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP20PP1),
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP20PP2),
    ]);
    cleanupIds.push(player1.machineId, player2.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

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

    setSharedData('groupCP20PP', syncGroupName);

    await groupDetailPage.completeChannelOneSelect(player1.machineName);
    await groupDetailPage.decisionConfirmPlayer();
    await groupDetailPage.completeChannelTwoSelect(player2.machineName);
    await groupDetailPage.decisionConfirmPlayer();

    await groupDetailPage.clickSaveGroupBtn();
    await globalPage.waitSpinner();
    await page.screenshot({ path: 'screenshots/cp20pp_group.png' });

    // Validar player1
    await networkPage.clearAndSearch(syncGroupName);
    await page.screenshot({ path: 'screenshots/cp20pp_search_group.png' });

    await expect(async () => {
      await globalPage.clickNetwork();
      await globalPage.waitSpinner();
      await networkPage.clearAndSearch(player1.machineName);
      await networkPage.clickResultingPlayer();
      await networkDetailPage.validateInheritedValues({
        playlistName: config.syncPlaylistName,
        hardwarePolicyName: config.syncHardwarePolicyName,
        transmissionPolicyName: config.syncTransmissionPolicyName,
        scheduleName: config.syncScheduleName,
      });
    }).toPass({ timeout: 60000, intervals: [3000, 5000, 5000, 8000] });
    await page.screenshot({ path: 'screenshots/cp20pp_player1.png' });

    // Validar player2
    await expect(async () => {
      await globalPage.clickNetwork();
      await globalPage.waitSpinner();
      await networkPage.clearAndSearch(player2.machineName);
      await networkPage.clickResultingPlayer();
      await networkDetailPage.validateInheritedValues({
        playlistName: config.syncPlaylistName,
        hardwarePolicyName: config.syncHardwarePolicyName,
        transmissionPolicyName: config.syncTransmissionPolicyName,
        scheduleName: config.syncScheduleName,
      });
    }).toPass({ timeout: 60000, intervals: [3000, 5000, 5000, 8000] });
    await page.screenshot({ path: 'screenshots/cp20pp_player2.png' });
  });
});
