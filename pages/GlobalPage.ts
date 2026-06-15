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
    errorToastLabel:      () => this.findElement({ get: '#errorToast', find: ['#label'] }),
    playlistIcon:         () => this.findElement({ get: '.playlist-color', find: ['#icon'] }),
    scheduleIcon:         () => this.findElement({ get: '.schedules-color', find: ['#icon'] }),
    networkIcon:              () => this.findElement({ get: '.network-color', find: ['#icon'] }),
    hardwarePolicyHeader:     () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', ".network-color[icon='settings-remote']"] }),
    transmissionPolicyHeader: () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', ".network-color[icon='settings-input-antenna']"] }),
    mediaLibraryHeader:       () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', ".media-color[icon='perm-media']"], eq: 0 }),
    playlistHeader:           () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', ".playlist-color[icon='theaters']"], eq: 0 }),
    optionReport:             () => this.page.locator("[data-name='report']"),
    optionPOP:                () => this.page.locator("a[href='#!/report/daily-impressions']"),
    optionDexStore:           () => this.page.locator("[href='#!/store']"),
  };

  async waitSpinner() {
    await expect(this.elements.spinner()).toHaveCSS('display', 'none', { timeout: 60000 });
  }

  async waitOverlayClosed() {
    await this.page.waitForFunction(
      () => !document.querySelector('iron-overlay-backdrop[opened]'),
      { timeout: 15000 }
    ).catch(() => {});
  }

  async clickAccountMenu() {
    await this.waitOverlayClosed();
    await this.elements.accountMenu().click({ force: true });
  }

  async clickLogout() {
    await this.waitOverlayClosed();
    await this.elements.logout().click();
  }

  async clickMenuSetting() {
    await this.waitOverlayClosed();
    await this.elements.menuSetting().click();
  }

  async clickOptionCustomer() {
    await this.waitOverlayClosed();
    await this.elements.optionCustomer().click();
  }

  async clickOptionRole() {
    await this.waitOverlayClosed();
    await this.elements.optionRole().click();
  }

  async clickOptionUsers() {
    await this.waitOverlayClosed();
    await this.elements.optionUser().click();
  }

  async switchToNewTenant(client: string) {
    const combo = this.elements.comboTenant();
    await combo.waitFor({ state: 'visible' });
    await combo.click();
    await combo.clear();
    await combo.press('Backspace');
    await combo.pressSequentially(client, { delay: 100 });

    // Poll until filteredItems contains an exact match (vaadin filters asynchronously)
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
        const c = findInShadow(document, '#customerDropdown') as any;
        if (!c) return false;
        return (c.filteredItems || []).some((i: any) => {
          const label = typeof i === 'string' ? i : (i.label || String(i.value ?? ''));
          return label.toLowerCase().includes(val.toLowerCase());
        });
      }, client);
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
      const c = findInShadow(document, '#customerDropdown') as any;
      if (!c) return;
      const filtered: any[] = c.filteredItems || [];
      // Prefer exact match to avoid selecting a tenant with a similar name
      const match =
        filtered.find((i: any) => {
          const label = typeof i === 'string' ? i : (i.label || String(i.value ?? ''));
          return label.toLowerCase() === val.toLowerCase();
        }) ??
        filtered.find((i: any) => {
          const label = typeof i === 'string' ? i : (i.label || String(i.value ?? ''));
          return label.toLowerCase().includes(val.toLowerCase());
        }) ??
        filtered[0];
      if (!match) return;
      c.selectedItem = match;
      c.opened = false;
    }, client);
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

  async clickPlaylist()                   { await this.waitOverlayClosed(); await this.elements.playlistIcon().click(); }
  async clickOnPlaylistHeader()           { await this.waitOverlayClosed(); await this.elements.playlistHeader().click(); }
  async clickSchedule()                   { await this.waitOverlayClosed(); await this.elements.scheduleIcon().click(); }
  async clickNetwork()                    { await this.waitOverlayClosed(); await this.elements.networkIcon().click(); }
  async clickOnNetworkHeader()            { await this.waitOverlayClosed(); await this.elements.networkIcon().click(); }
  async clickOnHardwarePolicyHeader()     { await this.waitOverlayClosed(); await this.elements.hardwarePolicyHeader().dispatchEvent('click'); }
  async clickOnTransmissionPolicyHeader() { await this.waitOverlayClosed(); await this.elements.transmissionPolicyHeader().dispatchEvent('click'); }
  async clickOptionGeneral()              { await this.waitOverlayClosed(); await this.elements.optionGeneral().click(); }
  async clickOptionTag() {
    await this.waitOverlayClosed();
    await this.elements.optionTag().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    await this.elements.optionTag().dispatchEvent('click');
  }
  async clickButtonReport()               { await this.waitOverlayClosed(); await this.elements.optionReport().click(); }
  async clickOptionPOP()                  { await this.waitOverlayClosed(); await this.elements.optionPOP().click(); }
  async clickOptionDexStore()             { await this.waitOverlayClosed(); await this.elements.optionDexStore().click(); }



  async clickOnMediaLibraryHeader() {
    await this.waitOverlayClosed();
    await this.elements.mediaLibraryHeader().click();
  }

  async readInfoPopup(msg: string | RegExp) {
    const label = this.elements.infoToastLabel();
    // Fast path: toast is still visible
    const isVisible = await label.waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true).catch(() => false);
    if (isVisible) {
      if (msg instanceof RegExp) await expect(label).toHaveText(msg);
      else await expect(label).toContainText(msg);
      return;
    }
    // Toast already showed and auto-dismissed — text persists in the DOM, verify it
    await expect(async () => {
      const text = (await label.textContent() ?? '').trim();
      const matches = msg instanceof RegExp ? msg.test(text) : text.includes(msg);
      if (!matches) throw new Error(`Expected info toast matching ${msg} but label has "${text}"`);
    }).toPass({ timeout: 25000, intervals: [100, 200, 500] });
  }

  async readErrorPopup(msg: string | RegExp) {
    const label = this.elements.errorToastLabel();
    const isVisible = await label.waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true).catch(() => false);
    if (isVisible) {
      if (msg instanceof RegExp) await expect(label).toHaveText(msg);
      else await expect(label).toContainText(msg);
      return;
    }
    await expect(async () => {
      const text = (await label.textContent() ?? '').trim();
      const matches = msg instanceof RegExp ? msg.test(text) : text.includes(msg);
      if (!matches) throw new Error(`Expected error toast matching ${msg} but label has "${text}"`);
    }).toPass({ timeout: 25000, intervals: [100, 200, 500] });
  }
}
