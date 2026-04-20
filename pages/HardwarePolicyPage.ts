import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HardwarePolicyPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private base = () => this.page.locator("dex-hardware-control-view[name='hardware-control']");
  private dialog = () => this.base().locator('#dialogPolicy paper-dialog#dialog');

  private elements = {
    createBtn:       () => this.base().locator('.dex-fab #icon'),
    nameInput:       () => this.dialog().locator('paper-input').first().locator('input'),
    rebootInput:     () => this.dialog().locator("paper-input[type='time']").first().locator('input'),
    saveBtn:         () => this.dialog().locator('.buttons paper-button[title="Guardar"]'),
    searchbar:       () => this.base().locator('paper-input.search-input input'),
    firstPolicy:     () => this.base().locator('#table dex-policy-row.link').first(),
    deleteBtn:       () => this.base().locator('paper-dialog#dialog .policyBtn[icon="delete"]'),
    confirmDeleteBtn:() => this.base().locator('paper-dialog#dialogDelete paper-button[role="button"]').filter({ hasText: /Confirmar|Confirm/i }),
  };

  async clickOnCreateHardwarePolicy() { await this.elements.createBtn().click({ force: true }); }

  async nameHardwarePolicy(name: string) {
    await this.elements.nameInput().click({ force: true });
    await this.elements.nameInput().fill(name, { force: true });
  }

  async setRebootTime(time: string) {
    await this.elements.rebootInput().click({ force: true });
    await this.elements.rebootInput().fill(time, { force: true });
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
