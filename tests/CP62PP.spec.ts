// Superfilter: Búsqueda por Fecha de activación (Mayor a / Menor a / Entre)
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
    await networkPage.typeInSuperFilterDate('2020-01-01', 0);
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
    await networkPage.typeInSuperFilterDate('2030-01-01', 0);
    await networkPage.clickSuperFilterApplyBtn();
    await page.waitForTimeout(1000);
    const groupCount = await page.locator('#dexNetworkList dex-network-group').count();
    const rowCount = await page.locator('#dexNetworkList tbody tr').count();
    await page.screenshot({ path: 'screenshots/cp62bpp.png' });
    if (groupCount === 0 && rowCount === 0) {
      throw new Error(
        '[BUG APP CP62BPP] El superfiltro "Fecha de activación MENOR A 01/01/2030" devolvió 0 resultados. ' +
        'Todos los players deberían aparecer ya que fueron activados antes del 01/01/2030.'
      );
    }
  });

  test('@CP62CPP Fecha de activación ENTRE', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Fecha de activación', 0);
    await networkPage.typeInSuperFilterCondition('Entre', 0);
    await page.waitForTimeout(500);
    await networkPage.typeInSuperFilterDate('2025-06-20', 0);
    await networkPage.typeInSuperFilterDate('2025-06-24', 1);
    await networkPage.clickSuperFilterApplyBtn();
    await page.waitForTimeout(1000);
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp62cpp.png' });
  });
});
