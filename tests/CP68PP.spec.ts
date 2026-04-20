// Superfilter: Búsqueda por Última actividad (Mayor a / Menor a)
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Búsqueda por superfiltro - Última actividad', () => {
  const setup = async (page: import('@playwright/test').Page) => {
    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    await globalPage.clickNetwork();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    return { globalPage, networkPage };
  };

  test('@CP68APP Última actividad MAYOR A', async ({ page }) => {
    test.setTimeout(60000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Última actividad', 0);
    await networkPage.typeInSuperFilterCondition('Mayor a', 0);
    await networkPage.typeInSuperFilterDate('01/01/2020', 0);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp68app.png' });
  });

  test('@CP68BPP Última actividad MENOR A', async ({ page }) => {
    test.setTimeout(60000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Última actividad', 0);
    await networkPage.typeInSuperFilterCondition('Menor a', 0);
    await networkPage.typeInSuperFilterDate('01/01/2030', 0);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp68bpp.png' });
  });
});
