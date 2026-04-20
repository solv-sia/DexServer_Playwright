// Crear un TAG y asignarlo al grupo, validar herencia en players
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { TagPage } from '../pages/TagPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

const tagName = 'SERVER TEST ' + dateFormatter.datetime();

test.describe('Create a TAG and assign it to the group', () => {
  test('@CP21PP', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);
    const tagPage = new TagPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickMenuSetting();
    await globalPage.clickOptionTag();

    await tagPage.clickAddBtn();
    await tagPage.typeTagName(tagName);
    await tagPage.clickSaveBtn();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/cp21pp_tag.png' });

    await globalPage.clickNetwork();

    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingGroup();
    await groupDetailPage.completeTagSelect(tagName);
    await groupDetailPage.clickSaveGroupBtn();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/cp21pp_group.png' });

    // Validar tag en player1
    await networkPage.clearAndSearch(config.player1);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateTagValue(tagName);
    await page.screenshot({ path: 'screenshots/cp21pp_player1.png' });

    // Validar tag en player2
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player2);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateTagValue(tagName);
    await page.screenshot({ path: 'screenshots/cp21pp_player2.png' });
  });
});
