import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NetworkPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    searchInput:          () => this.findElement({ get: '#dexNetworkList', find: ['.search-input', 'input'] }),
    resultingPlayer:      () => this.findElement({ get: '#dexNetworkList', find: ['dex-network-display-card'] }),
    addButton:            () => this.findElement({ get: "[icon-start='add']", find: ['#paperFab'], eq: 0 }),
    activatePlayerBtn:    () => this.page.locator("paper-fab[title='Activar Player'], paper-fab[title='Activate Player']").locator('#icon'),
    displayNameInput:     () => this.page.locator("paper-input[aria-disabled='false']").nth(2).locator('input'),
    displayCodeInput:     () => this.page.locator("paper-input[aria-disabled='false']").nth(3).locator('input'),
    saveDialogButton:     () => this.page.locator("#newDisplayPanel div.buttons paper-button[role='button']").nth(1),
    machineIdOnCard:      () => this.page.locator('dex-network-display-card').first().locator('#displayMachineId'),
    moreBtn:              () => this.findElement({ get: '#dexNetworkList', find: ['#paperFab', '#icon'], eq: 0 }),
    groupBtn:             () => this.findElement({ get: '#dexNetworkList', find: ["[icon='group-work']", '#paperFab', '#icon'] }),
    syncGroupBtn:         () => this.findElement({ get: '#dexNetworkList', find: ["[icon='hardware:device-hub']", '#paperFab', '#icon'] }),
    resultingGroup:       () => this.page.locator('#dexNetworkList dex-network-display-view dex-network-group paper-icon-button[title="Editar"], #dexNetworkList dex-network-display-view dex-network-group paper-icon-button[title="Edit"]').locator('iron-icon#icon'),
    networkOptions:       () => this.findElement({ get: '#dexNetworkList', find: ['#icon'], eq: 5 }),
    showEmptyGroupsChk:   () => this.page.locator('#dexNetworkList .background-item paper-listbox[slot="dropdown-content"] paper-icon-item').nth(3),
    checkGroupPopUp:      () => this.page.locator('#multiEdit h2.title.flex').filter({ hasText: /Editar Grupo|Edit Group/i }),
    visibleCards:         () => this.page.locator('dex-network-display-card'),
    deleteGroupBtn:       () => this.page.locator('#dexNetworkList dex-network-display-view dex-network-group paper-icon-button[title="Eliminar"], #dexNetworkList dex-network-display-view dex-network-group paper-icon-button[title="Delete"]').locator('iron-icon#icon').first(),
    confirmDeleteGroupBtn:() => this.page.locator('#dexNetworkList #deleteGroupDialog paper-button[role="button"]').filter({ hasText: /Confirmar|Confirm/i }),
    groupPlaylistAnalyzerBtn: () => this.page.locator('#dexNetworkList dex-network-display-view dex-network-group paper-icon-button[title="Playlist Analyzer"] iron-icon#icon'),
    superFilterPopUp:    () => this.page.locator('#searchInput #filterIcon'),
    superFilterField:    (i = 0) => this.page.locator('#rowFilter #fieldsMenu input[placeholder="Campo"], #rowFilter #fieldsMenu input[placeholder="Field"]').nth(i),
    superFilterCondition:(i = 0) => this.page.locator('#rowFilter #isMenu input[placeholder="Condición"], #rowFilter #isMenu input[placeholder="Condition"]').nth(i),
    superFilterTagInput: (i = 0) => this.page.locator('dex-new-combo-tags-filter vaadin-combo-box#tagInput vaadin-text-field#input input').nth(i),
    superFilterApplyBtn: () => this.page.locator('#advanceFilter paper-button.custom-button.blue').filter({ hasText: /Aplicar|Apply/i }),
    displayCheck:        () => this.findElement({ get: '#dexNetworkList', find: ['dex-network-display-card', '#displayCheckbox'] }),
    botonera:            () => this.findElement({ get: '#dexNetworkList', find: ["dex-fab-menu[icon-start='settings-remote']", '#mainFab', '#paperFab'] }),
    sendLogCommand:        () => this.page.locator("paper-fab[title='Enviar Logs'], paper-fab[title='Request Logs']").first(),
    sendScreenshotCommand: () => this.page.locator("paper-fab[title='Capturar Pantalla'], paper-fab[title='Request Screenshot']").first(),
    rebootCommand:         () => this.page.locator("paper-fab[title='Reiniciar'], paper-fab[title='Reboot']").first(),
    mediaCleanCommand:     () => this.page.locator("paper-fab[title='Borrar media'], paper-fab[title='Delete media']").first(),
    resetCommand:          () => this.page.locator("paper-fab[title='Borrado de fabrica'], paper-fab[title='Hard Reset']").first(),
    confirmButton:         () => this.findElement({ get: '#commandDialog', find: ['paper-button'], eq: 1 }),
  };

  async clearAndSearch(name: string) {
    const input = this.elements.searchInput();
    await input.dispatchEvent('click');
    await input.fill('', { force: true });
    await input.fill(name, { force: true });
    await input.press('Enter');
    // Wait until the card shell has real dimensions (Polymer renders content asynchronously)
    const card = this.elements.resultingPlayer().first();
    for (let i = 0; i < 30; i++) {
      const box = await card.boundingBox().catch(() => null);
      if (box && box.width > 0 && box.height > 0) return;
      await this.page.waitForTimeout(500);
    }
  }

  async clearSearchField() {
    await this.elements.searchInput().fill('', { force: true });
  }

  async clickAddButton() {
    await this.elements.addButton().click();
    await this.elements.activatePlayerBtn().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }
  async clickActivatePlayerButton() {
    await this.elements.activatePlayerBtn().click();
    await this.elements.displayNameInput().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }
  async typeDisplayName(name: string) { await this.elements.displayNameInput().fill(name, { force: true }); }
  async typeDisplayCode(code: string) { await this.elements.displayCodeInput().fill(code, { force: true }); }
  async clickSaveDialogButton() { await this.elements.saveDialogButton().click({ force: true }); }
  async getMachineIdFromCard(): Promise<string> {
    const text = await this.elements.machineIdOnCard().textContent();
    return (text ?? '').trim();
  }

  async clickResultingPlayer() {
    const card = this.elements.resultingPlayer().first();
    // Wait for the [opened] attribute — Polymer sets it immediately but the panel may still be
    // CSS-hidden (transform animation), so state:'attached' is used instead of 'visible'
    const detail = this.page.locator('dex-network-display-detail#dexNetworkDetail[opened]');
    for (let attempt = 1; attempt <= 3; attempt++) {
      await card.dispatchEvent('click');
      const appeared = await detail.waitFor({ state: 'attached', timeout: 8000 })
        .then(() => true).catch(() => false);
      if (appeared) return;
    }
    await detail.waitFor({ state: 'attached', timeout: 10000 });
  }
  async clickResultingGroup() {
    const group = this.page.locator('#dexNetworkList dex-network-display-view dex-network-group').first();
    await group.hover();
    await this.elements.resultingGroup().first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.elements.resultingGroup().first().click({ force: true });
  }
  async clickMoreBtn()         { await this.elements.moreBtn().click(); }
  async clickGroupBtn()        { await this.elements.groupBtn().click(); }
  async clickSyncGroupBtn()    { await this.elements.syncGroupBtn().click(); }
  async clickNetworkOptions()  { await this.elements.networkOptions().click(); }

  async verifyEmptyGroupsCheckBox() {
    const el = this.elements.showEmptyGroupsChk();
    const ariaPressed = await el.getAttribute('aria-pressed');
    if (ariaPressed !== 'true') {
      await el.click();
    }
  }

  async clickOnGroup(groupName: string) {
    const group = this.page.locator('dex-network-group').filter({ hasText: groupName });
    await group.first().hover();
    await group.locator('paper-icon-button[title="Editar"], paper-icon-button[title="Edit"]').first()
      .waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await group.locator('paper-icon-button[title="Editar"], paper-icon-button[title="Edit"]').first()
      .click({ force: true });
  }

  async checkGroupPopUpIsVisible() {
    await expect(this.elements.checkGroupPopUp()).toBeVisible();
  }

  async checkDisplayPropertyValue({ playerName = '', playlistName = '', scheduleName = '' }: { playerName?: string; playlistName?: string; scheduleName?: string }) {
    const value = playerName || playlistName || scheduleName;
    await this.clearAndSearch(value);
    const cards = this.elements.visibleCards();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  }

  async clickGroupPlaylistAnalyzerBtn() { await this.elements.groupPlaylistAnalyzerBtn().first().click({ force: true }); }

  async clickSuperFilterPopUp()           { await this.elements.superFilterPopUp().click(); }
  async clickSuperFilterApplyBtn()        { await this.elements.superFilterApplyBtn().click(); }

  async typeInSuperFilterField(field: string, index = 0) {
    const input = this.elements.superFilterField(index);
    await input.click({ force: true });
    await input.fill(field, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async typeInSuperFilterCondition(condition: string, index = 0) {
    const input = this.elements.superFilterCondition(index);
    await input.click({ force: true });
    await input.fill(condition, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async typeInSuperFilterTagInput(value: string, index = 0) {
    const input = this.elements.superFilterTagInput(index);
    await input.click({ force: true });
    await input.fill(value, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async clickSuperFilterTagCombo(index = 0) {
    await this.page.locator('dex-new-combo-tags-filter #inputCombo').nth(index).click({ force: true });
  }

  async typeInSuperFilterDate(date: string, index = 0) {
    const input = this.page.locator('#advanceFilter dex-date-picker input, #rowFilter dex-date-picker input, #advanceFilter paper-input[type="date"] input').nth(index);
    await input.click({ force: true });
    await input.fill(date, { force: true });
    await input.press('Enter');
  }

  async deleteGroup(groupName: string) {
    await this.clearAndSearch(groupName);
    await this.elements.deleteGroupBtn().click({ force: true });
    await this.elements.confirmDeleteGroupBtn().click({ force: true });
  }

  async clickDisplayCheck() {
    await this.elements.displayCheck().first().dispatchEvent('click');
    await this.elements.botonera().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }
  async clickBotonera() {
    await this.elements.botonera().dispatchEvent('click');
    await this.elements.sendLogCommand().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  }
  async clickSendLogCommand() {
    await this.elements.sendLogCommand().dispatchEvent('click');
    await this.elements.confirmButton().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  }
  async clickSendScreenshotCommand() {
    await this.elements.sendScreenshotCommand().dispatchEvent('click');
    await this.elements.confirmButton().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  }
  async clickRebootCommand() {
    await this.elements.rebootCommand().dispatchEvent('click');
    await this.elements.confirmButton().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  }
  async clickMediaCleanCommand() {
    await this.elements.mediaCleanCommand().dispatchEvent('click');
    await this.elements.confirmButton().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  }
  async clickResetCommand() {
    await this.elements.resetCommand().dispatchEvent('click');
    await this.elements.confirmButton().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  }
  async clickConfirmButton() { await this.elements.confirmButton().dispatchEvent('click'); }
}
