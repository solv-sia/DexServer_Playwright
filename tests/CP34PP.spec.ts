// Cambiar PL default a player y verificar progreso de descargas
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Verificar progreso de descargas', () => {
  test('@CP34PP', async ({ page }) => {
    test.setTimeout(300000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.playerCP11PP);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    // Assign new PL default
    await networkDetailPage.setNewPlaylist(config.PL_CP34PP, config.PL_CP34PP);
    await networkDetailPage.decisionToSavePlayer();
    await page.waitForTimeout(2000);

    // Wait for all downloads to complete (up to 60 retries = ~5 min)
    const progressBars = page.locator('.paper-material.display-info-container paper-progress');
    for (let i = 0; i < 60; i++) {
      const allComplete = await progressBars.evaluateAll((bars: Element[]) =>
        bars.every(b => b.getAttribute('value') === '100')
      );
      if (allComplete) break;
      await page.waitForTimeout(5000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await globalPage.waitSpinner();
      await networkPage.clearAndSearch(config.playerCP11PP);
      await page.waitForTimeout(1500);
      await networkPage.clickResultingPlayer();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'screenshots/cp34pp.png' });
  });
});
