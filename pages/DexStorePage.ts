import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DexStorePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private frame() {
    return this.page.frameLocator('iframe[id="iframe"][name="remotePage"]');
  }

  private elements = {
    storeTab:          () => this.frame().locator('paper-tab[name="store"]'),
    addBtn:            () => this.frame().locator('.dex-fab[icon="add"]'),
    storeCodeInput:    () => this.frame().locator('paper-dialog#dialogSave paper-input input').nth(0),
    storeNameInput:    () => this.frame().locator('paper-dialog#dialogSave paper-input input').nth(1),
    storeCountryInput: () => this.frame().locator('paper-dialog#dialogSave vaadin-text-field#input input').nth(2),
    storeProvinceInput:() => this.frame().locator('dex-store-view #dialogSaveScroll vaadin-combo-box#stateCombo input'),
    storeLocationInput:() => this.frame().locator('dex-store-view #dialogSaveScroll vaadin-combo-box#cityCombo input'),
    storeStatusInput:  () => this.frame().locator('paper-dialog#dialogSave vaadin-text-field#input input').nth(5),
    saveBtn:           () => this.frame().locator('paper-dialog#dialogSave paper-button').nth(1),
    confirmBtn:        () => this.frame().locator('paper-dialog#dialogConfirm paper-button').filter({ hasText: /confirmar|confirm/i }),
  };

  async clickStoreTab()  { await this.elements.storeTab().click(); }
  async clickAddBtn()    { await this.elements.addBtn().click(); }
  async clickSaveBtn()   { await this.elements.saveBtn().click(); }
  async clickConfirmBtn() { await this.elements.confirmBtn().click(); }

  async typeStoreCode(code: string) {
    await this.elements.storeCodeInput().fill(code, { force: true });
  }
  async typeStoreName(name: string) {
    await this.elements.storeNameInput().fill(name, { force: true });
  }
  async typeStoreCountry(country: string) {
    const input = this.elements.storeCountryInput();
    await input.fill(country, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }
  async typeStoreProvince(province: string) {
    const input = this.elements.storeProvinceInput();
    await input.fill(province, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }
  async typeStoreLocation(location: string) {
    const input = this.elements.storeLocationInput();
    await input.fill(location, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }
  async typeStoreStatus(status: string) {
    await this.elements.storeStatusInput().fill(status, { force: true });
  }
}
