import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CustomerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    addButton:       () => this.findElement({ get: '[icon-start=\'add\']', find: ['#paperFab'], eq: 0 }),
    newCustomerBtn:      () => this.page.locator('paper-fab[title="Nuevo Cliente"], paper-fab[title="New Customer"]').first(),
    newSuperCustomerBtn: () => this.page.locator('paper-fab[title="Nuevo Super-Cliente"], paper-fab[title="New Super Customer"]').first(),
    nameInput:           () => this.findElement({ get: '.style-input', find: ['input'], eq: 0 }),
    superNameInput:      () => this.page.locator('#dialogSaveSuper paper-input').first().locator('input'),
    customerComboInput:  () => this.page.locator('#dialogSaveSuper >> dex-textarea-tags >> vaadin-combo-box >> input'),
    intermalIdInput:     () => this.findElement({ get: '.style-input', find: ['input'], eq: 1 }),
    ownerMailInput:      () => this.findElement({ get: '.style-input', find: ['input'], eq: 2 }),
    confirmButton:       () => this.page.locator('#dialogSave [role=\'button\'], #dialogSaveSuper [role=\'button\']').filter({ hasText: /Confirmar|Confirm/i }).filter({ visible: true }),
    searchInput:     () => this.findElement({ get: '.search-input', find: ['input'] }),
    toggle:          () => this.findElement({ get: 'dex-settings-customer', find: ['#toggleButton'] }),
    toggleState:     () => this.findElement({ get: 'dex-settings-customer', find: ['paper-toggle-button'] }),
  };

  async clickAddButton() {
    await this.elements.addButton().click();
  }

  async clickNewCustomerButton() {
    const btn = this.elements.newCustomerBtn();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click({ force: true });
  }

  async clickNewSuperCustomerButton() {
    const btn = this.elements.newSuperCustomerBtn();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click({ force: true });
  }

  async typeNameSuperInput(name: string) {
    await this.elements.superNameInput().fill(name, { force: true });
  }

  async typeCustomer(clientName: string) {
    const input = this.elements.customerComboInput();
    await input.fill(clientName, { force: true });
    await this.page.waitForTimeout(500);
    await input.press('ArrowDown');
    await this.page.waitForTimeout(100);
    await input.press('Enter');
    await this.page.waitForTimeout(200);
  }

  async typeNameInput(customerName: string) {
    await this.elements.nameInput().fill(customerName);
  }

  async typeIntermalId(id: string) {
    await this.elements.intermalIdInput().fill(id, { force: true });
  }

  async typeOwnerMailInput(email: string) {
    await this.elements.ownerMailInput().fill(email, { force: true });
  }

  async clickConfirmButton() {
    const btn = this.elements.confirmButton();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.dispatchEvent('click');
    // Wait for the dialog to fully close before returning — prevents race conditions
    // where the next action (search, navigation) fires while the save is still in-flight.
    await this.page.locator('#dialogSave, #dialogSaveSuper')
      .waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  async typeSearchInput(customerName: string) {
    await this.waitOverlayClosed(30000);
    const input = this.elements.searchInput();
    await input.fill(customerName, { force: true });
    // Wait for the list to filter before returning so the caller's next action
    // (clickToogle) targets the correct customer card, not an unfiltered row.
    await this.page.locator('dex-settings-customer')
      .filter({ hasText: customerName })
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {});
  }

  async clickToogle() {
    const toggle = this.elements.toggleState();
    await toggle.scrollIntoViewIfNeeded();
    await toggle.waitFor({ state: 'visible', timeout: 10000 });
    await toggle.click();
  }

  async checkToogleActived() {
    await expect(this.elements.toggleState()).toHaveAttribute('aria-pressed', 'true');
  }

  async deleteCustomer(customerName: string) {
    await this.typeSearchInput(customerName);
    await this.page.locator('dex-settings-customer').first().click();
    await this.page.locator('paper-icon-button[icon="delete"]').first().click({ force: true });
    await this.page.locator('paper-button[role="button"]').filter({ hasText: /Confirmar|Confirm/i }).first().click({ force: true });
    await this.waitOverlayClosed();
  }
}
