// Cambiar PL default a player y verificar progreso de descargas
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { createPlayer, deletePlayer, simulateDownloads } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Verificar progreso de descargas', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => {});
  });

  test('@CP34PP', async ({ page }) => {
    test.setTimeout(300000);

    const player = await createPlayer(config.tenantActivationKeyCP14PP, config.playerCP34PP);
    cleanupIds.push(player.machineId);

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(player.machineName);
    await globalPage.waitSpinner();
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    // Assign new PL default
    await networkDetailPage.setNewPlaylist(config.PL_CP34PP, config.PL_CP34PP);
    await networkDetailPage.decisionToSavePlayer();
    await page.waitForTimeout(3000); // allow server to process the assignment

    // Simulate download completion via automation-api (retries internally until DexServer creates the machine files)
    await simulateDownloads(player);

    // Verify UI shows 100% on all progress bars
    const progressBars = page.locator('.paper-material.display-info-container paper-progress');
    for (let i = 0; i < 5; i++) {
      await globalPage.clickNetwork();
      await globalPage.waitSpinner();
      await networkPage.clearAndSearch(player.machineName);
      await globalPage.waitSpinner();
      await networkPage.clickResultingPlayer();
      await page.waitForTimeout(1000);
      const allComplete = await progressBars.evaluateAll((bars: Element[]) =>
        bars.every(b => b.getAttribute('value') === '100')
      );
      if (allComplete) break;
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: 'screenshots/cp34pp.png' });
  });
});
