// Reemplazar media en playlist y verificar el resultado
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { PlaylistPage } from '../pages/PlaylistPage';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Replace media', () => {
  test('@CP27PP', async ({ page }) => {
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

    await mediaLibraryPage.typeSearchMediaInput2(config.replaceAndRemoveMediaPath);
    await globalPage.waitSpinner();
    await mediaLibraryPage.findBottomFolder(config.replaceAndRemoveMediaPath);
    await mediaLibraryPage.rightClickOnMedia(config.mediaToReplace);
    await mediaLibraryPage.clickReplaceMedia();

    await mediaLibraryPage.searchMediatoReplace2(config.mediaReplacement);
    await mediaLibraryPage.findFolderForMediaReplace(config.mediafolderName);
    await mediaLibraryPage.findFolderForMediaReplace(config.mediafolder2Name);
    await mediaLibraryPage.clickOnReplacementMedia(config.mediaReplacement);

    await mediaLibraryPage.clickContinueBtn();
    await mediaLibraryPage.clickSelectAllCheckBox();
    await mediaLibraryPage.clickPlaylistCheckbox(config.mediaReplaceAndRemovePlaylist);
    await mediaLibraryPage.clickSecondContinueBtn();
    await mediaLibraryPage.clickConfirmBtn();

    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/cp27pp.png' });

    // Verificar reemplazo en la playlist
    await globalPage.clickOnPlaylistHeader();
    await playlistPage.searchPlaylist(config.mediaReplaceAndRemovePlaylist);
    await playlistPage.clickResultingPlaylist();
    await page.waitForTimeout(2500);
    await playlistPage.clickMediaInchannelInPosition(1, 1);
    await playlistPage.verifyEqualMediaTitle(config.mediaReplacement);
    await page.screenshot({ path: 'screenshots/cp27pp_verify.png' });
  });
});
