// Crear un TAG y asignarlo al grupo, validar herencia en players
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { TagPage } from '../pages/TagPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Create a TAG and assign it to the group', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP21PP', async ({ page }) => {
    test.setTimeout(300000);

    const tagName = 'SERVER TEST ' + dateFormatter.datetime();
    const syncGroupName = 'Grupo Sincronizado Automation ' + dateFormatter.datetime();

    const [player1, player2] = await Promise.all([
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP21PP1),
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP21PP2),
    ]);
    cleanupIds.push(player1.machineId, player2.machineId);


    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);
    const tagPage = new TagPage(page);

    await loginWithSession(page, config.userName2, config.password);

    // Crear sync group con los players recién creados
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
    await groupDetailPage.completeChannelOneSelect(player1.machineName);
    await groupDetailPage.decisionConfirmPlayer();
    await groupDetailPage.completeChannelTwoSelect(player2.machineName);
    await groupDetailPage.decisionConfirmPlayer();
    await groupDetailPage.clickSaveGroupBtn();
    await page.screenshot({ path: 'screenshots/cp21pp_group_sync.png' });

    // Crear TAG
    await globalPage.clickMenuSetting();
    await globalPage.clickOptionTag();
    await tagPage.clickAddBtn();
    await tagPage.typeTagName(tagName);
    await tagPage.clickSaveBtn();
    await page.screenshot({ path: 'screenshots/cp21pp_tag.png' });

    // Asignar tag al grupo
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player1.machineName);
    await networkPage.clickResultingGroup();
    await groupDetailPage.completeTagSelect(tagName);
    await groupDetailPage.clickSaveGroupBtn();
    await page.screenshot({ path: 'screenshots/cp21pp_group.png' });

    // Validar tag en player1
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player1.machineName);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateTagValue(tagName);
    await page.screenshot({ path: 'screenshots/cp21pp_player1.png' });

    // Validar tag en player2
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player2.machineName);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateTagValue(tagName);
    await page.screenshot({ path: 'screenshots/cp21pp_player2.png' });
  });
});
