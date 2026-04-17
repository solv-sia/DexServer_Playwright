// Crear un Rol dentro del Cliente creado en CP02PP
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData, getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { RolePage } from '../pages/RolePage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Crear un Rol dentro del Cliente creado', () => {
  test('@CP04PP', async ({ page }) => {
    const fechaFormateada = dateFormatter.datetime();
    const roleName = 'nuevo rol ' + fechaFormateada;

    const customerName = getSharedData('customerCP02PP');
    if (!customerName) throw new Error('customerCP02PP not found in shared data. Run CP02PP first.');

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const rolePage = new RolePage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(customerName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionRole();

    await rolePage.clickAddButton();
    await rolePage.typeRoleNameInput(roleName);
    await rolePage.checkPermission();
    await rolePage.clickSaveButton();

    await rolePage.typeSearchInput(roleName);
    await rolePage.checkResultRole();

    await page.screenshot({ path: 'screenshots/cp04pp.png' });

    setSharedData('roleCP04PP', roleName);
  });
});
