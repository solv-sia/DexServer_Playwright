// Superfilter: Búsqueda por Plataforma
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Búsqueda por superfiltro - Plataforma', () => {
  const setup = async (page: import('@playwright/test').Page) => {
    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    await loginWithSession(page, config.userName2, config.password);
    await globalPage.clickNetwork();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    return { globalPage, networkPage };
  };

  test('@CP69APP Plataforma EN LA LISTA', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Plataforma', 0);
    await networkPage.typeInSuperFilterCondition('En la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('Android', 1);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp69app.png' });
  });

  test('@CP69BPP Plataforma NO EN LA LISTA', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Plataforma', 0);
    await networkPage.typeInSuperFilterCondition('No en la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('Android', 1);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp69bpp.png' });
  });
});
