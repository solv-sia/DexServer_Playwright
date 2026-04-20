// Verificar que grupos vacíos son visibles cuando se activa el filtro
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Check Empty Group', () => {
  test('@CP17PP', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.clickNetworkOptions();
    await networkPage.verifyEmptyGroupsCheckBox();
    await networkPage.clearAndSearch(config.emptyGroupName);
    await networkPage.clickOnGroup(config.emptyGroupName);
    await networkPage.checkGroupPopUpIsVisible();

    await page.screenshot({ path: 'screenshots/cp17pp.png' });
  });
});
