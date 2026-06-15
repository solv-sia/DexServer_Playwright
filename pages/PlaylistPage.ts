import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PlaylistPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    addButton:           () => this.findElement({ get: "[icon-start='add']", find: ['#paperFab'], eq: 0 }),
    theaterslistButton:  () => this.findElement({ get: "[icon='theaters']", find: ['#paperFab'] }),
    searchLayoutInput:   () => this.findElement({ get: '#searchLayout', find: ['input'] }),
    resultingLayout:     () => this.page.locator('.vertical.layout.center.layout-card'),
    confirmButton:       () => this.page.locator("[dialog-confirm='']").nth(1),
    namePlaylistInput:   () => this.page.locator('.flex.input-name >> input[placeholder]').filter({ hasText: '' }),
    saveButton:          () => this.page.locator("[icon='save']"),
    searchMediaInput:    () => this.page.locator('#dexPlaylistDetail >> #dexComponentSelector >> input[placeholder]').filter({ hasText: '' }),
    channels:            () => this.page.locator('.horizontal.layout.flex.media-container'),
    condicionalTab:      () => this.page.getByRole('tab', { name: 'Condicional' }).first(),
    mediaInChannel:      (channel: number, name: string) =>
      this.page.locator('.horizontal.layout.flex.media-container').nth(channel - 1).locator(`div[title='${name}']`),
    mediaInChannelPos:   (cp: string) => this.page.locator(`div[data-id='${cp}']`),
    searchPlaylistInput: () => this.findElement({ get: '#dexPlaylistList', find: ['.search-input', 'input'] }),
    resultingPlaylist:   () => this.findElement({ get: '#dexPlaylistList', find: ["div[slot='row']"], eq: 0 }),
    fromHourInput:       () => this.findElement({ get: 'paper-input.flex.input', eq: 0, find: ["input[autocomplete='off']"] }),
    toHourInput:         () => this.findElement({ get: 'paper-input.flex.input', eq: 1, find: ["input[autocomplete='off']"] }),
    fromHourRecurrence:  () => this.findElement({ get: 'paper-input.flex.input', eq: 2, find: ["input[autocomplete='off']"] }),
    toHourRecurrence:    () => this.findElement({ get: 'paper-input.flex.input', eq: 3, find: ["input[autocomplete='off']"] }),
    fromDateInput:       () => this.findElement({ get: 'dex-date-picker.flex.input', eq: 0, find: ["paper-input[aria-disabled='false']"] }),
    toDateInput:         () => this.findElement({ get: 'dex-date-picker.flex.input', eq: 1, find: ["paper-input[aria-disabled='false']"] }),
    todayButtonFrom:     () => this.findElement({ get: 'dex-date-picker.flex.input', eq: 0, find: ['div[today=""]'] }),
    todayButtonTo:       () => this.findElement({ get: 'dex-date-picker.flex.input', eq: 1, find: ['div[today=""]'] }),
    everyDaysCheckbox:   () => this.findElement({ get: '.flex.day-checkbox', eq: 0 }),
    inclusionTagInput:   () => this.findElement({ get: '#inclusionInput', find: ['#tagInput', '#input', 'input[aria-labelledby]'] }),
    exclusionTagInput:   () => this.findElement({ get: '#exclusionInput', find: ['#tagInput', '#input', 'input[aria-labelledby]'] }),
  };

  async clickAddButton() { await this.elements.addButton().click(); }
  async clickTheaterslistButton() { await this.elements.theaterslistButton().click(); }
  async clickResultingLayout() { await this.elements.resultingLayout().click(); }
  async clickConfirmButton() { await this.elements.confirmButton().click({ force: true }); }
  async clickSaveButton() { await this.elements.saveButton().click(); }
  async clickCondicionalTab() { await this.elements.condicionalTab().click(); }
  async clickEveryDaysCheckbox() { await this.elements.everyDaysCheckbox().click(); }
  async clickFromDateInput() { await this.elements.fromDateInput().click(); }
  async clickToDateInput() { await this.elements.toDateInput().click(); }
  async clickTodayButtonFrom() { await this.elements.todayButtonFrom().click(); }
  async clickTodayButtonTo() { await this.elements.todayButtonTo().click(); }

  async typeSearchLayoutInput(layout: string) {
    await this.elements.searchLayoutInput().fill(layout, { force: true });
  }

  async typeNamePlaylistInput(name: string) {
    await this.elements.namePlaylistInput().click();
    await this.elements.namePlaylistInput().fill(name, { force: true });
  }

  async typeFromHourInput(from: string) {
    await this.elements.fromHourInput().click();
    await this.elements.fromHourInput().fill(from, { force: true });
  }

  async typeToHourInput(to: string) {
    await this.elements.toHourInput().click();
    await this.elements.toHourInput().fill(to, { force: true });
  }

  async typeFromHourRecurrenceInput(from: string) {
    await this.elements.fromHourRecurrence().click();
    await this.elements.fromHourRecurrence().fill(from, { force: true });
  }

  async typeToHourRecurrenceInput(to: string) {
    await this.elements.toHourRecurrence().click();
    await this.elements.toHourRecurrence().fill(to, { force: true });
  }

  async assingInclusionTagInput(tag: string) {
    await this.elements.inclusionTagInput().click();
    await this.elements.inclusionTagInput().fill(tag, { force: true });
    await this.elements.inclusionTagInput().press('Enter');
  }

  async assingExclusionTagInput(tag: string) {
    await this.elements.exclusionTagInput().click();
    await this.elements.exclusionTagInput().fill(tag, { force: true });
    await this.elements.exclusionTagInput().press('Enter');
  }

  async buscarRuta(ruta: string) {
    const input = this.elements.searchMediaInput();
    // dispatchEvent bypasses visibility checks for shadow-DOM inputs (reliable after drag-and-drop resets the component)
    await input.dispatchEvent('click');
    await input.fill('', { force: true });
    await input.fill(ruta, { force: true });
    await input.press('Enter');
  }

  async ubicarSubcarpetaFinal(ruta: string) {
    if (!ruta) return;
    const subfolders = ruta.split('/');
    for (let i = 0; i < subfolders.length; i++) {
      const folder = subfolders[i];
      await this.page.waitForFunction((title: string) => {
        function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
          const found = root.querySelector(sel);
          if (found) return found;
          for (const el of root.querySelectorAll('*')) {
            const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
            if (sr) { const r = findInShadow(sr, sel); if (r) return r; }
          }
          return null;
        }
        return !!findInShadow(document, `div[title='${title}']`);
      }, folder, { timeout: 10000 });

      await this.page.evaluate((title: string) => {
        function findInShadow(root: Document | ShadowRoot, sel: string): HTMLElement | null {
          const found = root.querySelector(sel) as HTMLElement | null;
          if (found) return found;
          for (const el of root.querySelectorAll('*')) {
            const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
            if (sr) { const r = findInShadow(sr, sel); if (r) return r; }
          }
          return null;
        }
        const el = findInShadow(document, `div[title='${title}']`);
        if (el) {
          el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          el.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
          el.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));
        }
      }, folder);

      // Wait for next subfolder to appear, or for media items if this is the last folder
      const nextFolder = subfolders[i + 1];
      if (nextFolder) {
        await this.page.waitForFunction((title: string) => {
          function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
            const found = root.querySelector(sel);
            if (found) return found;
            for (const el of root.querySelectorAll('*')) {
              const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
              if (sr) { const r = findInShadow(sr, sel); if (r) return r; }
            }
            return null;
          }
          return !!findInShadow(document, `div[title='${title}']`);
        }, nextFolder, { timeout: 8000 }).catch(() => {});
      } else {
        // Last folder: wait specifically for media cards in the selector (not channel items)
        await this.page.waitForFunction(() => {
          function findAll(root: Document | ShadowRoot, sel: string): Element[] {
            const results = Array.from(root.querySelectorAll(sel));
            for (const el of root.querySelectorAll('*')) {
              const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
              if (sr) results.push(...findAll(sr, sel));
            }
            return results;
          }
          return findAll(document, 'dex-media-card[slot="card"]').length > 0;
        }, { timeout: 15000 }).catch(() => {});
      }
    }
  }

  async moveMediaToChannel(channel: number, mediaName: string) {
    await this.page.waitForFunction((name: string) => {
      function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
        const found = root.querySelector(sel);
        if (found) return found;
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) { const r = findInShadow(sr, sel); if (r) return r; }
        }
        return null;
      }
      return !!(findInShadow(document, `[title="${name}"]`) || findInShadow(document, `[title*="${name}"]`));
    }, mediaName, { timeout: 25000 });

    const beforeCount = await this.page.locator(`[data-id^="${channel}-"]`).count();
    const expectedId = `${channel}-${beforeCount}`;

    // Try native dragTo first (fires real HTML5 drag events so DataTransfer is readable on drop)
    const sourceLocator = this.page.locator(`[title="${mediaName}"]`)
      .or(this.page.locator(`[title*="${mediaName}"]`)).first();
    const destLocator = this.page.locator('.horizontal.layout.flex.media-container').nth(channel - 1);
    await sourceLocator.dragTo(destLocator, { force: true });

    // Wait for the channel to reflect the new item; if it doesn't arrive, fall back to
    // synthetic drop which injects the Polymer __data.media object directly.
    const appeared = await this.page.locator(`[data-id="${expectedId}"]`)
      .waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);

    if (!appeared) {
      await this.page.evaluate(({ channel, mediaName }: { channel: number; mediaName: string }) => {
        function findInShadow(root: Document | ShadowRoot, selector: string): Element | null {
          const found = root.querySelector(selector);
          if (found) return found;
          for (const el of root.querySelectorAll('*')) {
            const shadow = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
            if (shadow) { const r = findInShadow(shadow, selector); if (r) return r; }
          }
          return null;
        }
        function findAllInShadow(root: Document | ShadowRoot, selector: string): HTMLElement[] {
          const results: HTMLElement[] = [];
          results.push(...Array.from(root.querySelectorAll(selector)) as HTMLElement[]);
          for (const el of root.querySelectorAll('*')) {
            const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
            if (sr) results.push(...findAllInShadow(sr, selector));
          }
          return results;
        }
        const mediaCard = findInShadow(document, `[title="${mediaName}"]`) as HTMLElement | null;
        if (!mediaCard) return;
        type PolymerEl = HTMLElement & { __data?: { media?: unknown }; __dataHost?: { __data?: { media?: unknown } } };
        let el: PolymerEl | null = mediaCard as PolymerEl;
        let mediaObj: unknown = null;
        while (el && !mediaObj) {
          mediaObj = el.__data?.media ?? el.__dataHost?.__data?.media ?? null;
          el = (el.parentElement as PolymerEl) ?? ((el.getRootNode() as ShadowRoot)?.host as PolymerEl) ?? null;
        }
        if (!mediaObj) return;
        const channels = findAllInShadow(document, '.horizontal.layout.flex.media-container');
        const dest = channels[channel - 1];
        if (!dest) return;
        const dt = new DataTransfer();
        dt.setData('text/plain', JSON.stringify([mediaObj]));
        dest.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
      }, { channel, mediaName });

      await this.page.locator(`[data-id="${expectedId}"]`)
        .waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    }
  }

  private async clickMediaInChannelPos(channel: number, position: number) {
    const cp = `${channel}-${position - 1}`;
    await this.elements.mediaInChannelPos(cp).click();
  }

  private async assingCondEveryDays(channel: number, position: number) {
    await this.clickMediaInChannelPos(channel, position);
    await this.clickCondicionalTab();
    await this.clickEveryDaysCheckbox();
  }

  private async assingCondDateFromTo(channel: number, position: number, from: string, to: string) {
    await this.clickMediaInChannelPos(channel, position);
    await this.clickCondicionalTab();
    await this.typeFromHourInput(from);
    await this.page.waitForTimeout(1000);
    await this.typeToHourInput(to);
    await this.clickFromDateInput();
    await this.page.waitForTimeout(1000);
    await this.clickTodayButtonFrom();
    await this.page.waitForTimeout(2000);
    await this.clickToDateInput();
    await this.page.waitForTimeout(1000);
    await this.clickTodayButtonTo();
  }

  private async assingCondRecurrence(channel: number, position: number, from: string, to: string) {
    await this.clickMediaInChannelPos(channel, position);
    await this.clickCondicionalTab();
    await this.typeFromHourRecurrenceInput(from);
    await this.page.waitForTimeout(1000);
    await this.typeToHourRecurrenceInput(to);
  }

  private async assingCondInclusionTag(channel: number, position: number, tag: string) {
    await this.clickMediaInChannelPos(channel, position);
    await this.clickCondicionalTab();
    await this.assingInclusionTagInput(tag);
  }

  private async assingCondExclusionTag(channel: number, position: number, tag: string) {
    await this.clickMediaInChannelPos(channel, position);
    await this.clickCondicionalTab();
    await this.assingExclusionTagInput(tag);
  }

  async searchPlaylist(playlistName: string) {
    // dex-playlist-list is inside shadow DOM so #dexPlaylistList fails as a CSS anchor.
    // Use ARIA role which pierces shadow boundaries.
    const searchInput = this.page.getByRole('searchbox').first();
    await searchInput.click({ force: true });
    await searchInput.fill('');
    await searchInput.fill(playlistName);
    await searchInput.press('Enter');
    await this.page.waitForTimeout(800);
  }

  async clickResultingPlaylist() {
    await this.elements.resultingPlaylist().click();
    await this.page.locator('.horizontal.layout.flex.media-container').first()
      .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  async clickMediaInchannelInPosition(channel: number, position: number) {
    const cp = `${channel}-${position - 1}`;
    await this.elements.mediaInChannelPos(cp).click();
  }

  async verifyMediaNotInPlaylist(mediaName: string) {
    const count = await this.page.evaluate((name: string) => {
      function findAll(root: Document | ShadowRoot, sel: string): Element[] {
        const results = Array.from(root.querySelectorAll(sel));
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) results.push(...findAll(sr, sel));
        }
        return results;
      }
      return findAll(document, `[title="${name}"]`).length;
    }, mediaName);
    if (count > 0) throw new Error(`Media "${mediaName}" still present in playlist (${count} occurrences)`);
  }

  async verifyEqualMediaTitle(name: string) {
    // After clicking a timeline element the properties panel shows the media name (without extension).
    const baseName = name.replace(/\.[^.]+$/, ''); // "pandas 3.jpg" → "pandas 3"
    // The panel title element is visible after selection; check for it by text
    await this.page.getByText(baseName, { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async deletePlaylist(playlistName: string) {
    await this.searchPlaylist(playlistName);
    await this.elements.resultingPlaylist().click();
    await this.page.locator('#dexPlaylistDetail paper-icon-button[icon="delete"]').click();
    await this.page.locator('paper-button[role="button"]').filter({ hasText: /Aceptar|Accept/i }).first().click();
    await this.page.waitForTimeout(500);
  }

  async assingMediaTochannels(config: { medias: string[] }) {
    await this.moveMediaToChannel(1, config.medias[0]);
    await this.assingCondDateFromTo(1, 1, '18:00', '19:00');
    await this.moveMediaToChannel(1, config.medias[1]);
    await this.assingCondEveryDays(1, 2);
    await this.moveMediaToChannel(1, config.medias[2]);
    await this.assingCondRecurrence(1, 3, '18:00', '19:00');
    await this.moveMediaToChannel(2, config.medias[3]);
    await this.assingCondInclusionTag(2, 1, 'REPRODUCIR');
    await this.moveMediaToChannel(2, config.medias[4]);
    await this.assingCondExclusionTag(2, 2, 'NO REPRODUCIR');
  }
}
