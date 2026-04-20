// Verificar ajustes generales de media propagada (tamaño, duración) en playlists hijas
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';
import { PlaylistPage } from '../pages/PlaylistPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Configurar ajustes generales de media y validar propagacion', () => {
  test('@CP52PP', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);
    const playlistPage = new PlaylistPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickOnMediaLibraryHeader();
    await mediaLibraryPage.typeSearchMediaInput2(config.mediaToChangePath);
    await mediaLibraryPage.findBottomFolder(config.mediaToChangePath);
    await mediaLibraryPage.clickOnMedia(config.mediaToChange);
    await page.waitForTimeout(500);

    await mediaLibraryPage.typeSizeInput('Ajustar');
    await mediaLibraryPage.typeDurationHourInput('00');
    await mediaLibraryPage.typeDurationMinuteInput('00');
    await mediaLibraryPage.typeDurationSecondInput('10');

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
    await page.screenshot({ path: 'screenshots/cp52pp.png' });
  });
});
