// Actualizar playlist y calendario de un player y verificar cambio
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Update a player by changing its playlist or schedule and check the impact', () => {
  test('@CP19PP', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();

    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    await networkDetailPage.setNewPlaylist(config.playlistDefaultCP19PP, config.playlistDefaultCP19BackUp);
    await networkDetailPage.setNewSchedule(config.scheduleCP19PP, config.scheduleCP19BackUp);

    await networkDetailPage.clickSave();
    await globalPage.readInfoPopup(/Player guardado|Player saved/i);
    await page.screenshot({ path: 'screenshots/cp19pp.png' });
  });
});
