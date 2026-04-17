// Crear cliente y activarlo
// El nombre del cliente es guardado en sharedData para ser consumido por CP04PP y CP05PP
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { CustomerPage } from '../pages/CustomerPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Crear cliente y activarlo', () => {
  test('@CP02PP', async ({ page }) => {
    const fechaFormateada = dateFormatter.datetime();
    const customerName = 'nuevo cliente ' + fechaFormateada;

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const customerPage = new CustomerPage(page);

    await globalPage.waitSpinner();
    await globalPage.clickMenuSetting();
    await globalPage.clickOptionCustomer();

    await customerPage.clickAddButton();
    await customerPage.clickNewCustomerButton();
    await customerPage.typeNameInput(customerName);

    setSharedData('customerCP02PP', customerName);

    await customerPage.typeIntermalId('8293');
    await customerPage.typeOwnerMailInput('testermation@gmail.com');
    await customerPage.clickConfirmButton();

    await customerPage.typeSearchInput(customerName);
    await customerPage.clickToogle();
    await page.waitForTimeout(500);
    await customerPage.checkToogleActived();

    await page.screenshot({ path: 'screenshots/cp02pp.png' });
  });
});
