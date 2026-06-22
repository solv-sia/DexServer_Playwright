// Acceder al Playlist Analyzer desde grupo, player y calendario
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { PlaylistAnalyzerPage } from '../pages/PlaylistAnalyzerPage';
import { SchedulePage } from '../pages/SchedulePage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Access to the Playlist Analizer (group, player and schedule)', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP35PP', async ({ page }) => {
    test.setTimeout(300000);

    const syncGroupName = 'Grupo Sincronizado Automation ' + dateFormatter.datetime();

    const [player1, player2] = await Promise.all([
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP35PP1),
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP35PP2),
    ]);
    cleanupIds.push(player1.machineId, player2.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);
    const playlistAnalyzerPage = new PlaylistAnalyzerPage(page);
    const schedulePage = new SchedulePage(page);

    await loginWithSession(page, config.userName2, config.password);

    // Crear sync group con syncPlaylistName y los players creados
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clickMoreBtn();
    await networkPage.clickSyncGroupBtn();
    await groupDetailPage.completeGroupNameInput(syncGroupName);
    await groupDetailPage.completePlaylistSelect(config.syncPlaylistName);
    await groupDetailPage.completeScheduleSelect(config.syncScheduleName);
    await groupDetailPage.completeTransmissionPolicySelect(config.syncTransmissionPolicyName);
    await groupDetailPage.completeHardwarePolicySelect(config.syncHardwarePolicyName);
    await groupDetailPage.completeIpMulticastInput1(config.ipMulticast1);
    await groupDetailPage.completeIpMulticastInput2(config.ipMulticast2);
    await groupDetailPage.completeIpMulticastInput3(config.ipMulticast3);
    await groupDetailPage.completeSynchronizationSelect(config.synchronizationTime);
    await groupDetailPage.completeChannelOneSelect(player1.machineName);
    await groupDetailPage.decisionConfirmPlayer();
    await groupDetailPage.completeChannelTwoSelect(player2.machineName);
    await groupDetailPage.decisionConfirmPlayer();
    await groupDetailPage.clickSaveGroupBtn();

    // Playlist Analyzer desde grupo
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player1.machineName);
    await page.waitForTimeout(2000);
    await networkPage.clickGroupPlaylistAnalyzerBtn();
    await playlistAnalyzerPage.checkGroupViewPAIsOpened();
    await playlistAnalyzerPage.checkPlaylistAnalyzerTitle(config.syncPlaylistName);
    await page.screenshot({ path: 'screenshots/cp35pp_group.png' });
    await playlistAnalyzerPage.clickPlaylistAnalyzerCloseBtn();

    // Playlist Analyzer desde player
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player1.machineName);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.clickPlaylistAnalyzerBtn();
    await playlistAnalyzerPage.checkPlayerViewPLAnalyzerIsOpened();
    await playlistAnalyzerPage.checkPlaylistAnalyzerTitle(config.syncPlaylistName);
    await page.screenshot({ path: 'screenshots/cp35pp_player.png' });
    await playlistAnalyzerPage.clickPlaylistAnalyzerCloseBtn();
    await page.locator('iron-overlay-backdrop[opened]').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Playlist Analyzer desde calendario
    await globalPage.clickSchedule();
    await globalPage.waitSpinner();
    await schedulePage.searchSchedule(config.syncScheduleName);
    await globalPage.waitSpinner();
    await schedulePage.clickResultingSchedule();
    await globalPage.waitSpinner();
    await schedulePage.clickPlaylistAnalyzerBtn();
    await playlistAnalyzerPage.checkScheduleViewPLAnalyzerIsOpened();
    await playlistAnalyzerPage.checkPlaylistAnalyzerTitle(config.mediaReplaceAndRemovePlaylist);
    await page.screenshot({ path: 'screenshots/cp35pp_schedule.png' });
    await page.waitForTimeout(500);
  });
});
