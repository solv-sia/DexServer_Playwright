import type { Page } from '@playwright/test';
import config from './config';
import { LoginPage } from '../pages/LoginPage';
import { GlobalPage } from '../pages/GlobalPage';

export async function loginWithSession(
  page: Page,
  userName: string,
  password: string,
  clientName?: string,
) {
  await page.goto(`${config.baseUrl}/DexFrontEnd/#!/login`, { waitUntil: 'domcontentloaded' });

  const loginPage = new LoginPage(page);
  const globalPage = new GlobalPage(page);

  await loginPage.login(userName, password);
  await globalPage.waitSpinner();

  if (clientName) {
    await globalPage.switchToNewTenant(clientName);
    await globalPage.loginDecision(password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();
  }
}
