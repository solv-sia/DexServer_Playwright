// Crear un Layout multiframe
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LayoutPage } from '../pages/LayoutPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Create Layout', () => {
  test('@CP09PP Create Layout', async ({ page }) => {
    const fechaFormateada = dateFormatter.datetime();
    const layoutName = config.frameQty + config.frameOrientation + config.layoutDisposition + ' ' + fechaFormateada;

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const dashboardPage = new DashboardPage(page);
    const layoutPage = new LayoutPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

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
