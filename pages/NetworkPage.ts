import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NetworkPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    searchInput:          () => this.findElement({ get: '#dexNetworkList', find: ['.search-input', 'input'] }),
    resultingPlayer:      () => this.findElement({ get: '#dexNetworkList', find: ['dex-network-display-card'] }),
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
  };

  async clearAndSearch(name: string) {
    await this.elements.searchInput().click({ force: true });
    await this.elements.searchInput().fill('', { force: true });
    await this.elements.searchInput().fill(name, { force: true });
    await this.page.waitForTimeout(800);
  }

  async clearSearchField() {
    await this.elements.searchInput().fill('', { force: true });
  }

  async clickResultingPlayer() { await this.elements.resultingPlayer().first().click(); }
  async clickResultingGroup() {
    const group = this.page.locator('#dexNetworkList dex-network-display-view dex-network-group').first();
    await group.hover();
    await this.page.waitForTimeout(300);
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
    await this.page.waitForTimeout(300);
    await group.locator('paper-icon-button[title="Editar"], paper-icon-button[title="Edit"]').first().click();
  }

  async checkGroupPopUpIsVisible() {
    await expect(this.elements.checkGroupPopUp()).toBeVisible();
  }

  async checkDisplayPropertyValue({ playerName = '', playlistName = '', scheduleName = '' }: { playerName?: string; playlistName?: string; scheduleName?: string }) {
    const value = playerName || playlistName || scheduleName;
    await this.clearAndSearch(value);
    await this.page.waitForTimeout(1000);
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
    await this.page.waitForTimeout(1000);
    await this.elements.deleteGroupBtn().click({ force: true });
    await this.elements.confirmDeleteGroupBtn().click({ force: true });
  }
}
