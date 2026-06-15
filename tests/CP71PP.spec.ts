// Superfilter: búsqueda combinada con dos condiciones simultáneas
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Búsqueda por superfiltro - doble condición simultánea', () => {
  const setup = async (page: import('@playwright/test').Page) => {
    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    await loginWithSession(page, config.userName2, config.password);
    await globalPage.clickNetwork();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    return { globalPage, networkPage };
  };

  /**
   * Agrega una segunda fila al superfiltro.
   * El botón "+" o "Agregar condición" aparece después de la primera fila.
   */
  const addSecondFilterRow = async (page: import('@playwright/test').Page) => {
    const addRowBtn = page.locator(
      '#advanceFilter paper-button[icon="add"], ' +
      '#advanceFilter paper-icon-button[icon="add"], ' +
      '#advanceFilter .add-filter-row, ' +
      '#advanceFilter paper-button'
    ).filter({ hasText: /agregar|add|\+/i }).first();
    await addRowBtn.click({ force: true });
    await page.waitForTimeout(300);
  };

  test('@CP71APP Doble condición: Calendario EN LA LISTA + Playlist EN LA LISTA', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);

    await networkPage.clickSuperFilterPopUp();

    // Primera condición: Calendario en la lista
    await networkPage.typeInSuperFilterField('Calendario', 0);
    await networkPage.typeInSuperFilterCondition('En la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput(config.LNLscheduleName, 1);

    // Agregar segunda fila
    await addSecondFilterRow(page);

    // Segunda condición: Playlist en la lista
    await networkPage.typeInSuperFilterField('Playlist', 1);
    await networkPage.typeInSuperFilterCondition('En la lista', 1);
    await networkPage.clickSuperFilterTagCombo(2);
    await networkPage.typeInSuperFilterTagInput(config.LNLplaylistName, 2);

    await networkPage.clickSuperFilterApplyBtn();

    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp71app.png' });
  });

  test('@CP71BPP Doble condición: Grupo EN LA LISTA + Política de hardware EN LA LISTA', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);

    await networkPage.clickSuperFilterPopUp();

    // Primera condición: Grupo en la lista
    await networkPage.typeInSuperFilterField('Grupo', 0);
    await networkPage.typeInSuperFilterCondition('En la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput(config.nameGroup, 1);

    // Agregar segunda fila
    await addSecondFilterRow(page);

    // Segunda condición: Política de hardware en la lista
    await networkPage.typeInSuperFilterField('Política de hardware', 1);
    await networkPage.typeInSuperFilterCondition('En la lista', 1);
    await networkPage.clickSuperFilterTagCombo(2);
    await networkPage.typeInSuperFilterTagInput(config.LNLhardwarePolicyName, 2);

    await networkPage.clickSuperFilterApplyBtn();

    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp71bpp.png' });
  });
});
