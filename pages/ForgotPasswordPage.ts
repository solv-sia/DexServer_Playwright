import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ForgotPasswordPage extends BasePage {
  private readonly msgs = [
    'Si el usuario es válido, recibirá un email con las instrucciones a seguir',
    'If the user is valid, you will receive an email with the instructions to follow',
  ];

  constructor(page: Page) {
    super(page);
  }

  private elements = {
    usernameInput: () => this.findElement({ get: '#username', find: ['input'] }),
    sendButton:    () => this.page.locator('.accept-btn.login-btn'),
    dialogPopUp:   () => this.page.locator('#dialogMsg'),
  };

  async typeUsername(username: string) {
    await this.elements.usernameInput().fill(username, { force: true });
  }

  async clickSendButton() {
    await this.elements.sendButton().click();
  }

  async readDialogPopUp() {
    const dialog = this.elements.dialogPopUp();
    await expect(dialog).toBeVisible();
    const text = await dialog.textContent() ?? '';
    const matched = this.msgs.some((msg) => text.includes(msg));
    if (!matched) {
      throw new Error(`Dialog text "${text}" did not match expected messages`);
    }
  }

  async forgotTestermation(username: string) {
    await this.typeUsername(username);
    await this.clickSendButton();
    await this.readDialogPopUp();
  }
}
