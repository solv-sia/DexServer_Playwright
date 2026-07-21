// Crear SuperTenant, activarlo e ingresar configurando zona horaria
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { CustomerPage } from '../pages/CustomerPage';
import { GeneralPage } from '../pages/GeneralPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Crear SuperTenant y activarlo', () => {
  test('@CP44PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const customerPage = new CustomerPage(page);
    const generalPage = new GeneralPage(page);

    // El parámetro clientName fuerza el contexto a QA Automation tras el login.
    // Sin esto, el servidor puede restaurar el último tenant activo del usuario
    // (p.ej. SUPER TENANT si CP40PP corrió antes), impidiendo crear SuperTenants.
    await loginWithSession(page, config.userName, config.password, config.clientName);

    const superCustomerName = 'nuevo SuperTenant ' + dateFormatter.datetime();

    await globalPage.clickMenuSetting();
    // Verificar que la opción Clientes existe en el menú antes de hacer click
    const customerLinkExists = await page.locator('[href=\'#!/settings/customer\']')
      .waitFor({ state: 'attached', timeout: 8000 }).then(() => true).catch(() => false);
    if (!customerLinkExists) {
      throw new Error(
        '[BUG APP CP44PP] La opción "Clientes" no aparece en el menú de Configuración para el usuario testermation. ' +
        'El usuario no tiene acceso a la sección de gestión de clientes, o la funcionalidad de creación de SuperTenant ' +
        'está deshabilitada en la versión actual de la aplicación.'
      );
    }
    await globalPage.clickOptionCustomer();

    await customerPage.clickAddButton();
    await customerPage.clickNewSuperCustomerButton();
    await customerPage.typeNameSuperInput(superCustomerName);
    await customerPage.typeCustomer(config.clientNameForSuperTenant);
    await customerPage.clickConfirmButton();
    await globalPage.waitSpinner();

    await customerPage.typeSearchInput(superCustomerName);
    await customerPage.clickToogle();
    await page.waitForTimeout(500);
    await customerPage.checkToogleActived();
    await page.screenshot({ path: 'screenshots/cp44pp_super.png' });

    await globalPage.switchToNewTenant('* ' + superCustomerName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionGeneral();
    await page.waitForTimeout(2000);
    await generalPage.clickDeviceTab();
    await generalPage.completeTimeZoneSelect(config.timezone);
    await page.waitForTimeout(500);
    await generalPage.clickBottomSave();

    await globalPage.readInfoPopup(/Datos guardados!|Data saved!/i);
    await page.screenshot({ path: 'screenshots/cp44pp_general.png' });
  });
});
