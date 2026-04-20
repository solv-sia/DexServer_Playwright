import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GeneralPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    toogleDS:              () => this.page.locator('.toggle-button').nth(2),
    bottomSave:            () => this.page.locator('#server-settings .saveBtn').filter({ hasText: /Save|Guardar/i }),
    deviceTab:             () => this.page.locator("dex-settings-server#server-settings paper-tab[name='devices']"),
    playlistCombo:         () => this.page.locator('dex-settings-server#server-settings dex-playlist-combo vaadin-combo-box#playlistMenu'),
    playlistClearBtn:      () => this.page.locator('dex-settings-server#server-settings vaadin-combo-box#playlistMenu #clearButton'),
    scheduleCombo:         () => this.page.locator('dex-settings-server#server-settings paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').first(),
    hardwarePolicyCombo:   () => this.page.locator('dex-settings-server#server-settings paper-icon-item:has(iron-icon[icon="settings-remote"]) vaadin-combo-box'),
    transmissionCombo:     () => this.page.locator('dex-settings-server#server-settings paper-icon-item:has(iron-icon[icon="settings-input-antenna"]) vaadin-combo-box'),
    timeZoneCombo:         () => this.page.locator('dex-settings-server#server-settings paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').nth(1),
  };

  private async fillVaadinCombo(combo: ReturnType<typeof this.page.locator>, value: string) {
    const input = combo.locator('input');
    await input.click({ force: true });
    await input.fill(value, { force: true });
    await this.page.locator('vaadin-combo-box-overlay').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async clickToogleDS()    { await this.elements.toogleDS().click({ force: true }); }
  async clickBottomSave()  { await this.elements.bottomSave().click(); }
  async clickDeviceTab()   { await this.elements.deviceTab().click(); }

  async completePlaylistSelect(playlistName: string) {
    const clearBtn = this.elements.playlistClearBtn();
    if (await clearBtn.isVisible()) await clearBtn.click({ force: true });
    const input = this.elements.playlistCombo().locator('input');
    await input.click({ force: true });
    await input.press('Control+a');
    await input.pressSequentially(playlistName, { delay: 50 });
    await this.page.locator('vaadin-combo-box-overlay').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
    await input.press('ArrowDown');
    await this.page.waitForTimeout(100);
    await input.press('Enter');
  }

  async completeScheduleSelect(scheduleName: string) {
    await this.fillVaadinCombo(this.elements.scheduleCombo(), scheduleName);
  }

  async completeHardwarePolicySelect(policyName: string) {
    await this.fillVaadinCombo(this.elements.hardwarePolicyCombo(), policyName);
  }

  async completeTransmissionPolicySelect(policyName: string) {
    await this.fillVaadinCombo(this.elements.transmissionCombo(), policyName);
  }

  async completeTimeZoneSelect(timeZone: string) {
    await this.fillVaadinCombo(this.elements.timeZoneCombo(), timeZone);
  }

  async setValueNone() {
    const clearBtn = this.elements.playlistClearBtn();
    if (await clearBtn.isVisible()) await clearBtn.click({ force: true });
    await this.fillPlaylistCombo(this.elements.playlistCombo(), 'ninguno');
    await this.fillVaadinCombo(this.elements.scheduleCombo(), 'ninguno');
    await this.fillVaadinCombo(this.elements.transmissionCombo(), 'Allow all');
    await this.fillVaadinCombo(this.elements.hardwarePolicyCombo(), 'ninguno');
  }

  private async waitForPlaylistReady(combo: ReturnType<typeof this.page.locator>) {
    for (let i = 0; i < 30; i++) {
      const items = await combo.evaluate((el: any) => el.items ? el.items.length : 0).catch(() => 0);
      if (items > 0) return;
      await this.page.waitForTimeout(300);
    }
  }

  private async fillPlaylistCombo(combo: ReturnType<typeof this.page.locator>, value: string) {
    await this.waitForPlaylistReady(combo);
    const input = combo.locator('input');
    await input.click({ force: true });
    await input.press('Control+a');
    await input.pressSequentially(value, { delay: 50 });
    await this.page.locator('vaadin-combo-box-overlay').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
    await input.press('ArrowDown');
    await this.page.waitForTimeout(100);
    await input.press('Enter');
  }
}
