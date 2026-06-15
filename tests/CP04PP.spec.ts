// Crear un Rol dentro del Cliente creado en CP02PP
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData, getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { RolePage } from '../pages/RolePage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Crear un Rol dentro del Cliente creado', () => {
  test('@CP04PP', async ({ page }) => {
    const fechaFormateada = dateFormatter.datetime();
    const roleName = 'nuevo rol ' + fechaFormateada;

    const customerName = getSharedData('customerCP02PP');
    if (!customerName) throw new Error('customerCP02PP not found in shared data. Run CP02PP first.');


    const globalPage = new GlobalPage(page);
    const rolePage = new RolePage(page);

    await loginWithSession(page, config.userName, config.password, customerName);

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
