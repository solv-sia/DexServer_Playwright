// Crear una PL Multiframe con elementos condicionados de diferentes formas en cada channel
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData, getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { PlaylistPage } from '../pages/PlaylistPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Crear una PL Multiframe con elementos condicionados', () => {
  test('@CP10PP', async ({ page }) => {
    test.setTimeout(300000);
    const fechaFormateada = dateFormatter.datetime();
    const playlistName = 'Playlist creada con Playwright <3 ' + fechaFormateada;


    const globalPage = new GlobalPage(page);
    const playlistPage = new PlaylistPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickPlaylist();

    await playlistPage.clickAddButton();
    await playlistPage.clickTheaterslistButton();

    const layoutName = getSharedData('layoutCP09PP') ?? config.defaultLayout;
    await playlistPage.typeSearchLayoutInput(layoutName);

    await playlistPage.clickResultingLayout();
    await playlistPage.clickConfirmButton();

    await playlistPage.typeNamePlaylistInput(playlistName);

    await playlistPage.buscarRuta(config.ruta);
    await playlistPage.ubicarSubcarpetaFinal(config.ruta);
    await playlistPage.buscarRuta(config.ruta);
    await playlistPage.ubicarSubcarpetaFinal(config.ruta);
    await playlistPage.assingMediaTochannels(config);

    await playlistPage.clickSaveButton();
    await globalPage.readInfoPopup(/Playlist guardada!|Playlist saved!/i);

    setSharedData('PlaylistCP10PP', playlistName);

    await page.screenshot({ path: 'screenshots/cp10pp.png' });
  });
});
