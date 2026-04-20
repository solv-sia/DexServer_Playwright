import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NetworkDetailPage extends BasePage {
  plApplied = '';
  shApplied = '';

  constructor(page: Page) {
    super(page);
  }

  private elements = {
    plDefaultInput:    () => this.page.locator('dex-network-display-detail#dexNetworkDetail dex-playlist-combo #playlistMenu input'),
    groupInput:        () => this.page.locator('dex-network-display-detail#dexNetworkDetail dex-group-combo #groupMenu input'),
    groupClearBtn:     () => this.page.locator('dex-network-display-detail#dexNetworkDetail #groupMenu #clearButton'),
    groupCombo:        () => this.page.locator('dex-network-display-detail#dexNetworkDetail dex-group-combo vaadin-combo-box'),
    scheduleCombo:     () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').first(),
    scheduleInput:     () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').first().locator('input'),
    tpCombo:           () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="settings-input-antenna"]) vaadin-combo-box'),
    hpCombo:           () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="settings-remote"]) vaadin-combo-box'),
    timeZoneCombo:     () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').nth(1),
    tagCombo:          () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="label"]) vaadin-combo-box'),
    versionInput:      () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="image:filter-2"])').nth(1).locator('vaadin-combo-box input'),
    versionLabel:      () => this.page.locator('paper-icon-item').filter({ hasText: /Versión actual|Current version/i }).locator('div.device-img + span'),
    saveButton:        () => this.page.locator("dex-network-display-detail#dexNetworkDetail paper-icon-button[title='Guardar'], dex-network-display-detail#dexNetworkDetail paper-icon-button[title='Save']"),
    tagContainer:      () => this.page.locator('#tagSelector .textarea-container'),
    playlistAnalyzerBtn: () => this.page.locator("dex-network-display-detail#dexNetworkDetail paper-icon-button[icon='av:subscriptions']"),
  };

  private async waitForDetailPanel() {
    const input = this.elements.groupCombo().locator('input');
    for (let i = 0; i < 25; i++) {
      const box = await input.boundingBox();
      if (box && box.x >= 0 && box.x < 1920 && box.width > 0) return;
      await this.page.waitForTimeout(200);
    }
  }

  private async fillVaadinCombo(input: ReturnType<typeof this.page.locator>, value: string) {
    await input.click({ force: true });
    await input.fill(value, { force: true });
    await this.page.locator('vaadin-combo-box-overlay').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  private async waitForPlaylistReady() {
    const combo = this.page.locator('dex-network-display-detail#dexNetworkDetail dex-playlist-combo vaadin-combo-box#playlistMenu');
    for (let i = 0; i < 30; i++) {
      const items = await combo.evaluate((el: any) => el.items ? el.items.length : 0).catch(() => 0);
      if (items > 0) return;
      await this.page.waitForTimeout(300);
    }
  }

  private async fillPlaylistCombo(input: ReturnType<typeof this.page.locator>, value: string) {
    await this.waitForPlaylistReady();
    await input.click({ force: true });
    await input.press('Control+a');
    await input.pressSequentially(value, { delay: 50 });
    await this.page.locator('vaadin-combo-box-overlay').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
    await input.press('ArrowDown');
    await this.page.waitForTimeout(100);
    await input.press('Enter');
  }

  async clickSave() { await this.elements.saveButton().click(); }

  async decisionToSavePlayer() {
    const btn = this.elements.saveButton();
    const ariaDisabled = await btn.getAttribute('aria-disabled');
    if (ariaDisabled === 'false' || ariaDisabled === null) {
      await btn.click();
      await this.page.waitForTimeout(1500);
      const confirmBtns = this.page.locator('#saveConfirmDialog paper-button, #confirmDialog paper-button').filter({ hasText: /Confirmar/i });
      const count = await confirmBtns.count();
      for (let i = 0; i < count; i++) {
        if (await confirmBtns.nth(i).isVisible()) {
          await confirmBtns.nth(i).click({ force: true });
          break;
        }
      }
    }
  }

  async setGroupNone() {
    await this.waitForDetailPanel();
    const clearBtn = this.elements.groupClearBtn();
    if (await clearBtn.isVisible()) await clearBtn.click({ force: true });
    await this.fillVaadinCombo(this.elements.groupCombo().locator('input'), 'ninguno');
  }

  async completePlayerGroupSelect(groupName: string) {
    const input = this.elements.groupInput();
    await input.click({ force: true });
    await input.press('Control+a');
    await input.pressSequentially(groupName, { delay: 50 });
    await this.page.locator('vaadin-combo-box-overlay').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
    await input.press('ArrowDown');
    await this.page.waitForTimeout(100);
    await input.press('Enter');
  }

  async setInheritedPLDefault() {
    await this.fillPlaylistCombo(this.elements.plDefaultInput(), 'heredado');
  }

  async setInheritedSchedule() {
    await this.fillVaadinCombo(this.elements.scheduleInput(), 'heredado');
  }

  async setInheritedTP() {
    await this.fillVaadinCombo(this.elements.tpCombo().locator('input'), 'heredado');
  }

  async setInheritedHP() {
    await this.fillVaadinCombo(this.elements.hpCombo().locator('input'), 'heredado');
  }

  async setNewPlaylist(playlist: string, backupPlaylist: string) {
    const current = await this.elements.plDefaultInput().inputValue();
    const target = current.trim() === playlist ? backupPlaylist : playlist;
    this.plApplied = target;
    await this.fillPlaylistCombo(this.elements.plDefaultInput(), target);
  }

  async setNewSchedule(schedule: string, backupSchedule: string) {
    const current = await this.elements.scheduleInput().inputValue();
    const target = current.trim() === schedule ? backupSchedule : schedule;
    this.shApplied = target;
    await this.fillVaadinCombo(this.elements.scheduleInput(), target);
  }

  async getCurrentVersion(): Promise<string> {
    const text = await this.elements.versionLabel().textContent();
    return (text ?? '').trim();
  }

  private async waitForInputValue(locator: ReturnType<typeof this.page.locator>, timeout = 8000): Promise<string> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const val = await locator.inputValue().catch(() => '');
      if (val.length > 0) return val;
      await this.page.waitForTimeout(300);
    }
    return await locator.inputValue().catch(() => '');
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private assertInherited(val: string, expected: string) {
    const pattern = new RegExp(this.escapeRegex(expected), 'i');
    expect(val).toMatch(pattern);
    expect(val.toLowerCase()).toContain('heredado');
  }

  private async dismissConfirmDialog() {
    const confirmBtns = this.page.locator('#saveConfirmDialog paper-button, #confirmDialog paper-button').filter({ hasText: /Confirmar/i });
    const count = await confirmBtns.count();
    for (let i = 0; i < count; i++) {
      if (await confirmBtns.nth(i).isVisible({ timeout: 500 }).catch(() => false)) {
        await confirmBtns.nth(i).click({ force: true });
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  async validateInheritedValues({
    playlistName,
    hardwarePolicyName,
    transmissionPolicyName,
    scheduleName,
    timeZone,
  }: {
    playlistName?: string;
    hardwarePolicyName?: string;
    transmissionPolicyName?: string;
    scheduleName?: string;
    timeZone?: string;
  }) {
    await this.dismissConfirmDialog();
    await this.waitForDetailPanel();
    if (playlistName) {
      const val = await this.waitForInputValue(this.elements.plDefaultInput());
      this.assertInherited(val, playlistName);
    }
    if (scheduleName) {
      const val = await this.waitForInputValue(this.elements.scheduleInput());
      this.assertInherited(val, scheduleName);
    }
    if (hardwarePolicyName) {
      const val = await this.waitForInputValue(this.elements.hpCombo().locator('input'));
      this.assertInherited(val, hardwarePolicyName);
    }
    if (transmissionPolicyName) {
      const val = await this.waitForInputValue(this.elements.tpCombo().locator('input'));
      this.assertInherited(val, transmissionPolicyName);
    }
    if (timeZone) {
      const val = await this.waitForInputValue(this.elements.timeZoneCombo().locator('input'));
      this.assertInherited(val, timeZone);
    }
  }

  async clickPlaylistAnalyzerBtn() { await this.elements.playlistAnalyzerBtn().click(); }

  async validateTagValue(tagName: string) {
    await this.waitForDetailPanel();
    await this.page.evaluate(() => {
      function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
        const el = root.querySelector(sel); if (el) return el;
        for (const e of Array.from(root.querySelectorAll('*'))) {
          if ((e as any).shadowRoot) { const f = findInShadow((e as any).shadowRoot, sel); if (f) return f; }
        } return null;
      }
      const tagSel = findInShadow(document, '#tagSelector');
      const innerContainer = findInShadow(document, '.inner-container');
      if (!tagSel || !innerContainer) return;
      const tagRect = tagSel.getBoundingClientRect();
      const containerRect = innerContainer.getBoundingClientRect();
      (innerContainer as HTMLElement).scrollLeft = (innerContainer as HTMLElement).scrollLeft + (tagRect.left - containerRect.left);
    });
    await this.page.waitForTimeout(1000);
    await expect(this.elements.tagContainer()).toContainText(tagName, { timeout: 15000 });
  }
}
