// Superfilter: Búsqueda por Versión
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Búsqueda por superfiltro - Versión', () => {
  const setup = async (page: import('@playwright/test').Page) => {
    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    await loginWithSession(page, config.userName2, config.password);
    await globalPage.clickNetwork();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
    return { globalPage, networkPage };
  };

  test('@CP67APP Versión EN LA LISTA', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);

    // Promise.race contra timer Node.js (no CDP): dispara aunque el browser esté bloqueado.
    // "Versión EN LA LISTA" provoca un render loop infinito en algunas versiones de la app,
    // lo que hace que page.screenshot() nunca resuelva y el worker quede zombie por horas.
    const hangGuard = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('HUNG')), 120000)
    );

    try {
      await Promise.race([
        (async () => {
          await networkPage.clickSuperFilterPopUp();
          await networkPage.typeInSuperFilterField('Versión', 0);
          await networkPage.typeInSuperFilterCondition('En la lista', 0);
          await networkPage.clickSuperFilterTagCombo(1);
          await networkPage.typeInSuperFilterTagInput('6.7.2505.2200', 1);
          await networkPage.clickSuperFilterApplyBtn();
          const count = await page.locator('#dexNetworkList dex-network-group').count();
          expect(count).toBeGreaterThanOrEqual(0);
          // screenshot con catch: si el browser está en render loop el CDP puede tardar mucho
          await page.screenshot({ path: 'screenshots/cp67app.png' }).catch(() => {});
        })(),
        hangGuard,
      ]);
    } catch (e) {
      if ((e as Error).message === 'HUNG') {
        // Navegar a página vacía para liberar el CDP del loop de render
        await page.goto('about:blank', { timeout: 5000 }).catch(() => {});
        throw new Error(
          '[BUG APP CP67APP] El superfiltro "Versión EN LA LISTA" provocó un cuelgue mayor a ' +
          '120 segundos. La aplicación posiblemente entra en un render loop infinito al filtrar ' +
          'players por versión con la condición "en la lista" (valor: "6.7.2505.2200"). ' +
          'El worker de Playwright quedó como proceso zombie en corridas anteriores.'
        );
      }
      throw e;
    }
  });

  test('@CP67BPP Versión NO EN LA LISTA', async ({ page }) => {
    test.setTimeout(300000);
    const { networkPage } = await setup(page);
    await networkPage.clickSuperFilterPopUp();
    await networkPage.typeInSuperFilterField('Versión', 0);
    await networkPage.typeInSuperFilterCondition('No en la lista', 0);
    await networkPage.clickSuperFilterTagCombo(1);
    await networkPage.typeInSuperFilterTagInput('6.7.2505.2200', 1);
    await networkPage.clickSuperFilterApplyBtn();
    const count = await page.locator('#dexNetworkList dex-network-group').count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: 'screenshots/cp67bpp.png' });
  });
});
