import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';
import config from '../utils/config';

const AUTH_FILE = path.join(__dirname, '../auth/storageState.json');

setup('authenticate', async ({ page }) => {
  await page.goto(`${config.baseUrl}/DexFrontEnd/#!/login`, { waitUntil: 'domcontentloaded' });

  const loginPage = new LoginPage(page);
  await loginPage.login(config.userName, config.password);

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
