// Loguearse con los dos usuarios creados: owner (CP05PP) y no-owner (CP06PP)
import { test } from '@playwright/test';
import info from '../utils/config';
import { getSharedData } from '../utils/sharedData';
import { LoginPage } from '../pages/LoginPage';
import { GlobalPage } from '../pages/GlobalPage';

// CP07PP manually logs in with specific users — no storageState
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Loguearse en el sistema con el usuario creado (ambos)', () => {
  test('@CP07PP', async ({ page }) => {
    const userOwner = getSharedData('userCP05PP');
    if (!userOwner) throw new Error('userCP05PP not found in shared data. Run CP05PP first.');

    const userNoOwner = getSharedData('userCP06PP');
    if (!userNoOwner) throw new Error('userCP06PP not found in shared data. Run CP06PP first.');

    const loginPage = new LoginPage(page);
    const globalPage = new GlobalPage(page);

    // --- Login as OWNER user ---
    await page.goto(`${info.baseUrl}/DexFrontEnd/#!/login`, { waitUntil: 'domcontentloaded' });
    await loginPage.login(userOwner, info.passwordUserCP05PP);
    await globalPage.waitSpinner();
    await page.screenshot({ path: 'screenshots/cp07pp-owner-login.png' });

    await globalPage.clickAccountMenu();
    await globalPage.clickLogout();

    // --- Login as NO-OWNER user ---
    await loginPage.typeUsername(userNoOwner);
    await loginPage.typePassword(info.passwordUserCP05PP);
    await loginPage.clickLogin();
    await globalPage.waitSpinner();
    await page.screenshot({ path: 'screenshots/cp07pp-noowner-login.png' });
  });
});
