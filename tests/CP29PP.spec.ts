// Crear política de hardware y asignarla al grupo validando herencia
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { HardwarePolicyPage } from '../pages/HardwarePolicyPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

const hardwarePolicyName = 'HW Policy ' + dateFormatter.datetime();

test.describe('Create HW Policy', () => {
  test('@CP29PP', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);
    const hwPolicyPage = new HardwarePolicyPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickOnNetworkHeader();
    await globalPage.waitSpinner();
    await globalPage.clickOnHardwarePolicyHeader();

    await hwPolicyPage.clickOnCreateHardwarePolicy();
    await hwPolicyPage.nameHardwarePolicy(hardwarePolicyName);
    await hwPolicyPage.setRebootTime(config.rebootTime);
    await hwPolicyPage.clickOnSavePolicyBtn();

    setSharedData('policyCP29PP', hardwarePolicyName);

    await globalPage.readInfoPopup(/Política guardada!|Policy saved/i);
    await page.screenshot({ path: 'screenshots/cp29pp_policy.png' });
    await page.waitForTimeout(1000);

    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingGroup();
    await groupDetailPage.completeHardwarePolicySelect(hardwarePolicyName);
    await groupDetailPage.clickSaveGroupBtn();
    await page.screenshot({ path: 'screenshots/cp29pp_group.png' });
    await page.waitForTimeout(2000);

    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({ hardwarePolicyName });
    await page.screenshot({ path: 'screenshots/cp29pp_player1.png' });
    await page.waitForTimeout(1000);

    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player2);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({ hardwarePolicyName });
    await page.screenshot({ path: 'screenshots/cp29pp_player2.png' });
  });
});
