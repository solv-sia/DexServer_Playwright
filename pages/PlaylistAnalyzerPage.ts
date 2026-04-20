import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PlaylistAnalyzerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    modal:         () => this.page.locator('#dexPlaylistAnalyzer'),
    title:         () => this.page.locator('#dexPlaylistAnalyzer span'),
    closeBtn:      () => this.page.locator("#dexPlaylistAnalyzer paper-icon-button[icon='close']").first(),
    playerModal:   () => this.page.locator("#dexNetworkDetail #dexPlaylistAnalyzer[view='player']"),
    scheduleModal: () => this.page.locator("#dexScheduleDetail #dexPlaylistAnalyzer[view='schedule']"),
  };

  async checkGroupViewPAIsOpened() {
    await expect(this.elements.modal()).toHaveAttribute('opened');
  }

  async checkPlayerViewPLAnalyzerIsOpened() {
    await expect(this.elements.playerModal()).toHaveAttribute('opened');
  }

  async checkScheduleViewPLAnalyzerIsOpened() {
    await expect(this.elements.scheduleModal()).toHaveAttribute('opened');
  }

  async checkPlaylistAnalyzerTitle(playlistName: string) {
    await expect(this.elements.title()).toContainText(playlistName);
  }

  async clickPlaylistAnalyzerCloseBtn() {
    await this.elements.closeBtn().click({ force: true });
  }
}
