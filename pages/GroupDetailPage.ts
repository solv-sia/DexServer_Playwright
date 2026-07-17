import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GroupDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private dialog = () => this.page.locator('#multiEditData paper-dialog#multiEdit').first();

  private elements = {
    groupNameInput:         () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="create"]) paper-input input'),
    playlistCombo:          () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="theaters"]) dex-playlist-combo vaadin-combo-box#playlistMenu'),
    scheduleCombo: () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box[item-value-path="ScheduleId"]'),
    transmissionCombo:      () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="settings-input-antenna"]) vaadin-combo-box'),
    hardwarePolicyCombo:    () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="settings-remote"]) vaadin-combo-box'),
    ipMulticastInput1:      () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="room"]) paper-input').nth(1).locator('input'),
    ipMulticastInput2:      () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="room"]) paper-input').nth(2).locator('input'),
    ipMulticastInput3:      () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="room"]) paper-input').nth(3).locator('input'),
    synchronizationCombo:   () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="notification:sync"]) vaadin-combo-box'),
    tagCombo:               () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="label"])').first().locator('vaadin-combo-box'),
    channelOneCombo:        () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="label"])').nth(1).locator('vaadin-combo-box#tagInput'),
    channelTwoCombo:        () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="label"])').nth(2).locator('vaadin-combo-box#tagInput'),
    storeCombo:             () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="store"]) vaadin-combo-box'),
    saveGroupBtn:           () => this.dialog().locator('paper-button').filter({ hasText: /Guardar|Save/i }),
    confirmDialog:          () => this.page.locator('#dexNetworkList #multiEditData #confirmDialog'),
    confirmBtn:             () => this.page.locator('#dexNetworkList #multiEditData #confirmDialog .buttons paper-button').filter({ hasText: /confirm(ar)?/i }),
  };

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async fillVaadinCombo(combo: ReturnType<typeof this.page.locator>, value: string) {
    const input = combo.locator('input');
    const overlay = this.page.locator('vaadin-combo-box-overlay[opened]');
    await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const checkReady = () => combo.evaluate((el: any, val: string) => {
      const labelPath = el.itemLabelPath;
      const allItems: any[] = el.items || [];
      if (allItems.length === 0) return false;
      const searchIn: any[] = el.filteredItems?.length ? el.filteredItems : allItems;
      return searchIn.some((item: any) => {
        const label = typeof item === 'string' ? item
          : String(labelPath ? (item[labelPath] ?? '') : (item.label || item.name || item.Name || ''));
        return label.toLowerCase().includes(val.toLowerCase());
      });
    }, value);

    const fillAndWait = async (): Promise<boolean> => {
      await input.click({ force: true });
      await input.fill(value, { force: true });
      await overlay.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      // Wait up to 15 s for the item to appear (server-side fetch may be slow under load)
      for (let i = 0; i < 150; i++) {
        if (await checkReady()) return true;
        await this.page.waitForTimeout(100);
      }
      return false;
    };

    let ready = await fillAndWait();

    // Retry once: close combo and reopen to trigger a fresh server fetch
    if (!ready) {
      await input.press('Escape');
      await overlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
      ready = await fillAndWait();
    }

    // Commit by clicking the matching overlay item — a native click fires the value-changed
    // event the group dialog binds to. Programmatic selectedItem assignment set the text but
    // did NOT commit, so saved groups ended up without the selected playlist/schedule/policy.
    const option = overlay.locator('vaadin-combo-box-item')
      .filter({ hasText: new RegExp(this.escapeRegex(value), 'i') }).first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
    } else {
      await input.press('Enter');
    }
    await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async completeGroupNameInput(groupName: string) {
    await this.elements.groupNameInput().dispatchEvent('click');
    await this.elements.groupNameInput().fill(groupName, { force: true });
  }

  async completePlaylistSelect(name: string)           { await this.fillVaadinCombo(this.elements.playlistCombo(), name); }
  async completeScheduleSelect(name: string)           { await this.fillVaadinCombo(this.elements.scheduleCombo(), name); }
  async completeTransmissionPolicySelect(name: string) { await this.fillVaadinCombo(this.elements.transmissionCombo(), name); }
  async completeHardwarePolicySelect(name: string)     { await this.fillVaadinCombo(this.elements.hardwarePolicyCombo(), name); }
  async completeSynchronizationSelect(time: string)    { await this.fillVaadinCombo(this.elements.synchronizationCombo(), time); }
  async completeTagSelect(tagName: string)             { await this.fillVaadinCombo(this.elements.tagCombo(), tagName); }
  async completeStoreSelect(storeName: string)         { await this.fillVaadinCombo(this.elements.storeCombo(), storeName); }

  async selectFirstStoreOption(): Promise<string> {
    const combo = this.elements.storeCombo();
    const input = combo.locator('input');
    await input.click({ force: true });
    await this.page.locator('vaadin-combo-box-overlay[opened]').waitFor({ state: 'visible', timeout: 15000 });

    // Find first non-ninguno item and its position in the filtered list
    const result = await combo.evaluate((el: any) => {
      const labelPath = el.itemLabelPath;
      const items: any[] = el.filteredItems || el.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = typeof item === 'string'
          ? item
          : String(labelPath ? (item[labelPath] ?? '') : (item.label || item.name || item.Name || ''));
        if (text && !/^(ninguno|none)$/i.test(text.trim())) {
          return { index: i, label: text };
        }
      }
      return null;
    });

    if (!result) throw new Error('No store options available in combo');

    // Ninguno is already selected (cursor at index 0), so press ArrowDown result.index times
    // to advance from index 0 to result.index
    for (let i = 0; i < result.index; i++) {
      await input.press('ArrowDown');
      await this.page.waitForTimeout(50);
    }
    await input.press('Enter');
    await this.page.locator('vaadin-combo-box-overlay[opened]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    await this.page.waitForTimeout(300);

    // Return what the input actually shows (may differ from raw JS label format)
    const displayed = await input.inputValue();
    return displayed || result.label;
  }

  async completeIpMulticastInput1(value: string) {
    await this.elements.ipMulticastInput1().fill(value, { force: true });
  }
  async completeIpMulticastInput2(value: string) {
    await this.elements.ipMulticastInput2().fill(value, { force: true });
  }
  async completeIpMulticastInput3(value: string) {
    await this.elements.ipMulticastInput3().fill(value, { force: true });
  }

  async completeChannelOneSelect(playerName: string) {
    await this.fillVaadinCombo(this.elements.channelOneCombo(), playerName);
  }

  async completeChannelTwoSelect(playerName: string) {
    await this.fillVaadinCombo(this.elements.channelTwoCombo(), playerName);
  }

  async clickSaveGroupBtn() {
    const btn = this.elements.saveGroupBtn();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click({ force: true });
    await this.dialog().waitFor({ state: 'hidden', timeout: 15000 });
    await this.page.waitForTimeout(500);
  }

  async decisionConfirmPlayer() {
    try {
      await this.elements.confirmDialog().waitFor({ state: 'visible', timeout: 10000 });
      await this.elements.confirmBtn().click({ force: true });
      await this.elements.confirmDialog().waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    } catch {
      // No confirmation dialog appeared — player was not in another group
    }
  }
}
