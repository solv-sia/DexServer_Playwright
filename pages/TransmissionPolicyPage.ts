import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TransmissionPolicyPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private base   = () => this.page.locator("dex-transmission-view[name='transmission']");
  private dialog = () => this.base().locator('#dialogPolicy paper-dialog#dialog');

  private elements = {
    createBtn:       () => this.base().locator('.dex-fab'),
    nameInput:       () => this.dialog().locator('paper-input').first().locator('input'),
    blockInput:      () => this.dialog().locator("paper-input[type='time']").first().locator('input'),
    allowInput:      () => this.dialog().locator("paper-input[type='time']").nth(3).locator('input'),
    saveBtn:         () => this.dialog().locator('.buttons paper-button[title="Guardar"]'),
    searchbar:       () => this.base().locator('paper-input.search-input iron-input input'),
    firstPolicy:     () => this.base().locator("#table dex-policy-row[slot='row']").first(),
    deleteBtn:       () => this.base().locator('#dialog .policyBtn[icon="delete"]'),
    confirmDeleteBtn:() => this.base().locator('#dialogDelete paper-button[role="button"]').filter({ hasText: /Confirmar|Confirm/i }),
  };

  async clickOnCreateTRPolicyBtn() {
    await this.elements.createBtn().waitFor({ state: 'visible', timeout: 30000 });
    await this.elements.createBtn().dispatchEvent('click');
  }

  async nameTransmissionPolicy(name: string) {
    await this.dialog().waitFor({ state: 'visible', timeout: 20000 });
    await this.page.waitForTimeout(400);
    await this.elements.nameInput().fill(name, { force: true });
  }

  async setBlockTime(time: string) {
    await this.elements.blockInput().click({ force: true });
    await this.elements.blockInput().fill(time, { force: true });
  }

  async setAllowTime(time: string) {
    await this.elements.allowInput().click({ force: true });
    await this.elements.allowInput().fill(time, { force: true });
  }

  async clickOnSavePolicyBtn() { await this.elements.saveBtn().click(); }

  async searchPolicy(policyName: string) {
    await this.elements.searchbar().click();
    await this.elements.searchbar().fill(policyName);
    await this.elements.searchbar().press('Enter');
  }

  async deletePolicy(policyName: string) {
    await this.searchPolicy(policyName);
    await this.elements.firstPolicy().click();
    await this.elements.deleteBtn().click();
    await this.elements.confirmDeleteBtn().click();
  }
}
