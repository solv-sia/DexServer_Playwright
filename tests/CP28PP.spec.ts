// Quitar media de playlist y verificar que fue eliminada
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { PlaylistPage } from '../pages/PlaylistPage';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Remove media', () => {
  test('@CP28PP', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const playlistPage = new PlaylistPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickOnMediaLibraryHeader();
    await page.waitForTimeout(1500);

    await mediaLibraryPage.typeSearchMediaInput2(config.removeMediaPath);
    await page.waitForTimeout(1500);
    await mediaLibraryPage.findBottomFolder(config.removeMediaPath);
    await page.waitForTimeout(1500);
    await mediaLibraryPage.rightClickOnMedia(config.mediaReplacement);
    await mediaLibraryPage.clickRemoveMedia();

    await mediaLibraryPage.clickSelectAllCheckBox();
    await mediaLibraryPage.clickPlaylistCheckbox(config.mediaReplaceAndRemovePlaylist);
    await mediaLibraryPage.clickSecondContinueBtn();
    await mediaLibraryPage.clickConfirmBtn();

    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/cp28pp.png' });

    // Verificar que media fue removida
    await globalPage.clickOnPlaylistHeader();
    await page.waitForTimeout(1500);
    await playlistPage.searchPlaylist(config.mediaReplaceAndRemovePlaylist);
    await page.waitForTimeout(1500);
    await playlistPage.clickResultingPlaylist();
    await page.waitForTimeout(1500);

    // Verificar que el nombre de la media reemplazada NO aparece en la timeline
    const mediaInTimeline = page.locator('.paper-material.timelineElement').filter({ hasText: config.mediaReplacement });
    await expect(mediaInTimeline).toHaveCount(0);

    await page.screenshot({ path: 'screenshots/cp28pp_verify.png' });
  });
});
