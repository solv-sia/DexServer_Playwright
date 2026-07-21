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
    networkIcon:              () => this.findElement({ get: 'dex-app', find: ["[name='master']", '#dexHeader', "paper-icon-button.network-color[icon='device:devices']"] }),
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

    const overlay = this.page.locator('vaadin-combo-box-overlay[theme~="customer"]');
    await overlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

    await combo.click({ force: true });
    await combo.clear();
    await combo.fill(client, { force: true });
    await overlay.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Vaadin pre-focaliza el ítem actualmente seleccionado cuando el overlay se abre.
    // Si ese ítem también aparece en la lista filtrada, ArrowDown lo salta en vez de
    // ir al primero. Calculamos el delta y navegamos con precisión al ítem exacto.
    const { exactIndex, focusedIndex } = await this.page.evaluate((clientName: string) => {
      function deepFind(root: Document | ShadowRoot, sel: string): Element | null {
        const el = root.querySelector(sel);
        if (el) return el;
        for (const child of Array.from(root.querySelectorAll('*'))) {
          const sr = (child as any).shadowRoot as ShadowRoot | null;
          if (sr) {
            const found = deepFind(sr, sel);
            if (found) return found;
          }
        }
        return null;
      }
      const combo = deepFind(document, '#customerDropdown') as any;
      const filtered: any[] = combo?.filteredItems ?? [];
      const labelPath: string = combo?.itemLabelPath ?? 'FullName';
      const exactIndex: number = filtered.findIndex((i: any) => i[labelPath] === clientName);
      const focusedIndex: number = typeof combo?._focusedIndex === 'number' ? combo._focusedIndex : -1;
      return { exactIndex, focusedIndex };
    }, client);

    if (exactIndex < 0) {
      // Sin match exacto: ir al primer ítem y confirmar
      await combo.press('ArrowDown');
      await this.page.waitForTimeout(300);
    } else if (focusedIndex < 0) {
      // Sin pre-foco: primer ArrowDown va al índice 0; bajar exactIndex más
      for (let i = 0; i <= exactIndex; i++) {
        await combo.press('ArrowDown');
        await this.page.waitForTimeout(80);
      }
    } else {
      // Con pre-foco en focusedIndex: navegar el delta al índice exacto
      const delta = exactIndex - focusedIndex;
      const key = delta >= 0 ? 'ArrowDown' : 'ArrowUp';
      for (let i = 0; i < Math.abs(delta); i++) {
        await combo.press(key);
        await this.page.waitForTimeout(80);
      }
    }

    await combo.press('Enter');
    await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async loginDecision(password: string) {
    // Esperar hasta 5s a que aparezca el diálogo de autorización de cambio de tenant.
    // isVisible() no espera: puede correr antes que el diálogo se renderice.
    const passwordInput = this.page.locator('input[type="password"]');
    const appeared = await passwordInput.waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true).catch(() => false);
    if (appeared) {
      await passwordInput.fill(password);
      await passwordInput.press('Enter');
      await this.waitSpinner();
    }
  }

  async clickPlaylist()                   { await this.waitOverlayClosed(); await this.elements.playlistIcon().click(); }
  async clickOnPlaylistHeader()           { await this.waitOverlayClosed(); await this.elements.playlistHeader().click(); }
  async clickSchedule()                   { await this.waitOverlayClosed(); await this.elements.scheduleIcon().click(); }
  async clickNetwork() {
    await this.waitOverlayClosed();
    const icon = this.elements.networkIcon();
    await icon.waitFor({ state: 'attached', timeout: 60000 }).catch(() => {});
    await icon.dispatchEvent('click');
  }
  async clickOnNetworkHeader()            { await this.waitOverlayClosed(); await this.elements.networkIcon().dispatchEvent('click'); }
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
    await this._readToast(this.page.locator('#infoToast'), this.elements.infoToastLabel(), msg);
  }

  async readErrorPopup(msg: string | RegExp) {
    await this._readToast(this.page.locator('#errorToast'), this.elements.errorToastLabel(), msg);
  }

  private async _readToast(
    toast: ReturnType<typeof this.page.locator>,
    label: ReturnType<typeof this.page.locator>,
    msg: string | RegExp,
  ) {
    // Wait for the toast container itself to become visible — same approach used
    // by setVersionToInstall. If this times out the save never triggered a toast
    // (button disabled, suppressed by another toast, or server error).
    const appeared = await toast.waitFor({ state: 'visible', timeout: 12000 })
      .then(() => true).catch(() => false);

    if (!appeared) {
      throw new Error(`Expected toast matching ${msg} — toast container never became visible`);
    }

    // Toast is visible; read the label. Try shadow-piercing locator first, fall
    // back to textContent on the container for Shady DOM layouts.
    const labelText = ((await label.textContent().catch(() => '')) ?? '').trim();
    const containerText = ((await toast.textContent().catch(() => '')) ?? '').trim();
    const text = labelText || containerText;

    const matches = msg instanceof RegExp ? msg.test(text) : text.includes(msg);
    if (!matches) {
      throw new Error(`Expected toast matching ${msg} but got "${text}"`);
    }
  }
}
