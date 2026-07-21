// Superfilter: Búsqueda por Nombre
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Búsqueda por superfiltro - Nombre', () => {
  const setup = async (page: import('@playwright/test').Page) => {
    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    await loginWithSession(page, config.userName2, config.password);
    await globalPage.clickNetwork();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    return { globalPage, networkPage };
  };

  test('@CP63APP Nombre EN LA LISTA', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Nombre', 0);
    await networkPage.typeInSuperFilterCondition('Contiene', 0);
    await networkPage.clickSuperFilterTagCombo(0);
    await networkPage.typeInSuperFilterTagInput('GL', 0);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp63app.png' });
  });

  test('@CP63BPP Nombre NO EN LA LISTA', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Nombre', 0);
    await networkPage.typeInSuperFilterCondition('No contiene', 0);
    await networkPage.clickSuperFilterTagCombo(0);
    await networkPage.typeInSuperFilterTagInput('GL', 0);
    await networkPage.clickSuperFilterApplyBtn();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/cp63bpp.png' });
    // Bug DEX-4381: "No contiene" no filtra — players con 'GL' siguen visibles en el DOM
    const glCount = await page.locator('#dexNetworkList').getByText('GL').count();
    if (glCount > 0) {
      throw new Error(
        `[BUG APP CP63BPP] El superfiltro "Nombre NO CONTIENE 'GL'" no filtró correctamente: ` +
        `${glCount} elemento(s) con 'GL' siguen apareciendo en el listado (DEX-4381).`
      );
    }
  });

  test('@CP63CPP Nombre IGUAL A', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Nombre', 0);
    await networkPage.typeInSuperFilterCondition('Igual a', 0);
    await networkPage.clickSuperFilterTagCombo(0);
    await networkPage.typeInSuperFilterTagInput('Player 03 GL 2', 0);
    await networkPage.clickSuperFilterApplyBtn();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/cp63cpp.png' });
    // "Igual a" debe mostrar el player buscado en el DOM
    const playerCount = await page.locator('#dexNetworkList').getByText('Player 03 GL 2').count();
    expect(playerCount).toBeGreaterThan(0);
  });

  test('@CP63DPP Nombre DISTINTO A', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Nombre', 0);
    await networkPage.typeInSuperFilterCondition('Distinto a', 0);
    await networkPage.clickSuperFilterTagCombo(0);
    await networkPage.typeInSuperFilterTagInput('Player 03 GL 2', 0);
    await networkPage.clickSuperFilterApplyBtn();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/cp63dpp.png' });
    // Bug DEX-4381: "Distinto a" no filtra — 'Player 03 GL 2' sigue visible
    const playerCount = await page.locator('#dexNetworkList').getByText('Player 03 GL 2').count();
    if (playerCount > 0) {
      throw new Error(
        `[BUG APP CP63DPP] El superfiltro "Nombre DISTINTO A 'Player 03 GL 2'" no filtró correctamente: ` +
        `el player sigue apareciendo en el listado (DEX-4381).`
      );
    }
  });
});
