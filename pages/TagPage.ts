import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TagPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    addBtn: () => this.page.locator('dex-tag-view#tag .dex-fab iron-icon#icon'),
    nameInput: () => this.page.locator('dex-tag-view#tag paper-dialog#editTag paper-input.settings-input input'),
    saveBtn: () => this.page.locator('dex-tag-view#tag paper-dialog#editTag paper-button').filter({ hasText: /confirmar|confirm/i }),
  };

  async clickAddBtn() {
    const btn = this.elements.addBtn();
    await btn.waitFor({ state: 'attached' }); 
    await btn.waitFor({ state: 'visible' });  
    await btn.click(); 
  }

  async typeTagName(tagName: string) {
    await this.elements.nameInput().waitFor({ state: 'visible' });
    await this.elements.nameInput().scrollIntoViewIfNeeded();
    await this.elements.nameInput().click({ force: true });
    await this.elements.nameInput().fill(tagName, { force: true });
  }

  async clickSaveBtn() { await this.elements.saveBtn().click({ force: true }); }
}
