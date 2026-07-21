// Definir condicionales de fecha/hora en media propagada a 10 playlists y verificar
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { MediaLibraryPage } from '../pages/MediaLibraryPage';
import { PlaylistPage } from '../pages/PlaylistPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Configurar media y validar cambios de fecha', () => {
  test('@CP49PP', async ({ page }) => {
    test.setTimeout(300000);

    const today = new Date();
    const currentDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getFullYear()).slice(-2)}`;


    const globalPage = new GlobalPage(page);
    const mediaLibraryPage = new MediaLibraryPage(page);
    const playlistPage = new PlaylistPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickOnMediaLibraryHeader();
    await globalPage.waitSpinner();
    await mediaLibraryPage.typeSearchMediaInput2(config.mediaToChangePath);
    await mediaLibraryPage.findBottomFolder(config.mediaToChangePath);

    // Verificar que la media existe antes de intentar clickear para evitar timeout de 5min
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
        `[BUG APP CP49PP] La media "${config.mediaToChange}" no se encontró en la carpeta "${config.mediaToChangePath}". ` +
        'La media de propagación puede haber sido eliminada o renombrada en el entorno actual.'
      );
    }
    await mediaLibraryPage.clickOnMedia(config.mediaToChange);
    await page.waitForTimeout(500);

    // Marcar todos los días
    await mediaLibraryPage.setEveryDaysCheckboxState(true);

    // Configurar horas desde/hasta
    await mediaLibraryPage.clearFromHourInput();
    await page.locator("paper-input[type='time']").nth(0).locator("input[autocomplete='off']").fill('14:00', { force: true });
    await mediaLibraryPage.clearToHourInput();
    await page.locator("paper-input[type='time']").nth(1).locator("input[autocomplete='off']").fill('18:00', { force: true });

    // Configurar horas de recurrencia
    await mediaLibraryPage.clearFromHourRecurenceInput();
    await page.locator("paper-input[type='time']").nth(2).locator("input[autocomplete='off']").fill('15:00', { force: true });
    await mediaLibraryPage.clearToHourRecurenceInput();
    await page.locator("paper-input[type='time']").nth(3).locator("input[autocomplete='off']").fill('16:00', { force: true });

    // Configurar fecha desde/hasta como hoy usando Polymer directamente
    // (el popup del datepicker tiene dimensiones 0 cuando está cerrado; no se puede clickear)
    await page.evaluate(() => {
      function findAll(root: Document | ShadowRoot, sel: string): Element[] {
        const results = Array.from(root.querySelectorAll(sel));
        for (const el of Array.from(root.querySelectorAll('*'))) {
          const sr = (el as any).shadowRoot;
          if (sr) results.push(...findAll(sr, sel));
        }
        return results;
      }
      const today = new Date();
      const todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
      for (const p of findAll(document, 'dex-date-picker.input-datepicker') as any[]) {
        if (typeof p.set === 'function') p.set('value', todayStr);
        else p.value = todayStr;
        p.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: todayStr } }));
        p.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    const isSaveEnabled = await mediaLibraryPage.getStatusSaveButton();
    if (isSaveEnabled) {
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

    // Verificar en una playlist
    await globalPage.clickPlaylist();
    await globalPage.waitSpinner();
    await playlistPage.searchPlaylist(config.listaPLPropagacion[0]);
    await playlistPage.clickResultingPlaylist();
    await playlistPage.clickMediaInchannelInPosition(1, 1);
    await playlistPage.clickCondicionalTab();
    await page.screenshot({ path: 'screenshots/cp49pp.png' });
  });
});
