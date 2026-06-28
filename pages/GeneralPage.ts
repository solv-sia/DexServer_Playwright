import { Page, expect } from '@playwright/test';
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

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async selectInOpenedCombo(value: string) {
    const escaped = this.escapeRegex(value);

    // Primary: click via ARIA role — getByRole pierces shadow DOM, works for vaadin-combo-box-item
    const option = this.page.locator('vaadin-combo-box-overlay[opened]')
      .getByRole('option')
      .filter({ hasText: new RegExp(escaped, 'i') })
      .first();
    const clicked = await option.waitFor({ state: 'visible', timeout: 8000 })
      .then(() => option.click().then(() => true))
      .catch(() => false);
    if (clicked) return;

    // Fallback: JS property assignment via filteredItems (server-side combos or when overlay click fails).
    // Crucially, require a real match — never silently fall back to the first item, which would
    // assign the wrong playlist/policy and only surface much later as an inheritance mismatch.
    let hasMatch = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      hasMatch = await this.page.evaluate((val) => {
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

    if (!hasMatch) {
      throw new Error(`vaadin-combo: item matching "${value}" not found via role=option or filteredItems after 8s`);
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
      });
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
    const combo = this.elements.playlistCombo();
    const input = combo.locator('input');
    // The playlist combo is the only one with a clear (X) button. Clear any prior
    // selection first so the new value filters a clean list — but only if the button
    // is actually present, and wait for the field to empty before refilling so we
    // don't type into a value that's mid-clear.
    const clearBtn = this.elements.playlistClearBtn();
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click({ force: true });
      await expect(input).toHaveValue('', { timeout: 5000 }).catch(() => {});
    }
    await this.fillVaadinCombo(combo, playlistName);
    // Guard against a silent wrong pick: the input must end up reflecting the requested
    // playlist. If it doesn't, fail here instead of much later at the inheritance check.
    await expect(input).toHaveValue(new RegExp(this.escapeRegex(playlistName), 'i'), { timeout: 8000 });
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
