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
  // Retry up to 3 times on network-level errors (e.g. ERR_EMPTY_RESPONSE).
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(`${config.baseUrl}/DexFrontEnd/#!/login`, { waitUntil: 'domcontentloaded' });
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      await page.waitForTimeout(3000);
    }
  }

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
