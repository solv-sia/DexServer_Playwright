import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    usernameInput: () => this.findElement({ get: '#username', find: ['input'] }),
    passwordInput: () => this.findElement({ get: '#password', find: ['input'] }),
    loginButton:   () => this.page.locator('.accept-btn.login-btn'),
    forgotButton:  () => this.page.locator('.forgot-btn.login-btn'),
    titlePage:     () => this.findElement({ get: '#dexHeader', find: ['#pageTitle'] }),
  };

  async typeUsername(username: string) {
    await this.elements.usernameInput().fill(username, { force: true });
  }

  async typePassword(password: string) {
    await this.elements.passwordInput().fill(password, { force: true });
  }

  async clickLogin() {
    await this.elements.loginButton().click({ force: true });
  }

  async clickForgotBtn() {
    await this.elements.forgotButton().click();
  }

  async verifyDashboard() {
    await expect(this.elements.titlePage()).toContainText('Dashboard');
  }

  async login(userName: string, password: string, verify = false) {
    await this.elements.usernameInput().waitFor({ state: 'visible', timeout: 90000 });
    await this.typeUsername(userName);
    await this.typePassword(password);
    await this.clickLogin();
    // Wait for spinner to disappear (app fully loaded). Usar el selector específico
    // para evitar strict mode violation — hay múltiples #main en la app.
    await expect(this.page.locator('#dexloader #main')).toHaveCSS('display', 'none', { timeout: 60000 });
    if (verify) {
      await this.verifyDashboard();
    }
  }
}
