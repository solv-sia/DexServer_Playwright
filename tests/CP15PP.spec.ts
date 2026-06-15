// Activar DexStore en el tenant creado en CP02PP
import { test } from '@playwright/test';
import config from '../utils/config';
import { getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { GeneralPage } from '../pages/GeneralPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Activar Dex Store', () => {
  test('@CP15PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const generalPage = new GeneralPage(page);

    const customerName = getSharedData('customerCP02PP');
    if (!customerName) throw new Error('customerCP02PP not found in shared data');

    await loginWithSession(page, config.userName2, config.password);

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
