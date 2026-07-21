// Verificar ajustes generales de media propagada (tamaño, duración) en playlists hijas
import { test } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';
import { PlaylistPage } from '../pages/PlaylistPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Configurar ajustes generales de media y validar propagacion', () => {
  test('@CP52PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);
    const playlistPage = new PlaylistPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickOnMediaLibraryHeader();
    await globalPage.waitSpinner();
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
        function deepText(node: Node): string {
          let t = (node as Element).getAttribute?.('title') ?? '';
          const sr = (node as any).shadowRoot as ShadowRoot | null;
          if (sr) t += deepText(sr);
          for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === 3) t += child.textContent ?? '';
            else if (child.nodeType === 1) t += deepText(child);
          }
          return t;
        }
        return findAll(document, 'dex-media-card[slot="card"]').some(c => deepText(c).includes(name));
      },
      config.mediaToChange,
      { timeout: 15000 }
    ).then(() => true).catch(() => false);

    if (!mediaExists) {
      throw new Error(
        `[BUG APP CP52PP] La media "${config.mediaToChange}" no se encontró en la carpeta "${config.mediaToChangePath}". ` +
        'La media de propagación puede haber sido eliminada o renombrada en el entorno actual.'
      );
    }
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
    await globalPage.waitSpinner();
    await playlistPage.searchPlaylist(config.listaPLPropagacion[0]);
    await playlistPage.clickResultingPlaylist();
    await page.screenshot({ path: 'screenshots/cp52pp.png' });
  });
});
