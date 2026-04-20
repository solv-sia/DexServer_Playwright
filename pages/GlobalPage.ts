import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class GlobalPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    comboTenant:   () => this.findElement({ get: '#customerDropdown', find: ['input'] }),
    passwordInput: () => this.findElement({ get: '#password', find: ['input[type=\'password\']'] }),
    spinner:       () => this.page.locator('#dexloader #main'),
    accountMenu:   () => this.page.locator('.header-profile-picture'),
    logout:        () => this.page.locator('.flex.account-menu-item').nth(2),
    menuSetting:   () => this.page.locator('[data-name=\'setting\']'),
    optionCustomer: () => this.page.locator('[href=\'#!/settings/customer\']'),
    optionRole:    () => this.page.locator('[href=\'#!/settings/role\']'),
    optionUser:    () => this.page.locator('[href=\'#!/settings/user\']'),
    optionGeneral: () => this.page.locator('[href=\'#!/settings/server-settings\']'),
    optionTag:     () => this.page.locator('[href=\'#!/settings/tag\']'),
    infoToastLabel:       () => this.findElement({ get: '#infoToast', find: ['#label'] }),
    playlistIcon:         () => this.findElement({ get: '.playlist-color', find: ['#icon'] }),
    scheduleIcon:         () => this.findElement({ get: '.schedules-color', find: ['#icon'] }),
    networkIcon:              () => this.findElement({ get: '.network-color', find: ['#icon'] }),
    hardwarePolicyHeader:     () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', ".network-color[icon='settings-remote']"] }),
    transmissionPolicyHeader: () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', ".network-color[icon='settings-input-antenna']"] }),
    mediaLibraryHeader:       () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', ".media-color[icon='perm-media']"], eq: 0 }),
    playlistHeader:           () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', ".playlist-color[icon='theaters']"], eq: 0 }),
    optionReport:             () => this.page.locator("[data-name='report']"),
    optionPOP:                () => this.page.locator("a[href='#!/report/daily-impressions'"),
    optionDexStore:           () => this.page.locator("[href='#!/store']"),
  };

  async waitSpinner() {
    await expect(this.elements.spinner()).toHaveCSS('display', 'none', { timeout: 15000 });
  }

  async clickAccountMenu() {
    await this.elements.accountMenu().click({ force: true });
  }

  async clickLogout() {
    await this.elements.logout().click();
  }

  async clickMenuSetting() {
    await this.elements.menuSetting().click();
  }

  async clickOptionCustomer() {
    await this.elements.optionCustomer().click();
  }

  async clickOptionRole() {
    await this.elements.optionRole().click();
  }

  async clickOptionUsers() {
    await this.elements.optionUser().click();
  }

  async switchToNewTenant(client: string) {
    const combo = this.elements.comboTenant();
    await combo.waitFor({ state: 'visible' });
    await combo.click();
    await combo.clear();
    await combo.press('Backspace');
    await combo.pressSequentially(client, { delay: 100 });
    await this.page.waitForTimeout(500);
    await combo.press('ArrowUp');
    await combo.press('Enter');
  }

  async loginDecision(password: string) {
    const passwordInput = this.page.locator('input[type="password"]');
    const isVisible = await passwordInput.isVisible().catch(() => false);
    if (isVisible) {
      await passwordInput.fill(password);
      await passwordInput.press('Enter');
      await this.waitSpinner();
    }
  }

  async clickPlaylist()                   { await this.elements.playlistIcon().click(); }
  async clickOnPlaylistHeader()           { await this.elements.playlistHeader().click(); }
  async clickSchedule()                   { await this.elements.scheduleIcon().click(); }
  async clickNetwork()                    { await this.elements.networkIcon().click(); }
  async clickOnNetworkHeader()            { await this.elements.networkIcon().click(); }
  async clickOnHardwarePolicyHeader()     { await this.elements.hardwarePolicyHeader().click(); }
  async clickOnTransmissionPolicyHeader() { await this.elements.transmissionPolicyHeader().click(); }
  async clickOptionGeneral()              { await this.elements.optionGeneral().click(); }
  async clickOptionTag() {
    await this.elements.optionTag().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    await this.elements.optionTag().dispatchEvent('click');
  }
  async clickButtonReport()               { await this.elements.optionReport().click(); }
  async clickOptionPOP()                  { await this.elements.optionPOP().click(); }
  async clickOptionDexStore()             { await this.elements.optionDexStore().click(); }



  async clickOnMediaLibraryHeader() {
    await this.elements.mediaLibraryHeader().click();
  }

  async readInfoPopup(msg: string | RegExp) {
    const label = this.elements.infoToastLabel();
    await expect(label).toBeVisible({ timeout: 10000 });
    if (msg instanceof RegExp) {
      await expect(label).toHaveText(msg);
    } else {
      await expect(label).toContainText(msg);
    }
  }
}
