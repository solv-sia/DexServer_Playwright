// Buscar y consultar players por nombre, playlist y calendario
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Search and consult players', () => {
  test('@CP18PP', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.checkDisplayPropertyValue({ playerName: config.player1 });
    await page.screenshot({ path: 'screenshots/cp18pp_player.png' });

    await networkPage.checkDisplayPropertyValue({ playlistName: config.LNLplaylistName });
    await page.screenshot({ path: 'screenshots/cp18pp_playlist.png' });

    await networkPage.checkDisplayPropertyValue({ scheduleName: config.LNLscheduleName });
    await page.screenshot({ path: 'screenshots/cp18pp_schedule.png' });

    await networkPage.clearSearchField();
    await page.waitForTimeout(500);
  });
});
