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
        `[BUG APP CP50PP] La media "${config.mediaToChange}" no se encontró en la carpeta "${config.mediaToChangePath}". ` +
        'La media de propagación puede haber sido eliminada o renombrada en el entorno actual.'
      );
    }
    await mediaLibraryPage.clickOnMedia(config.mediaToChange);
    await page.waitForTimeout(500);

    // Configurar etiqueta de inclusión
    const inclusionInput = page.locator("dex-textarea-tags#inclusionInput vaadin-text-field input");
    await inclusionInput.fill('REPRODUCIR', { force: true });
    await inclusionInput.press('Enter');

    // Configurar etiqueta de exclusión
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
