// Superfilter: Búsqueda por calendario EN LA LISTA / NO EN LA LISTA
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

const SPstorageState = path.join(__dirname, '../auth/storageState.json');

test.describe('Busqueda de calendario por superfiltro y validación de resultados', () => {
  test('@CP57APP Schedule EN LA LISTA', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Calendario', 0);
    await networkPage.typeInSuperFilterCondition('En la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('Calendario Monoframe Campaña 1', 1);
    await networkPage.clickSuperFilterApplyBtn();

    await expect(page.locator('#dexNetworkList dex-network-group')).toHaveCount(expect.any(Number) as unknown as number);
    const groupCount = await page.locator('#dexNetworkList dex-network-group').count();
    expect(groupCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'screenshots/cp57app.png' });
  });

  test('@CP57BPP Schedule NO EN LA LISTA', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Calendario', 0);
    await networkPage.typeInSuperFilterCondition('No en la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('Calendario Monoframe Campaña 1', 1);
    await networkPage.clickSuperFilterApplyBtn();

    const groupCount = await page.locator('#dexNetworkList dex-network-group').count();
    expect(groupCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'screenshots/cp57bpp.png' });
  });
});
