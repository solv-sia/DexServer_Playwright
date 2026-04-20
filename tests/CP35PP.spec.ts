// Acceder al Playlist Analyzer desde grupo, player y calendario
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { PlaylistAnalyzerPage } from '../pages/PlaylistAnalyzerPage';
import { SchedulePage } from '../pages/SchedulePage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Access to the Playlist Analizer (group, player and schedule)', () => {
  test('@CP35PP', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const playlistAnalyzerPage = new PlaylistAnalyzerPage(page);
    const schedulePage = new SchedulePage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(config.player1);
    await page.waitForTimeout(2000);

    await networkPage.clickGroupPlaylistAnalyzerBtn();
    await playlistAnalyzerPage.checkGroupViewPAIsOpened();
    await playlistAnalyzerPage.checkPlaylistAnalyzerTitle(config.syncPlaylistName);
    await page.screenshot({ path: 'screenshots/cp35pp_group.png' });
    await page.waitForTimeout(500);

    await playlistAnalyzerPage.clickPlaylistAnalyzerCloseBtn();
    await networkPage.clearAndSearch(config.player1);
    await page.waitForTimeout(2000);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.clickPlaylistAnalyzerBtn();
    await playlistAnalyzerPage.checkPlayerViewPLAnalyzerIsOpened();
    await playlistAnalyzerPage.checkPlaylistAnalyzerTitle(config.syncPlaylistName);
    await page.screenshot({ path: 'screenshots/cp35pp_player.png' });
    await page.waitForTimeout(500);

    await globalPage.clickSchedule();
    await schedulePage.searchSchedule(config.syncScheduleName);
    await schedulePage.clickResultingSchedule();
    await schedulePage.clickPlaylistAnalyzerBtn();
    await playlistAnalyzerPage.checkScheduleViewPLAnalyzerIsOpened();
    await playlistAnalyzerPage.checkPlaylistAnalyzerTitle(config.mediaReplaceAndRemovePlaylist);
    await page.screenshot({ path: 'screenshots/cp35pp_schedule.png' });
    await page.waitForTimeout(500);
  });
});
