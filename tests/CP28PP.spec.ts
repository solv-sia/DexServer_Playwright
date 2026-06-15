// Crear playlist con Paisaje HD, quitarla de la playlist via biblioteca, verificar el resultado
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { PlaylistPage } from '../pages/PlaylistPage';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Remove media', () => {
  test('@CP28PP', async ({ page }) => {
    test.setTimeout(300000);

    const playlistName = 'Playlist Remove Test ' + dateFormatter.datetime();
    const mediaName = config.mediaReplacement;  // "Paisaje HD"
    const ruta = `${config.mediafolderName}/${config.mediafolder2Name}`;

    const globalPage = new GlobalPage(page);
    const playlistPage = new PlaylistPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);

    await loginWithSession(page, config.userName2, config.password);

    // Crear playlist con Paisaje HD en canal 1
    await globalPage.clickPlaylist();
    await playlistPage.clickAddButton();
    await playlistPage.clickTheaterslistButton();
    await playlistPage.typeSearchLayoutInput(config.defaultLayout);
    await playlistPage.clickResultingLayout();
    await playlistPage.clickConfirmButton();
    await playlistPage.typeNamePlaylistInput(playlistName);

    // Double navigation ensures clean component state before the first drag
    await playlistPage.buscarRuta(ruta);
    await playlistPage.ubicarSubcarpetaFinal(ruta);
    await playlistPage.buscarRuta(ruta);
    await playlistPage.ubicarSubcarpetaFinal(ruta);
    await playlistPage.moveMediaToChannel(1, mediaName);

    await playlistPage.clickSaveButton();
    await globalPage.readInfoPopup(/Playlist guardada!|Playlist saved!/i);
    await page.screenshot({ path: 'screenshots/cp28pp_created.png' });

    // Quitar Paisaje HD de la playlist via biblioteca de medios
    await globalPage.clickOnMediaLibraryHeader();
    await globalPage.waitSpinner();

    await mediaLibraryPage.typeSearchMediaInput2(ruta);
    await globalPage.waitSpinner();
    await mediaLibraryPage.findBottomFolder(ruta);
    await mediaLibraryPage.rightClickOnMedia(mediaName);
    await mediaLibraryPage.clickRemoveMedia();

    // Deseleccionar todas y seleccionar solo la playlist recién creada
    await mediaLibraryPage.clickSelectAllCheckBox();
    await mediaLibraryPage.clickPlaylistCheckbox(playlistName);
    await mediaLibraryPage.clickSecondContinueBtn();
    await mediaLibraryPage.clickConfirmBtn();

    await globalPage.waitOverlayClosed();
    await page.screenshot({ path: 'screenshots/cp28pp.png' });

    // Verificar que Paisaje HD ya no está en la playlist creada
    await globalPage.clickPlaylist();
    await globalPage.waitSpinner();
    await playlistPage.searchPlaylist(playlistName);
    await playlistPage.clickResultingPlaylist();
    await playlistPage.verifyMediaNotInPlaylist(mediaName);

    await page.screenshot({ path: 'screenshots/cp28pp_verify.png' });
  });
});
