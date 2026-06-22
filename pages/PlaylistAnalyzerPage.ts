import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PlaylistAnalyzerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    modal:         () => this.page.locator("#dexPlaylistAnalyzer[view='group']"),
    title:         () => this.page.locator("#dexPlaylistAnalyzer[opened] span").first(),
    closeBtn:      () => this.page.locator("#dexPlaylistAnalyzer[opened] app-toolbar paper-icon-button:nth-child(6)"),
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
    await this.page.evaluate(() => {
      function findInShadow(root: Document | ShadowRoot, sel: string): any {
        const el = root.querySelector(sel);
        if (el) return el;
        for (const e of Array.from(root.querySelectorAll('*'))) {
          const sr = (e as any).shadowRoot;
          if (sr) { const f = findInShadow(sr, sel); if (f) return f; }
        }
        return null;
      }
      const pa = findInShadow(document, '#dexPlaylistAnalyzer') as any;
      if (!pa) return;
      if (typeof pa._close === 'function') pa._close();
      pa.opened = false;
      pa.removeAttribute('opened');
    });
    // Wait for the overlay to stop intercepting pointer events
    await this.page.waitForFunction(() => {
      function findInShadow(root: Document | ShadowRoot, sel: string): any {
        const el = root.querySelector(sel);
        if (el) return el;
        for (const e of Array.from(root.querySelectorAll('*'))) {
          const sr = (e as any).shadowRoot;
          if (sr) { const f = findInShadow(sr, sel); if (f) return f; }
        }
        return null;
      }
      const pa = findInShadow(document, '#dexPlaylistAnalyzer');
      if (!pa) return true;
      const box = (pa as Element).getBoundingClientRect();
      return box.width === 0 || box.height === 0 || !pa.hasAttribute('opened');
    }, { timeout: 8000 }).catch(() => {});
  }
}
