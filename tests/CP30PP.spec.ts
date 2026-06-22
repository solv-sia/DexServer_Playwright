// Crear política de transmisión y asignarla al grupo validando herencia
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { TransmissionPolicyPage } from '../pages/TransmissionPolicyPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Create Transmission Policy', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP30PP', async ({ page }) => {
    test.setTimeout(300000);

    const transmissionPolicyName = 'TR Policy ' + dateFormatter.datetime();
    const syncGroupName = 'Grupo Sincronizado Automation ' + dateFormatter.datetime();

    const [player1, player2] = await Promise.all([
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP30PP1),
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP30PP2),
    ]);
    cleanupIds.push(player1.machineId, player2.machineId);


    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);
    const trPolicyPage = new TransmissionPolicyPage(page);

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

    // Crear política de transmisión
    await globalPage.clickOnNetworkHeader();
    await globalPage.waitSpinner();
    await globalPage.clickOnTransmissionPolicyHeader();
    await page.waitForTimeout(5000);

    await trPolicyPage.clickOnCreateTRPolicyBtn();
    await trPolicyPage.nameTransmissionPolicy(transmissionPolicyName);
    await trPolicyPage.setBlockTime(config.blockTime);
    await trPolicyPage.setAllowTime(config.allowTime);
    await trPolicyPage.clickOnSavePolicyBtn();

    setSharedData('policyCP30PP', transmissionPolicyName);

    await globalPage.readInfoPopup(/Política guardada!|Policy saved/i);
    await page.screenshot({ path: 'screenshots/cp30pp_policy.png' });

    // Asignar política al grupo
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(syncGroupName);
    await networkPage.clickResultingGroup();
    await groupDetailPage.completeTransmissionPolicySelect(transmissionPolicyName);
    await groupDetailPage.clickSaveGroupBtn();
    await page.screenshot({ path: 'screenshots/cp30pp_group.png' });

    // Validar herencia en player1
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player1.machineName);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({ transmissionPolicyName });
    await page.screenshot({ path: 'screenshots/cp30pp_player1.png' });

    // Validar herencia en player2
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player2.machineName);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({ transmissionPolicyName });
    await page.screenshot({ path: 'screenshots/cp30pp_player2.png' });
  });
});
