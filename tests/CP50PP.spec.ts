// Definir condicionales de tags/productos en media propagada a 10 playlists
import { test } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';
import { PlaylistPage } from '../pages/PlaylistPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Configurar media con tags y validar propagacion', () => {
  test('@CP50PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);
    const playlistPage = new PlaylistPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickOnMediaLibraryHeader();
    await mediaLibraryPage.typeSearchMediaInput2(config.mediaToChangePath);
    await mediaLibraryPage.findBottomFolder(config.mediaToChangePath);
    await mediaLibraryPage.clickOnMedia(config.mediaToChange);
    await page.waitForTimeout(500);

    // Set inclusion tag
    const inclusionInput = page.locator("dex-textarea-tags#inclusionInput vaadin-text-field input");
    await inclusionInput.fill('REPRODUCIR', { force: true });
    await inclusionInput.press('Enter');

    // Set exclusion tag
    const exclusionInput = page.locator("dex-textarea-tags#exclusionInput vaadin-text-field input");
    await exclusionInput.fill('NO REPRODUCIR', { force: true });
    await exclusionInput.press('Enter');

    const isEnabled = await mediaLibraryPage.getStatusSaveButton();
    if (isEnabled) {
      await mediaLibraryPage.clickSaveButton();
      await mediaLibraryPage.clickCheckboxSelectAllPlaylist();
      await page.waitForTimeout(300);
      await mediaLibraryPage.clickNextButton();
      await mediaLibraryPage.clickOnAllCheckboxes();
      await page.waitForTimeout(1000);
      await mediaLibraryPage.clickNextButton2();
      await page.waitForTimeout(500);
      await mediaLibraryPage.compareFullMessage(/El componente media de propagacion( madre)? se va a actualizar en 10 playlists:/);
      await mediaLibraryPage.clickConfirmButton();
    }

    await globalPage.clickPlaylist();
    await playlistPage.searchPlaylist(config.listaPLPropagacion[0]);
    await playlistPage.clickResultingPlaylist();
    await playlistPage.clickMediaInchannelInPosition(1, 1);
    await playlistPage.clickCondicionalTab();
    await page.screenshot({ path: 'screenshots/cp50pp.png' });
  });
});
