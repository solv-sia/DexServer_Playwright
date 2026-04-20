import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GroupDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private dialog = () => this.page.locator('#multiEditData paper-dialog#multiEdit');

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
    tagCombo:               () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="label"]) vaadin-combo-box'),
    channelOneInput:        () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="label"])').nth(1).locator('vaadin-combo-box#tagInput input'),
    channelTwoInput:        () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="label"])').nth(2).locator('vaadin-combo-box#tagInput input'),
    storeCombo:             () => this.dialog().locator('paper-icon-item:has(iron-icon[icon="store"]) vaadin-combo-box'),
    saveGroupBtn:           () => this.dialog().locator('paper-button').filter({ hasText: /Guardar|Save/i }),
    confirmDialog:          () => this.page.locator('#dexNetworkList #multiEditData #confirmDialog'),
    confirmBtn:             () => this.page.locator('#dexNetworkList #multiEditData #confirmDialog .buttons paper-button').filter({ hasText: /confirm(ar)?/i }),
  };

  private async fillVaadinCombo(combo: ReturnType<typeof this.page.locator>, value: string) {
    const input = combo.locator('input');
    await input.click({ force: true });
    await input.fill(value, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async completeGroupNameInput(groupName: string) {
    await this.elements.groupNameInput().click({ force: true });
    await this.elements.groupNameInput().fill(groupName, { force: true });
  }

  async completePlaylistSelect(name: string)           { await this.fillVaadinCombo(this.elements.playlistCombo(), name); }
  async completeScheduleSelect(name: string)           { await this.fillVaadinCombo(this.elements.scheduleCombo(), name); }
  async completeTransmissionPolicySelect(name: string) { await this.fillVaadinCombo(this.elements.transmissionCombo(), name); }
  async completeHardwarePolicySelect(name: string)     { await this.fillVaadinCombo(this.elements.hardwarePolicyCombo(), name); }
  async completeSynchronizationSelect(time: string)    { await this.fillVaadinCombo(this.elements.synchronizationCombo(), time); }
  async completeTagSelect(tagName: string)             { await this.fillVaadinCombo(this.elements.tagCombo(), tagName); }
  async completeStoreSelect(storeName: string)         { await this.fillVaadinCombo(this.elements.storeCombo(), storeName); }

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
    const input = this.elements.channelOneInput();
    await input.click({ force: true });
    await input.press('Control+a');
    await input.pressSequentially(playerName, { delay: 50 });
    await this.page.locator('vaadin-combo-box-overlay').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
    await input.press('ArrowDown');
    await this.page.waitForTimeout(100);
    await input.press('Enter');
  }

  async completeChannelTwoSelect(playerName: string) {
    const input = this.elements.channelTwoInput();
    await input.click({ force: true });
    await input.press('Control+a');
    await input.pressSequentially(playerName, { delay: 50 });
    await this.page.locator('vaadin-combo-box-overlay').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
    await input.press('ArrowDown');
    await this.page.waitForTimeout(100);
    await input.press('Enter');
  }

  async clickSaveGroupBtn() { await this.elements.saveGroupBtn().click(); }

  async decisionConfirmPlayer() {
    try {
      await this.elements.confirmDialog().waitFor({ state: 'visible', timeout: 4000 });
      await this.elements.confirmBtn().click({ force: true });
      await this.page.waitForTimeout(500);
    } catch {
      // No confirmation dialog appeared — player was not in another group
    }
  }
}
