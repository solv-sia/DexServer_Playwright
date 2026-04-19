// Crear una PL Multiframe con elementos condicionados de diferentes formas en cada channel
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData, getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { PlaylistPage } from '../pages/PlaylistPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Crear una PL Multiframe con elementos condicionados', () => {
  test('@CP10PP', async ({ page }) => {
    test.setTimeout(60000);
    const fechaFormateada = dateFormatter.datetime();
    const playlistName = 'Playlist creada con Playwright <3 ' + fechaFormateada;

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const playlistPage = new PlaylistPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickPlaylist();

    await playlistPage.clickAddButton();
    await playlistPage.clickTheaterslistButton();

    const layoutName = getSharedData('layoutCP09PP') ?? config.defaultLayout;
    await playlistPage.typeSearchLayoutInput(layoutName);

    await playlistPage.clickResultingLayout();
    await playlistPage.clickConfirmButton();

    await playlistPage.typeNamePlaylistInput(playlistName);

    await page.waitForTimeout(100);
    await playlistPage.buscarRuta(config.ruta);
    await playlistPage.ubicarSubcarpetaFinal(config.ruta);
    await playlistPage.assingMediaTochannels(config);

    await page.waitForTimeout(1500);
    await playlistPage.clickSaveButton();
    await globalPage.readInfoPopup(/Playlist guardada!|Playlist saved!/i);

    setSharedData('PlaylistCP10PP', playlistName);

    await page.screenshot({ path: 'screenshots/cp10pp.png' });
  });
});
