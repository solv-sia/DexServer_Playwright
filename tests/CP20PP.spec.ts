// Crear grupo SYNC y asignar players validando herencia
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';

test.use({ storageState: { cookies: [], origins: [] } });

const syncGroupName = 'Grupo Sincronizado Automation ' + dateFormatter.datetime();

test.describe('Create SYNC Group', () => {
  test('@CP20PP', async ({ page }) => {
    test.setTimeout(300000);


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

    await groupDetailPage.completeChannelOneSelect(config.player1);
    await groupDetailPage.decisionConfirmPlayer();
    await groupDetailPage.completeChannelTwoSelect(config.player2);
    await groupDetailPage.decisionConfirmPlayer();

    await groupDetailPage.clickSaveGroupBtn();
    await page.screenshot({ path: 'screenshots/cp20pp_group.png' });

    // Validar player1
    await networkPage.clearAndSearch(syncGroupName);
    await page.screenshot({ path: 'screenshots/cp20pp_search_group.png' });

    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({
      playlistName: config.syncPlaylistName,
      hardwarePolicyName: config.syncHardwarePolicyName,
      transmissionPolicyName: config.syncTransmissionPolicyName,
      scheduleName: config.syncScheduleName,
    });
    await page.screenshot({ path: 'screenshots/cp20pp_player1.png' });

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    // Validar player2
    await networkPage.clearAndSearch(config.player2);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({
      playlistName: config.syncPlaylistName,
      hardwarePolicyName: config.syncHardwarePolicyName,
      transmissionPolicyName: config.syncTransmissionPolicyName,
      scheduleName: config.syncScheduleName,
    });
    await page.screenshot({ path: 'screenshots/cp20pp_player2.png' });
  });
});
