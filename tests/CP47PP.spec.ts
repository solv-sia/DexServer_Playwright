// Limpiar todos los condicionales de una media utilizada por más de una playlist MADRE
import { test } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Limpiar todos los condicionales de una media utilizada por mas de una playlist MADRE', () => {
  test('@CP47PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickOnMediaLibraryHeader();
    await mediaLibraryPage.typeSearchMediaInput2(config.mediaToChangePath);
    await mediaLibraryPage.findBottomFolder(config.mediaToChangePath);

    // Verificar que la media existe antes de clickear para evitar timeout de 5min
    const mediaExists = await page.waitForFunction(
      (name: string) => {
        function findAll(root: Document | ShadowRoot, sel: string): Element[] {
          const results = Array.from(root.querySelectorAll(sel));
          for (const el of Array.from(root.querySelectorAll('*'))) {
            const sr = (el as any).shadowRoot;
            if (sr) results.push(...findAll(sr, sel));
          }
          return results;
        }
        return findAll(document, 'dex-media-card[slot="card"]').some(c => (c.textContent ?? '').includes(name));
      },
      config.mediaToChange,
      { timeout: 15000 }
    ).then(() => true).catch(() => false);

    if (!mediaExists) {
      throw new Error(
        `[BUG APP CP47PP] La media "${config.mediaToChange}" no se encontró en la carpeta "${config.mediaToChangePath}". ` +
        'La media de propagación puede haber sido eliminada o renombrada en el entorno actual.'
      );
    }
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

    // Verificar que los campos de hora existen antes de intentar limpiarlos
    const hourInputCount = await page.locator("paper-input.flex.input").count();
    if (hourInputCount === 0) {
      throw new Error(
        '[BUG APP CP47PP] Los campos de hora de programación (paper-input.flex.input) ' +
        'no existen en el panel de detalle de media. ' +
        'La UI del panel de condicionales de fecha/hora puede haber sido rediseñada en esta versión de la aplicación.'
      );
    }

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
