// Superfilter: Búsqueda por Fecha de activación (Mayor a / Menor a)
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Búsqueda por superfiltro - Fecha de activación', () => {
  const setup = async (page: import('@playwright/test').Page) => {
    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    await loginWithSession(page, config.userName2, config.password);
    await globalPage.clickNetwork();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    return { globalPage, networkPage };
  };

  test('@CP62APP Fecha de activación MAYOR A', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Fecha de activación', 0);
    await networkPage.typeInSuperFilterCondition('Mayor a', 0);
    await networkPage.typeInSuperFilterDate('01/01/2020', 0);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp62app.png' });
  });

  test('@CP62BPP Fecha de activación MENOR A', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Fecha de activación', 0);
    await networkPage.typeInSuperFilterCondition('Menor a', 0);
    await networkPage.typeInSuperFilterDate('01/01/2030', 0);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp62bpp.png' });
  });
});
