import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    menuPlaylist: () => this.page.locator("[data-name='playlist']"),
    optionLayout: () => this.findElement({ get: "[icon='view-quilt']", eq: 0 }),
  };

  async clickMenuPlaylist() {
    await this.elements.menuPlaylist().click();
  }

  async clickOptionLayout() {
    await this.elements.optionLayout().click();
  }
}
