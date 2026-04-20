// Crear una sucursal (store) en DexStore y asignarla al grupo
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { DexStorePage } from '../pages/DexStorePage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Create a Store and assign it to the group', () => {
  test('@CP38PP', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);
    const dexStorePage = new DexStorePage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionDexStore();

    await dexStorePage.clickStoreTab();
    await dexStorePage.clickAddBtn();
    await dexStorePage.typeStoreCode(config.storeCode);
    await dexStorePage.typeStoreName(config.storeName);
    await dexStorePage.typeStoreCountry(config.storeCountry);
    await dexStorePage.typeStoreProvince(config.storeProvince);
    await dexStorePage.typeStoreLocation(config.storeLocation);
    await dexStorePage.typeStoreStatus(config.storeStatusInput);
    await dexStorePage.clickSaveBtn();
    await page.waitForTimeout(600);
    await dexStorePage.clickConfirmBtn();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/cp38pp_store.png' });

    // Asignar store al grupo
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingGroup();
    await groupDetailPage.completeStoreSelect(config.completeStoreName);
    await groupDetailPage.clickSaveGroupBtn();

    // Verificar en player1
    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingPlayer();
    await page.screenshot({ path: 'screenshots/cp38pp_player1.png' });
    await page.waitForTimeout(1000);

    // Verificar en player2
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player2);
    await networkPage.clickResultingPlayer();
    await page.screenshot({ path: 'screenshots/cp38pp_player2.png' });
    await page.waitForTimeout(1000);
  });
});
