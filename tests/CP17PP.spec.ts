// Verificar que grupos vacíos son visibles cuando se activa el filtro
import { test } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Check Empty Group', () => {
  test('@CP17PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await loginWithSession(page, config.userName2, config.password);

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
