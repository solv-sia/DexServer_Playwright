// Crear grupo LNL y asignar players validando herencia
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Create LNL Group', () => {
  test('@CP16PP', async ({ page }) => {
    test.setTimeout(120000);
    const lonelyGroupName = 'Grupo Lonely Automation ' + dateFormatter.datetime();

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

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
    await page.screenshot({ path: 'screenshots/cp16pp_group.png' });

    // Asignar player1 al grupo
    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.setGroupNone();
    await networkDetailPage.setInheritedPLDefault();
    await networkDetailPage.setInheritedSchedule();
    await networkDetailPage.setInheritedTP();
    await networkDetailPage.setInheritedHP();
    await networkDetailPage.decisionToSavePlayer();
    await networkDetailPage.completePlayerGroupSelect(lonelyGroupName);
    await page.screenshot({ path: 'screenshots/cp16pp_player1.png' });
    await networkDetailPage.decisionToSavePlayer();
    await globalPage.readInfoPopup(/Player guardado|Player saved/i);


    await networkDetailPage.validateInheritedValues({
      playlistName: config.LNLplaylistName,
      hardwarePolicyName: config.LNLhardwarePolicyName,
      transmissionPolicyName: config.LNLtransmissionPolicyName,
      scheduleName: config.LNLscheduleName,
    });

    await page.waitForTimeout(1500);

    // Asignar player2 al grupo
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(config.player2);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.setGroupNone();
    await networkDetailPage.setInheritedPLDefault();
    await networkDetailPage.setInheritedSchedule();
    await networkDetailPage.setInheritedTP();
    await networkDetailPage.setInheritedHP();
    await networkDetailPage.decisionToSavePlayer();
    await networkDetailPage.completePlayerGroupSelect(lonelyGroupName);
    await page.screenshot({ path: 'screenshots/cp16pp_player2.png' });
    await networkDetailPage.decisionToSavePlayer();
    await globalPage.readInfoPopup(/Player guardado|Player saved/i);

    await networkDetailPage.validateInheritedValues({
      playlistName: config.LNLplaylistName,
      hardwarePolicyName: config.LNLhardwarePolicyName,
      transmissionPolicyName: config.LNLtransmissionPolicyName,
      scheduleName: config.LNLscheduleName,
    });

    await page.waitForTimeout(1500);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(lonelyGroupName);
    await page.screenshot({ path: 'screenshots/cp16pp_final.png' });

    setSharedData('groupCP16PP', lonelyGroupName);
  });
});
