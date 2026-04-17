// Dar de alta un usuario owner en el cliente creado en CP02PP
import { test } from '@playwright/test';
import * as path from 'path';
import info from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData, getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { UserPage } from '../pages/UserPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Dar de alta un usuario owner', () => {
  test('@CP05PP', async ({ page }) => {
    const fechaFormateada = dateFormatter.datetime();
    const user = 'nuevo usuario owner ' + fechaFormateada;

    const customerName = getSharedData('customerCP02PP');
    if (!customerName) throw new Error('customerCP02PP not found in shared data. Run CP02PP first.');

    await page.goto(`${info.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const userPage = new UserPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(customerName);
    await globalPage.loginDecision(info.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionUsers();

    await userPage.clickAddButton();
    await userPage.typeUser(user);
    await userPage.typeName(info.ownerUserName);
    await userPage.typeEmailInput(info.ownerEmail);
    await userPage.typePassword(info.passwordUserCP05PP);
    await userPage.typeRepeatPassword(info.passwordUserCP05PP);
    await userPage.selectBottomCustomer(info.clientNameCP05PP);
    await userPage.selectRole(info.ownerRoleName);
    await userPage.clickConfirmButton();

    await globalPage.readInfoPopup(/Usuario guardado!|User saved!/i);

    await page.screenshot({ path: 'screenshots/cp05pp.png' });

    setSharedData('userCP05PP', user);
  });
});
