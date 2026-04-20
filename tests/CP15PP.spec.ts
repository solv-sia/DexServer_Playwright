// Activar DexStore en el tenant creado en CP02PP
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { GeneralPage } from '../pages/GeneralPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Activar Dex Store', () => {
  test('@CP15PP', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const generalPage = new GeneralPage(page);

    await globalPage.waitSpinner();

    const customerName = getSharedData('customerCP02PP');
    if (!customerName) throw new Error('customerCP02PP not found in shared data');

    await globalPage.switchToNewTenant(customerName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionGeneral();

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/cp15pp_before.png' });
    await page.waitForTimeout(500);

    await generalPage.clickToogleDS();
    await generalPage.clickDeviceTab();
    await generalPage.completeTimeZoneSelect(config.timeZoneToInherit);
    await generalPage.clickBottomSave();

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/cp15pp_after.png' });
  });
});
