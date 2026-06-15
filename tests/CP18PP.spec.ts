// Buscar y consultar players por nombre, playlist y calendario
import { test } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Search and consult players', () => {
  test('@CP18PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);

    await loginWithSession(page, config.userName2, config.password);

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
