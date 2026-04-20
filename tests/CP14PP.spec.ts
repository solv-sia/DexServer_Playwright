// Configurar ajustes a nivel tenant y validar herencia en players
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { GeneralPage } from '../pages/GeneralPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Set up tenant configuration and validate inheritance', () => {
  test('@CP14PP', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const generalPage = new GeneralPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    // Limpiar ajustes del tenant
    await globalPage.clickMenuSetting();
    await globalPage.clickOptionGeneral();
    await generalPage.clickDeviceTab();
    await page.waitForTimeout(2500);
    await generalPage.setValueNone();
    await generalPage.clickBottomSave();
    await page.waitForTimeout(300);
    await globalPage.readInfoPopup(/Datos guardados!|Data saved!/i);
    await page.screenshot({ path: 'screenshots/cp14pp_a.png' });

    // Limpiar player2
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(config.player2);
    await page.waitForTimeout(2500);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.setGroupNone();
    await networkDetailPage.setInheritedPLDefault();
    await networkDetailPage.setInheritedSchedule();
    await networkDetailPage.setInheritedTP();
    await networkDetailPage.setInheritedHP();
    await networkDetailPage.decisionToSavePlayer();
    await page.waitForTimeout(4000);

    // Configurar ajustes tenant
    await globalPage.clickMenuSetting();
    await globalPage.clickOptionGeneral();
    await generalPage.clickDeviceTab();
    await page.waitForTimeout(2500);
    await generalPage.completePlaylistSelect(config.playlistNameToInherit);
    await generalPage.completeScheduleSelect(config.scheduleNameToInherit);
    await generalPage.completeHardwarePolicySelect(config.hardwarePolicyNameToInherit);
    await generalPage.completeTransmissionPolicySelect(config.transmissionPolicyNameToInherit);
    await generalPage.completeTimeZoneSelect(config.timeZoneToInherit);
    await generalPage.clickBottomSave();
    await page.waitForTimeout(300);
    await globalPage.readInfoPopup(/Datos guardados!|Data saved!/i);
    await page.screenshot({ path: 'screenshots/cp14pp_b.png' });

    // Validar herencia en player2
    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(config.player2);
    await page.waitForTimeout(2500);
    await networkPage.clickResultingPlayer();
    await networkDetailPage.validateInheritedValues({
      playlistName: config.playlistNameToInherit,
      hardwarePolicyName: config.hardwarePolicyNameToInherit,
      transmissionPolicyName: config.transmissionPolicyNameToInherit,
      scheduleName: config.scheduleNameToInherit,
      timeZone: config.timeZoneToInherit,
    });
    await page.screenshot({ path: 'screenshots/cp14pp_c.png' });
  });
});
