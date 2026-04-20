import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LayoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private layoutInput = (index: number) =>
    this.findElement({ get: '.number-input', eq: index }).locator('input');

  private elements = {
    addButton:       () => this.findElement({ get: "[icon='add']", find: ['#icon'], eq: 0 }),
    addFrameButton:  () => this.findElement({ get: "[icon='add']", find: ['#icon'], eq: 1 }),
    layout:          () => this.findElement({ get: '#layoutDetailTag', find: ['#frames'] }),
    inputLayoutName: () => this.findElement({ get: '.flex.input-name', find: ['input'] }),
    saveButton:      () => this.page.locator("[icon='save']"),
    overlapToggle:   () => this.page.locator('#overlapToggle'),
  };

  async clickAddButton() {
    await this.elements.addButton().click();
  }

  async searchLayout(name: string) {
    const input = this.page.locator('paper-input.search-input input, input[placeholder]').first();
    await input.fill(name, { force: true });
    await input.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async deleteLayout(name: string) {
    await this.searchLayout(name);
    await this.page.locator('.vertical.layout.center.layout-card').first().click();
    await this.page.waitForTimeout(300);
    await this.page.locator('paper-icon-button[icon="delete"]').first().click({ force: true });
    await this.page.locator('paper-button[role="button"]').filter({ hasText: /Aceptar|Accept|Confirmar|Confirm/i }).first().click();
    await this.page.waitForTimeout(500);
  }

  async clickSaveButton() {
    await this.elements.saveButton().click();
  }

  async clickOverlapToggle() {
    await this.elements.overlapToggle().click();
  }

  async clickAddFrameButton() {
    await this.elements.addFrameButton().click({ force: true });
  }

  async dblclickLayout() {
    await this.elements.layout().dblclick();
  }

  async setNameLayout(name: string) {
    await this.elements.inputLayoutName().fill(name, { force: true });
  }

  private async typeLayoutInput(index: number, value: number | string) {
    const input = this.layoutInput(index);
    await input.press('Control+a');
    await input.fill(String(value), { force: true });
    await this.page.waitForTimeout(1000);
  }

  async createLayout(config: {
    frameQty: number;
    frameOrientation: string;
    layoutDisposition: string;
  }) {
    const { frameQty, frameOrientation, layoutDisposition } = config;
    let layoutWidth = 0, layoutHigh = 0, frameWidth = 0, frameHigh = 0;

    switch (frameOrientation + layoutDisposition) {
      case 'vv': frameWidth = 1080; frameHigh = 1920; layoutHigh = frameHigh * frameQty; layoutWidth = frameWidth; break;
      case 'vh': frameWidth = 1080; frameHigh = 1920; layoutHigh = frameHigh; layoutWidth = frameWidth * frameQty; break;
      case 'hv': frameWidth = 1920; frameHigh = 1080; layoutHigh = frameHigh * frameQty; layoutWidth = frameWidth; break;
      case 'hh': frameWidth = 1920; frameHigh = 1080; layoutHigh = frameHigh; layoutWidth = frameWidth * frameQty; break;
      default: throw new Error(`Unrecognized layout config: ${frameOrientation}${layoutDisposition}`);
    }

    // index 4 = layout width, 5 = layout height, 0 = frame width, 1 = frame height
    await this.typeLayoutInput(4, layoutWidth);
    await this.typeLayoutInput(5, layoutHigh);
    await this.typeLayoutInput(0, frameWidth);
    await this.typeLayoutInput(1, frameHigh);

    let positionX = 0, positionY = 0;
    for (let counter = 1; counter < frameQty; counter++) {
      await this.clickAddFrameButton();
      await this.dblclickLayout();

      if (layoutDisposition === 'v') {
        positionY = counter * frameHigh;
        await this.typeLayoutInput(2, positionX);
        await this.typeLayoutInput(3, positionY);
      } else {
        positionX = counter * frameWidth;
        await this.typeLayoutInput(2, positionX);
        await this.typeLayoutInput(3, positionY);
      }
      await this.typeLayoutInput(0, frameWidth);
      await this.typeLayoutInput(1, frameHigh);
    }
  }
}
