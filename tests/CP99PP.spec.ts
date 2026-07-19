// Limpieza general: eliminar todos los elementos creados durante la suite
import { test } from '@playwright/test';
import config from '../utils/config';
import { getSharedData } from '../utils/sharedData';
import { deletePlayer } from '../utils/automationApi';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { HardwarePolicyPage } from '../pages/HardwarePolicyPage';
import { TransmissionPolicyPage } from '../pages/TransmissionPolicyPage';
import { SchedulePage } from '../pages/SchedulePage';
import { PlaylistPage } from '../pages/PlaylistPage';
import { LayoutPage } from '../pages/LayoutPage';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';
import { UserPage } from '../pages/UserPage';
import { RolePage } from '../pages/RolePage';
import { CustomerPage } from '../pages/CustomerPage';
import { DashboardPage } from '../pages/DashboardPage';

test.use({ storageState: { cookies: [], origins: [] } });

async function loginSetup(page: import('@playwright/test').Page) {
  const globalPage = new GlobalPage(page);
  await loginWithSession(page, config.userName2, config.password);
  return globalPage;
}

test.describe('Limpieza suite: eliminar elementos creados', () => {

  test('@CP99APP Eliminar medias de la biblioteca', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const mediaLibraryPage = new MediaLibraryPage(page);

    await globalPage.clickOnMediaLibraryHeader();
    // La carpeta se creó con timestamp (ej: "CARPETA AUTOMATION 17-07-2026 14.30.25"),
    // por eso usamos ^= (starts-with) en lugar de igualdad exacta
    try {
      await mediaLibraryPage.typeSearchMediaInput2(config.fileUploadPath);
      await mediaLibraryPage.findBottomFolder(config.fileUploadPath);
      await page.locator(`div[title^='${config.uploadFolderName}']`).first().click({ timeout: 8000 });
      await page.waitForTimeout(500);
      for (const file of [config.fileToDelete1, config.fileToDelete2, config.fileToDelete3, config.fileToDelete4]) {
        try {
          await mediaLibraryPage.deleteMediaFromLibrary(file);
        } catch {
          // el archivo puede no existir
        }
      }
    } catch {
      // La carpeta no existe — CP08PP no creó archivos en esta corrida o ya fueron eliminados
    }

    await page.screenshot({ path: 'screenshots/cp99app.png' });
  });

  test('@CP99BPP Eliminar grupos de red (sincronizado y solitario)', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const networkPage = new NetworkPage(page);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    const syncGroup = getSharedData('groupCP20PP');
    if (syncGroup) {
      try { await networkPage.deleteGroup(syncGroup); } catch { /* el grupo puede no existir */ }
    }

    await page.waitForTimeout(1000);

    const lonelyGroup = getSharedData('groupCP16PP');
    if (lonelyGroup) {
      try { await networkPage.deleteGroup(lonelyGroup); } catch { /* el grupo puede no existir */ }
    }

    // Eliminar el player de CP11PP (no se limpia en afterAll porque CP40PP lo necesita durante la suite)
    const machineIdCP11PP = getSharedData('machineIdCP11PP');
    if (machineIdCP11PP) await deletePlayer(Number(machineIdCP11PP)).catch(() => {});

    await page.screenshot({ path: 'screenshots/cp99bpp.png' });
  });

  test('@CP99CPP Eliminar política de hardware', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const hwPolicyPage = new HardwarePolicyPage(page);

    await globalPage.clickOnNetworkHeader();
    await globalPage.waitSpinner();
    await globalPage.clickOnHardwarePolicyHeader();

    const hwPolicy = getSharedData('policyCP29PP');
    if (hwPolicy) {
      try { await hwPolicyPage.deletePolicy(hwPolicy); } catch { /* puede no existir */ }
    }

    await page.screenshot({ path: 'screenshots/cp99cpp.png' });
  });

  test('@CP99DPP Eliminar política de transmisión', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const trPolicyPage = new TransmissionPolicyPage(page);

    await globalPage.clickOnNetworkHeader();
    await globalPage.waitSpinner();
    await globalPage.clickOnTransmissionPolicyHeader();

    const trPolicy = getSharedData('policyCP30PP');
    if (trPolicy) {
      try { await trPolicyPage.deletePolicy(trPolicy); } catch { /* puede no existir */ }
    }

    await page.screenshot({ path: 'screenshots/cp99dpp.png' });
  });

  test('@CP99EPP Eliminar calendario', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const schedulePage = new SchedulePage(page);

    await globalPage.clickSchedule();
    await globalPage.waitSpinner();

    const schedule = getSharedData('ScheudleCP13PP');
    if (schedule) {
      try { await schedulePage.deleteSchedule(schedule); } catch { /* puede no existir */ }
    }

    await page.screenshot({ path: 'screenshots/cp99epp.png' });
  });

  test('@CP99FPP Eliminar playlists', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const playlistPage = new PlaylistPage(page);

    await globalPage.clickPlaylist();
    await globalPage.waitSpinner();

    const playlist = getSharedData('PlaylistCP10PP');
    if (playlist) {
      try { await playlistPage.deletePlaylist(playlist); } catch { /* puede no existir */ }
    }

    for (const plName of [config.calendarPL, config.PL_CP34PP]) {
      try { await playlistPage.deletePlaylist(plName); } catch { /* puede no existir */ }
    }

    await page.screenshot({ path: 'screenshots/cp99fpp.png' });
  });

  test('@CP99GPP Eliminar layout', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const dashboardPage = new DashboardPage(page);
    const layoutPage = new LayoutPage(page);

    await dashboardPage.clickMenuPlaylist();
    await dashboardPage.clickOptionLayout();
    await globalPage.waitSpinner();

    const layout = getSharedData('layoutCP09PP');
    if (layout) {
      try { await layoutPage.deleteLayout(layout); } catch { /* puede no existir */ }
    }

    await page.screenshot({ path: 'screenshots/cp99gpp.png' });
  });

  test('@CP99HPP Eliminar usuarios', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const userPage = new UserPage(page);

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionUsers();
    await globalPage.waitSpinner();

    for (const key of ['userCP05PP', 'userCP06PP']) {
      const username = getSharedData(key);
      if (username) {
        try { await userPage.deleteUser(username); } catch { /* puede no existir */ }
      }
    }

    await page.screenshot({ path: 'screenshots/cp99hpp.png' });
  });

  test('@CP99IPP Eliminar rol', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const rolePage = new RolePage(page);

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionRole();
    await globalPage.waitSpinner();

    const role = getSharedData('roleCP04PP');
    if (role) {
      try { await rolePage.deleteRole(role); } catch { /* puede no existir */ }
    }

    await page.screenshot({ path: 'screenshots/cp99ipp.png' });
  });

  test('@CP99JPP Eliminar cliente', async ({ page }) => {
    test.setTimeout(300000);
    const globalPage = await loginSetup(page);
    const customerPage = new CustomerPage(page);

    await globalPage.clickMenuSetting();
    // Verificar que la opción Clientes existe antes de hacer click
    const customerLinkExists = await page.locator('[href=\'#!/settings/customer\']')
      .waitFor({ state: 'attached', timeout: 8000 }).then(() => true).catch(() => false);
    if (!customerLinkExists) {
      throw new Error(
        '[BUG APP CP99JPP] La opción "Clientes" no aparece en el menú de Configuración para el usuario testermation2. ' +
        'No se puede eliminar el cliente creado en CP02PP. ' +
        'El usuario no tiene acceso a la sección de gestión de clientes en la versión actual de la aplicación.'
      );
    }
    await globalPage.clickOptionCustomer();
    await globalPage.waitSpinner();

    const customer = getSharedData('customerCP02PP');
    if (customer) {
      try { await customerPage.deleteCustomer(customer); } catch { /* puede no existir */ }
    }

    await page.screenshot({ path: 'screenshots/cp99jpp.png' });
  });
});
