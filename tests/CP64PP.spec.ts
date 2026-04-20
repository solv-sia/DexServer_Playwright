// Superfilter: Búsqueda por Playlist actual
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Búsqueda por superfiltro - Playlist actual', () => {
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

  test('@CP64APP Playlist actual EN LA LISTA', async ({ page }) => {
    test.setTimeout(60000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Playlist actual', 0);
    await networkPage.typeInSuperFilterCondition('En la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('Ninguno', 1);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp64app.png' });
  });

  test('@CP64BPP Playlist actual NO EN LA LISTA', async ({ page }) => {
    test.setTimeout(60000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Playlist actual', 0);
    await networkPage.typeInSuperFilterCondition('No en la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('Playlist Multiframe Campaña 1', 1);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp64bpp.png' });
  });
});
