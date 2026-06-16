// Crear grupo LNL y asignar players validando herencia
import { test } from '@playwright/test';
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

test.describe('Create LNL Group', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => { });
  });

  test('@CP16PP', async ({ page }) => {
    test.setTimeout(300000);
    const lonelyGroupName = 'Grupo Lonely Automation ' + dateFormatter.datetime();

    const [player1, player2] = await Promise.all([
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP16PP1),
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP16PP2),
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
    await networkPage.clickGroupBtn();

    await groupDetailPage.completeGroupNameInput(lonelyGroupName);
    await groupDetailPage.completePlaylistSelect(config.LNLplaylistName);
    await groupDetailPage.completeScheduleSelect(config.LNLscheduleName);
    await groupDetailPage.completeTransmissionPolicySelect(config.LNLtransmissionPolicyName);
    await groupDetailPage.completeHardwarePolicySelect(config.LNLhardwarePolicyName);
    await groupDetailPage.clickSaveGroupBtn();
    await globalPage.waitSpinner();
    await globalPage.readInfoPopup(/Grupo guardado|Group saved/i);
    await page.screenshot({ path: 'screenshots/cp16pp_group.png' });

    // Asignar player1 al grupo
    await networkPage.clearAndSearch(player1.machineName);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.setGroupNone();
    await networkDetailPage.setInheritedPLDefault();
    await networkDetailPage.setInheritedSchedule();
    await networkDetailPage.setInheritedTP();
    await networkDetailPage.setInheritedHP();
    if (await networkDetailPage.decisionToSavePlayer()) {
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    } else {
      // Panel closed (values already matched) — reopen to assign group
      await networkPage.clickResultingPlayer();
    }
    await networkDetailPage.completePlayerGroupSelect(lonelyGroupName);
    await page.screenshot({ path: 'screenshots/cp16pp_player1.png' });
    if (await networkDetailPage.decisionToSavePlayer(false)) {
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    }
    await networkDetailPage.validateInheritedValues({
      playlistName: config.LNLplaylistName,
      hardwarePolicyName: config.LNLhardwarePolicyName,
      transmissionPolicyName: config.LNLtransmissionPolicyName,
      scheduleName: config.LNLscheduleName,
    });

    // Asignar player2 al grupo
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player2.machineName);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.setGroupNone();
    await networkDetailPage.setInheritedPLDefault();
    await networkDetailPage.setInheritedSchedule();
    await networkDetailPage.setInheritedTP();
    await networkDetailPage.setInheritedHP();
    if (await networkDetailPage.decisionToSavePlayer()) {
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    } else {
      // Panel closed (values already matched) — reopen to assign group
      await networkPage.clickResultingPlayer();
    }
    await networkDetailPage.completePlayerGroupSelect(lonelyGroupName);
    await page.screenshot({ path: 'screenshots/cp16pp_player2.png' });
    if (await networkDetailPage.decisionToSavePlayer(false)) {
      await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    }
    await networkDetailPage.validateInheritedValues({
      playlistName: config.LNLplaylistName,
      hardwarePolicyName: config.LNLhardwarePolicyName,
      transmissionPolicyName: config.LNLtransmissionPolicyName,
      scheduleName: config.LNLscheduleName,
    });

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(lonelyGroupName);
    await page.screenshot({ path: 'screenshots/cp16pp_final.png' });

    setSharedData('groupCP16PP', lonelyGroupName);
  });
});
