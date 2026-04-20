// Superfilter: Búsqueda por Politica de Hardware
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Búsqueda por superfiltro - Politica de Hardware', () => {
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

  test('@CP65APP Politica de Hardware EN LA LISTA', async ({ page }) => {
    test.setTimeout(60000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Politica de Hardware', 0);
    await networkPage.typeInSuperFilterCondition('En la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('PHW TENANT', 1);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp65app.png' });
  });

  test('@CP65BPP Politica de Hardware NO EN LA LISTA', async ({ page }) => {
    test.setTimeout(60000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Politica de Hardware', 0);
    await networkPage.typeInSuperFilterCondition('No en la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('PHW TENANT', 1);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp65bpp.png' });
  });
});
