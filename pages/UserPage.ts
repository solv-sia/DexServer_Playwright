import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class UserPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private dialogInput = (index: number) =>
    this.findElement({ get: '#dialogSave', find: ['#container', 'input'], eq: index });

  private elements = {
    addButton:       () => this.findElement({ get: '[icon=\'add\']', find: ['#icon'], eq: 0 }),
    userInput:       () => this.dialogInput(0),
    nameInput:       () => this.dialogInput(1),
    emailInput:      () => this.dialogInput(2),
    passwordInput:   () => this.dialogInput(4),
    repeatPwdInput:  () => this.dialogInput(5),
    customerSelect:  () => this.page.locator('#customerMenu'),
    roleSelect:      () => this.page.locator('#tagInput'),
    confirmButton:   () => this.page.locator('paper-button').filter({ hasText: /Confirm/i }),
  };

  async clickAddButton() {
    await this.elements.addButton().click();
  }

  async typeUser(user: string) {
    await this.elements.userInput().fill(user);
  }

  async typeName(name: string) {
    await this.elements.nameInput().fill(name, { force: true });
  }

  async typeEmailInput(email: string) {
    await this.elements.emailInput().fill(email, { force: true });
  }

  async typePassword(password: string) {
    await this.elements.passwordInput().fill(password, { force: true });
  }

  async typeRepeatPassword(password: string) {
    await this.elements.repeatPwdInput().fill(password, { force: true });
  }

  async selectBottomCustomer(clientName: string) {
    const input = this.elements.customerSelect().locator('input');
    await input.click({ force: true });
    await input.clear();
    await input.fill(clientName, { force: true });
    await input.press('ArrowUp');
    await input.press('Enter');
  }

  async selectRole(roleName: string) {
    const input = this.elements.roleSelect().locator('input');
    await input.click({ force: true });
    await input.clear();
    await input.fill(roleName, { force: true });
    await input.press('ArrowUp');
    await input.press('Enter');
  }

  async clickConfirmButton() {
    await this.elements.confirmButton().click();
  }
}
