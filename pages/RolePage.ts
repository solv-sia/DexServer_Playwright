import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RolePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    addButton:    () => this.findElement({ get: '[icon=\'add\']', eq: 0 }),
    roleNameInput: () => this.findElement({ get: '#dialogSave', find: ['#nameInput', 'input'] }),
    saveButton:   () => this.findElement({ get: '#role', find: ['#dialogSave', '[role=\'button\']'], eq: 1 }),
    searchInput:  () => this.findElement({ get: '.search-input', find: ['input'] }),
    resultRole:   () => this.page.locator('dex-settings-role'),
    permissionCheckbox: (index: number) =>
      this.findElement({ get: '.layout.activities-container.settings-input', find: ['#checkboxContainer'], eq: index }),
  };

  async clickAddButton() {
    await this.elements.addButton().click();
  }

  async typeRoleNameInput(roleName: string) {
    await this.elements.roleNameInput().fill(roleName, { force: true });
  }

  async clickSaveButton() {
    await this.elements.saveButton().click();
  }

  async typeSearchInput(roleName: string) {
    const input = this.elements.searchInput();
    await input.click({ timeout: 40000 });
    await input.fill(roleName, { force: true });
  }

  async checkResultRole() {
    await expect(this.elements.resultRole()).toBeAttached();
  }

  async checkPermission() {
    for (let i = 0; i <= 7; i++) {
      await this.elements.permissionCheckbox(i).click();
    }
  }

  async deleteRole(roleName: string) {
    await this.typeSearchInput(roleName);
    await this.page.waitForTimeout(500);
    await this.elements.resultRole().first().click();
    await this.page.waitForTimeout(300);
    await this.page.locator('paper-icon-button[icon="delete"]').first().click({ force: true });
    await this.page.locator('paper-button[role="button"]').filter({ hasText: /Confirmar|Confirm/i }).first().click();
    await this.page.waitForTimeout(500);
  }
}
