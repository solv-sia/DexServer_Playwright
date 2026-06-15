// Crear playlist, reemplazar media en ella y verificar el resultado
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { PlaylistPage } from '../pages/PlaylistPage';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Replace media', () => {
  test('@CP27PP', async ({ page }) => {
    test.setTimeout(300000);

    const playlistName = 'Playlist Replace Test ' + dateFormatter.datetime();
    const mediaToReplace = config.medias[0];  // pandas 1.jpg
    const extraMedia    = config.medias[1];  // pandas 2.jpg
    const replacement   = config.medias[2];  // pandas 3.jpg

    const globalPage = new GlobalPage(page);
    const playlistPage = new PlaylistPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);

    await loginWithSession(page, config.userName2, config.password);

    // Crear playlist con dos elementos de la carpeta de testing
    await globalPage.clickPlaylist();
    await playlistPage.clickAddButton();
    await playlistPage.clickTheaterslistButton();
    await playlistPage.typeSearchLayoutInput(config.defaultLayout);
    await playlistPage.clickResultingLayout();
    await playlistPage.clickConfirmButton();
    await playlistPage.typeNamePlaylistInput(playlistName);

    // Double navigation ensures clean component state before the first drag
    await playlistPage.buscarRuta(config.ruta);
    await playlistPage.ubicarSubcarpetaFinal(config.ruta);
    await playlistPage.buscarRuta(config.ruta);
    await playlistPage.ubicarSubcarpetaFinal(config.ruta);
    await playlistPage.moveMediaToChannel(1, mediaToReplace);

    // After drag the folder cards stay visible — re-navigation would reset the view to search results
    await playlistPage.moveMediaToChannel(2, extraMedia);

    await playlistPage.clickSaveButton();
    await globalPage.readInfoPopup(/Playlist guardada!|Playlist saved!/i);
    await page.screenshot({ path: 'screenshots/cp27pp_created.png' });

    // Reemplazar media en biblioteca
    await globalPage.clickOnMediaLibraryHeader();
    await globalPage.waitSpinner();

    await mediaLibraryPage.typeSearchMediaInput2(config.ruta);
    await globalPage.waitSpinner();
    await mediaLibraryPage.findBottomFolder(config.ruta);
    await mediaLibraryPage.rightClickOnMedia(mediaToReplace);
    await mediaLibraryPage.clickReplaceMedia();

    // Seleccionar el media de reemplazo (está en la misma carpeta)
    await mediaLibraryPage.searchMediatoReplace2(replacement);
    for (const folder of config.ruta.split('/')) {
      await mediaLibraryPage.findFolderForMediaReplace(folder);
    }
    await mediaLibraryPage.clickOnReplacementMedia(replacement);

    await mediaLibraryPage.clickContinueBtn();
    // Deseleccionar todas y seleccionar solo la playlist recién creada
    await mediaLibraryPage.clickSelectAllCheckBox();
    await mediaLibraryPage.clickPlaylistCheckbox(playlistName);
    await mediaLibraryPage.clickSecondContinueBtn();
    await mediaLibraryPage.clickConfirmBtn();

    await globalPage.waitOverlayClosed();
    await page.screenshot({ path: 'screenshots/cp27pp.png' });

    // Verificar reemplazo en la playlist creada
    await globalPage.clickPlaylist();
    await globalPage.waitSpinner();
    await playlistPage.searchPlaylist(playlistName);
    await playlistPage.clickResultingPlaylist();
    await playlistPage.clickMediaInchannelInPosition(1, 1);
    await playlistPage.verifyEqualMediaTitle(replacement);
    await page.screenshot({ path: 'screenshots/cp27pp_verify.png' });
  });
});
