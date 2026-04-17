// Login, logout y recupero de contraseña
import { test } from '@playwright/test';
import config from '../utils/config';
import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { GlobalPage } from '../pages/GlobalPage';

// CP01PP starts from a clean (unauthenticated) state — no storageState
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login, logout y recupero de contraseña', () => {
  test('@CP01PP', async ({ page }) => {
    await page.goto(`${config.baseUrl}/DexFrontEnd/#!/login`, { waitUntil: 'domcontentloaded' });

    const loginPage = new LoginPage(page);
    const globalPage = new GlobalPage(page);
    const forgotPasswordPage = new ForgotPasswordPage(page);

    await loginPage.login(config.userName, config.password);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'screenshots/cp01pp-dashboard.png' });

    await globalPage.clickAccountMenu();
    await globalPage.clickLogout();

    await loginPage.clickForgotBtn();
    await forgotPasswordPage.forgotTestermation(config.userName);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/cp01pp-forgot.png' });
  });
});
