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

  private async waitForComboReady(combo: ReturnType<typeof this.page.locator>) {
    for (let i = 0; i < 20; i++) {
      const items = await combo.evaluate((el: any) => el.items ? el.items.length : 0).catch(() => 0);
      if (items > 0) return;
      await this.page.waitForTimeout(150);
    }
  }

  private async selectInOpenedCombo(value: string) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const hasMatch = await this.page.evaluate((val) => {
        function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
          const el = root.querySelector(sel);
          if (el) return el;
          for (const e of Array.from(root.querySelectorAll('*'))) {
            const sr = (e as any).shadowRoot;
            if (sr) { const f = findInShadow(sr, sel); if (f) return f; }
          }
          return null;
        }
        const c = findInShadow(document, 'vaadin-combo-box[opened]') as any;
        if (!c) return false;
        return (c.filteredItems || []).some((i: any) => {
          const label = typeof i === 'string' ? i : (i.label || String(i.value ?? ''));
          return label.toLowerCase().includes(val.toLowerCase());
        });
      }, value);
      if (hasMatch) break;
      await this.page.waitForTimeout(150);
    }
    await this.page.evaluate((val) => {
      function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
        const el = root.querySelector(sel);
        if (el) return el;
        for (const e of Array.from(root.querySelectorAll('*'))) {
          const sr = (e as any).shadowRoot;
          if (sr) { const f = findInShadow(sr, sel); if (f) return f; }
        }
        return null;
      }
      const vaadinCombo = findInShadow(document, 'vaadin-combo-box[opened]') as any;
      if (!vaadinCombo) return;
      const filtered: any[] = vaadinCombo.filteredItems || [];
      const match = filtered.find((i: any) => {
        const label = typeof i === 'string' ? i : (i.label || String(i.value ?? ''));
        return label.toLowerCase().includes(val.toLowerCase());
      }) ?? filtered[0] ?? (vaadinCombo.items || [])[0];
      if (!match) return;
      vaadinCombo.selectedItem = match;
      vaadinCombo.opened = false;
    }, value);
  }

  private async fillVaadinCombo(combo: ReturnType<typeof this.page.locator>, value: string) {
    await this.waitForComboReady(combo);
    const openOverlay = this.page.locator('vaadin-combo-box-overlay[opened]');
    await openOverlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    const input = combo.locator('input');
    await input.dispatchEvent('click');
    await input.dispatchEvent('focus');
    await input.fill(value, { force: true });
    await openOverlay.waitFor({ state: 'visible', timeout: 15000 });
    await this.selectInOpenedCombo(value);
    await openOverlay.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  }

  async clickToogleDS()    { await this.elements.toogleDS().click({ force: true }); }
  async clickBottomSave()  { await this.elements.bottomSave().click(); }
  async clickDeviceTab() {
    const tab = this.elements.deviceTab();
    for (let i = 0; i < 60; i++) {
      const box = await tab.boundingBox().catch(() => null);
      if (box && box.width > 0 && box.height > 0) break;
      await this.page.waitForTimeout(500);
    }
    await tab.dispatchEvent('click');
    await this.elements.playlistCombo().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  async completePlaylistSelect(playlistName: string) {
    const clearBtn = this.elements.playlistClearBtn();
    await clearBtn.dispatchEvent('click');
    await this.fillVaadinCombo(this.elements.playlistCombo(), playlistName);
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

  private async fillPlaylistCombo(combo: ReturnType<typeof this.page.locator>, value: string) {
    await this.fillVaadinCombo(combo, value);
  }
}
