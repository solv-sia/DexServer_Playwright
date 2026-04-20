// Limpiar todos los condicionales de una media utilizada por más de una playlist MADRE
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Limpiar todos los condicionales de una media utilizada por mas de una playlist MADRE', () => {
  test('@CP47PP', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);

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

    await mediaLibraryPage.clearExclusionTags();
    await mediaLibraryPage.clearInclusionTags();
    await mediaLibraryPage.clearProductTags();

    await mediaLibraryPage.typeSizeInput('Ajustar');
    await mediaLibraryPage.typeDurationHourInput('00');
    await mediaLibraryPage.typeDurationMinuteInput('00');
    await mediaLibraryPage.typeDurationSecondInput('00');

    await mediaLibraryPage.clickBtnClearFromDateInput();
    await mediaLibraryPage.clickBtnClearToDateInput();
    await mediaLibraryPage.clearFromHourInput();
    await mediaLibraryPage.clearToHourInput();
    await mediaLibraryPage.clearFromHourRecurenceInput();
    await mediaLibraryPage.clearToHourRecurenceInput();
    await mediaLibraryPage.setEveryDaysCheckboxState(false);
    await mediaLibraryPage.setPOPCheckboxState(false);

    const isEnabled = await mediaLibraryPage.getStatusSaveButton();
    if (isEnabled) {
      await mediaLibraryPage.clickSaveButton();
      await mediaLibraryPage.clickCheckboxSelectAllPlaylist();
      await mediaLibraryPage.clickNextButton();
      await mediaLibraryPage.clickOnAllCheckboxes();
      await mediaLibraryPage.typeReplaceCombo('Reemplazar existentes');
      await mediaLibraryPage.typeNoReplaceCombo('Reemplazar existentes');
      await mediaLibraryPage.typeProductCombo('Reemplazar existentes');
      await page.waitForTimeout(1000);
      await mediaLibraryPage.clickNextButton2();
      await mediaLibraryPage.compareFullMessage(/El componente media de propagacion( madre)? se va a actualizar en 10 playlists:/);
      await mediaLibraryPage.clickConfirmButton();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'screenshots/cp47pp.png' });
  });
});
