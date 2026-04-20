// Definir condicionales de fecha/hora en media propagada a 10 playlists y verificar
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';
import { PlaylistPage } from '../pages/PlaylistPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Configurar media y validar cambios de fecha', () => {
  test('@CP49PP', async ({ page }) => {
    test.setTimeout(180000);

    const today = new Date();
    const currentDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getFullYear()).slice(-2)}`;

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

    // Set every days checkbox
    await mediaLibraryPage.setEveryDaysCheckboxState(true);

    // Set hours from/to
    await mediaLibraryPage.clearFromHourInput();
    await page.locator("paper-input.flex.input").nth(0).locator("input[autocomplete='off']").fill('14:00', { force: true });
    await mediaLibraryPage.clearToHourInput();
    await page.locator("paper-input.flex.input").nth(1).locator("input[autocomplete='off']").fill('18:00', { force: true });

    // Set recurrence hours
    await mediaLibraryPage.clearFromHourRecurenceInput();
    await page.locator("paper-input.flex.input").nth(2).locator("input[autocomplete='off']").fill('15:00', { force: true });
    await mediaLibraryPage.clearToHourRecurenceInput();
    await page.locator("paper-input.flex.input").nth(3).locator("input[autocomplete='off']").fill('16:00', { force: true });

    // Set from/to date to today
    await page.locator("dex-date-picker.input-datepicker").nth(0).locator("paper-input[aria-disabled='false']").click({ force: true });
    await page.locator('.datepicker-content').nth(0).locator('div[today=""]').click();
    await page.locator("dex-date-picker.input-datepicker").nth(1).locator("paper-input[aria-disabled='false']").click({ force: true });
    await page.locator('.datepicker-content').nth(1).locator('div[today=""]').click();

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

    // Verificar en una playlist
    await globalPage.clickPlaylist();
    await playlistPage.searchPlaylist(config.listaPLPropagacion[0]);
    await playlistPage.clickResultingPlaylist();
    await playlistPage.clickMediaInchannelInPosition(1, 1);
    await playlistPage.clickCondicionalTab();
    await page.screenshot({ path: 'screenshots/cp49pp.png' });
  });
});
