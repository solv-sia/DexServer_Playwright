// Dar de alta un usuario NO owner y asignarle el nuevo rol
import { test } from '@playwright/test';
import info from '../utils/config';
import { loginWithSession } from '../utils/loginWithSession';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData, getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { UserPage } from '../pages/UserPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Dar de alta un usuario y asignarle el nuevo rol', () => {
  test('@CP06PP', async ({ page }) => {
    const fechaFormateada = dateFormatter.datetime();
    const user = 'nuevo usuario NO owner ' + fechaFormateada;

    const customerName = getSharedData('customerCP02PP');
    if (!customerName) throw new Error('customerCP02PP not found in shared data. Run CP02PP first.');


    const globalPage = new GlobalPage(page);
    const userPage = new UserPage(page);

    await loginWithSession(page, info.userName, info.password, customerName);

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionUsers();

    await userPage.clickAddButton();
    await userPage.typeUser(user);

    setSharedData('userCP06PP', user);

    await userPage.typeName(info.noOwnerUserName);
    await userPage.typeEmailInput(info.noOwnerEmail);
    await userPage.typePassword(info.passwordUserCP05PP);
    await userPage.typeRepeatPassword(info.passwordUserCP05PP);
    await userPage.selectBottomCustomer(info.clientNameCP06PP);
    await userPage.selectRole(info.roleName);
    await userPage.clickConfirmButton();

    await globalPage.readInfoPopup(/Usuario guardado!|User saved!/i);

    await page.screenshot({ path: 'screenshots/cp06pp.png' });
  });
});
