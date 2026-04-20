import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CustomerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    addButton:       () => this.findElement({ get: '[icon-start=\'add\']', find: ['#paperFab'], eq: 0 }),
    newCustomerBtn:      () => this.findElement({ get: '[icon=\'perm-identity\']', find: ['#paperFab'] }),
    newSuperCustomerBtn: () => this.findElement({ get: "[icon='supervisor-account']", find: ['#paperFab'] }),
    nameInput:           () => this.findElement({ get: '.style-input', find: ['input'], eq: 0 }),
    superNameInput:      () => this.page.locator('#customer #dialogSave paper-input').first().locator('input'),
    customerComboInput:  () => this.page.locator('#customer #dialogSave vaadin-combo-box input'),
    intermalIdInput:     () => this.findElement({ get: '.style-input', find: ['input'], eq: 1 }),
    ownerMailInput:      () => this.findElement({ get: '.style-input', find: ['input'], eq: 2 }),
    confirmButton:       () => this.page.locator('#customer >> #dialogSave >> [role=\'button\']').filter({ hasText: /Confirmar|Confirm/i }),
    searchInput:     () => this.findElement({ get: '.search-input', find: ['input'] }),
    toggle:          () => this.findElement({ get: 'dex-settings-customer', find: ['#toggleButton'] }),
    toggleState:     () => this.findElement({ get: 'dex-settings-customer', find: ['paper-toggle-button'] }),
  };

  async clickAddButton() {
    await this.elements.addButton().click();
  }

  async clickNewCustomerButton()      { await this.elements.newCustomerBtn().click(); }
  async clickNewSuperCustomerButton() { await this.elements.newSuperCustomerBtn().click(); }

  async typeNameSuperInput(name: string) {
    await this.elements.superNameInput().fill(name, { force: true });
  }

  async typeCustomer(clientName: string) {
    const input = this.elements.customerComboInput();
    await input.fill(clientName, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
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
    await this.elements.confirmButton().click({ force: true });
  }

  async typeSearchInput(customerName: string) {
    const input = this.elements.searchInput();
    await input.click({ timeout: 40000 });
    await input.fill(customerName, { force: true });
  }

  async clickToogle() {
    await this.elements.toggle().click({ force: true });
  }

  async checkToogleActived() {
    await expect(this.elements.toggleState()).toHaveAttribute('aria-pressed', 'true');
  }

  async deleteCustomer(customerName: string) {
    await this.typeSearchInput(customerName);
    await this.page.waitForTimeout(500);
    await this.page.locator('dex-settings-customer').first().click();
    await this.page.waitForTimeout(300);
    await this.page.locator('paper-icon-button[icon="delete"]').first().click({ force: true });
    await this.page.locator('paper-button[role="button"]').filter({ hasText: /Confirmar|Confirm/i }).first().click();
    await this.page.waitForTimeout(500);
  }
}
