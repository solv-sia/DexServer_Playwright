// Crear un Layout multiframe
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { DashboardPage } from '../pages/DashboardPage';
import { LayoutPage } from '../pages/LayoutPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Create Layout', () => {
  test('@CP09PP Create Layout', async ({ page }) => {
    const fechaFormateada = dateFormatter.datetime();
    const layoutName = config.frameQty + config.frameOrientation + config.layoutDisposition + ' ' + fechaFormateada;


    const globalPage = new GlobalPage(page);
    const dashboardPage = new DashboardPage(page);
    const layoutPage = new LayoutPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await dashboardPage.clickMenuPlaylist();
    await dashboardPage.clickOptionLayout();

    await globalPage.waitSpinner();
    await page.waitForTimeout(3000);

    await layoutPage.clickAddButton();
    await page.waitForTimeout(200);

    await layoutPage.setNameLayout(layoutName);
    setSharedData('layoutCP09PP', layoutName);

    await layoutPage.createLayout(config);

    await layoutPage.clickOverlapToggle();
    await layoutPage.clickSaveButton();

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/cp09pp.png' });
  });
});
