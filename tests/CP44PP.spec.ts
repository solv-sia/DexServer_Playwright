// Crear SuperTenant, activarlo e ingresar configurando zona horaria
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { CustomerPage } from '../pages/CustomerPage';
import { GeneralPage } from '../pages/GeneralPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Crear SuperTenant y activarlo', () => {
  test('@CP44PP', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const customerPage = new CustomerPage(page);
    const generalPage = new GeneralPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    const superCustomerName = 'nuevo SuperTenant ' + dateFormatter.datetime();

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionCustomer();

    await customerPage.clickAddButton();
    await customerPage.clickNewSuperCustomerButton();
    await customerPage.typeNameSuperInput(superCustomerName);
    await customerPage.typeCustomer(config.clientName);
    await customerPage.clickConfirmButton();

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
