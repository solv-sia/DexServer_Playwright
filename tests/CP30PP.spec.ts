// Crear política de transmisión y asignarla al grupo validando herencia
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { TransmissionPolicyPage } from '../pages/TransmissionPolicyPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

const transmissionPolicyName = 'TR Policy ' + dateFormatter.datetime();

test.describe('Create Transmission Policy', () => {
  test('@CP30PP', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);
    const trPolicyPage = new TransmissionPolicyPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickOnNetworkHeader();
    await globalPage.waitSpinner();
    await globalPage.clickOnTransmissionPolicyHeader();

    await trPolicyPage.clickOnCreateTRPolicyBtn();
    await trPolicyPage.nameTransmissionPolicy(transmissionPolicyName);
    await trPolicyPage.setBlockTime(config.blockTime);
    await trPolicyPage.setAllowTime(config.allowTime);
    await trPolicyPage.clickOnSavePolicyBtn();

    setSharedData('policyCP30PP', transmissionPolicyName);

    await globalPage.readInfoPopup(/Política guardada!|Policy saved/i);
    await page.screenshot({ path: 'screenshots/cp30pp_policy.png' });
    await page.waitForTimeout(1000);

    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingGroup();
    await groupDetailPage.completeTransmissionPolicySelect(transmissionPolicyName);
    await groupDetailPage.clickSaveGroupBtn();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/cp30pp_group.png' });

    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({ transmissionPolicyName });
    await page.screenshot({ path: 'screenshots/cp30pp_player1.png' });
    await page.waitForTimeout(1000);

    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player2);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({ transmissionPolicyName });
    await page.screenshot({ path: 'screenshots/cp30pp_player2.png' });
    await page.waitForTimeout(1000);
  });
});
