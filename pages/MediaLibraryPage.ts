import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from './BasePage';

export class MediaLibraryPage extends BasePage {
  private _cardCountBeforeDrop = 0;

  constructor(page: Page) {
    super(page);
  }

  private elements = {
    searchInput2: () => this.findElement({
      get: "paper-input[class='search-input']",
      find: ["input[placeholder='Búsqueda/Filtro'], input[placeholder='Search/Filter']"],
    }),
    addBtn:           () => this.page.locator("dex-fab-menu[icon-start='add']"),
    createFolderBtn:  () => this.findElement({ get: "dex-media-view.iron-selected", find: ["dex-fab-menu-item[icon='folder']"] }),
    inputFolderName:  () => this.findElement({ get: "dex-media-view.iron-selected", find: ["#dialogNewFolder", "iron-input.input-element", "input"] }),
    acceptFolderBtn:  () => this.page.locator("dex-media-view.iron-selected >> #dialogNewFolder >> paper-button").filter({ hasText: /aceptar|accept/i }),
    fileDropArea:     () => this.findElement({ get: "dex-media-list#dexMediaList", find: ["dex-file-drop"] }),
    media:            (name: string) => this.page.locator("dex-media-card[slot='card']").filter({ hasText: name }),
    closeBtn:         () => this.page.locator("paper-icon-button[title]").first(),
    mediaFormat:      () => this.page.locator("#dexMediaDetailPreview >> paper-icon-item.item-hover").filter({ hasText: /formato|format/i }).locator('span').filter({ hasNotText: /formato|format/i }),
    mediaDimension:   () => this.page.locator("#dexMediaDetailPreview >> paper-icon-item.item-hover").filter({ hasText: /dimensiones|dimensions/i }).locator('span').filter({ hasNotText: /dimensiones|dimensions/i }),
    mediaSize:        () => this.page.locator("#dexMediaDetailPreview >> paper-icon-item.item-hover").filter({ hasText: /tamaño|size/i }).locator('span').filter({ hasNotText: /tamaño|size/i }),
  };

  async typeSearchMediaInput2(ruta: string) {
    const input = this.elements.searchInput2();
    await input.clear();
    await input.fill(ruta, { force: true });
    await input.press('Enter');
  }

  async findBottomFolder(ruta: string) {
    if (!ruta) return;
    const subfolders = ruta.split('/');
    for (const folder of subfolders) {
      // Wait until the folder div appears in shadow DOM, then click it via JS
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
        if (el) el.click();
      }, folder);

      await this.page.waitForTimeout(300);
    }
  }

  async clickAddBtn() {
    await this.elements.addBtn().click();
  }

  async clickCreateFolderBtn() {
    await this.elements.createFolderBtn().click();
  }

  async nameFolder(folderName: string) {
    await this.elements.inputFolderName().fill(folderName);
  }

  async acceptCreateFolderBtn() {
    await this.elements.acceptFolderBtn().click();
  }

  // Simulates drag-and-drop file upload to the drop zone.
  // Files must be placed in the fixtures/ folder of the project.
  async dropFile(fileName: string) {
    // Capture card count BEFORE drop piercing shadow DOM, same traversal used in clickOnMedia
    this._cardCountBeforeDrop = await this.page.evaluate(() => {
      function findAllCards(root: Document | ShadowRoot): HTMLElement[] {
        const results: HTMLElement[] = [];
        results.push(...Array.from(root.querySelectorAll('dex-media-card[slot="card"]')) as HTMLElement[]);
        for (const el of Array.from(root.querySelectorAll('*'))) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) results.push(...findAllCards(sr));
        }
        return results;
      }
      return findAllCards(document).length;
    });

    const fixturePath = path.join(__dirname, '../fixtures', fileName);
    const fileContent = fs.readFileSync(fixturePath);
    const base64 = fileContent.toString('base64');

    await this.page.evaluate(async ({ base64Content, name }: { base64Content: string; name: string }) => {
      // Use fetch to decode base64 — far faster than char-by-char Uint8Array.from
      const resp = await fetch(`data:application/octet-stream;base64,${base64Content}`);
      const blob = await resp.blob();
      const file = new File([blob], name);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      function findInShadow(root: Document | ShadowRoot, selector: string): Element | null {
        const found = root.querySelector(selector);
        if (found) return found;
        for (const el of root.querySelectorAll('*')) {
          const shadow = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (shadow) {
            const r = findInShadow(shadow, selector);
            if (r) return r;
          }
        }
        return null;
      }

      const dropArea = findInShadow(document, 'dex-file-drop') as HTMLElement;
      if (!dropArea) throw new Error('dex-file-drop not found');

      dropArea.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
      dropArea.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
    }, { base64Content: base64, name: fileName });
  }

  async clickOnMedia(name: string) {
    const baseline = this._cardCountBeforeDrop;

    await this.page.waitForFunction(
      ({ mediaName, baseline }: { mediaName: string; baseline: number }) => {
        // querySelectorAll does NOT pierce shadow DOM — need manual traversal
        function findAllCards(root: Document | ShadowRoot): HTMLElement[] {
          const results: HTMLElement[] = [];
          results.push(...Array.from(root.querySelectorAll('dex-media-card[slot="card"]')) as HTMLElement[]);
          for (const el of Array.from(root.querySelectorAll('*'))) {
            const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
            if (sr) results.push(...findAllCards(sr));
          }
          return results;
        }
        function deepText(node: Node): string {
          let t = '';
          if ((node as Element).getAttribute) t += (node as Element).getAttribute('title') || '';
          const sr = (node as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) t += deepText(sr);
          for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === 3) t += child.textContent || '';
            else if (child.nodeType === 1) t += deepText(child);
          }
          return t;
        }
        const cards = findAllCards(document);
        if (cards.length > baseline) return true;
        return cards.some(c => deepText(c).includes(mediaName));
      },
      { mediaName: name, baseline },
      { timeout: 300000 }
    );

    await this.page.evaluate((mediaName: string) => {
      function findAllCards(root: Document | ShadowRoot): HTMLElement[] {
        const results: HTMLElement[] = [];
        results.push(...Array.from(root.querySelectorAll('dex-media-card[slot="card"]')) as HTMLElement[]);
        for (const el of Array.from(root.querySelectorAll('*'))) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) results.push(...findAllCards(sr));
        }
        return results;
      }
      function deepText(node: Node): string {
        let t = '';
        if ((node as Element).getAttribute) t += (node as Element).getAttribute('title') || '';
        const sr = (node as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
        if (sr) t += deepText(sr);
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === 3) t += child.textContent || '';
          else if (child.nodeType === 1) t += deepText(child);
        }
        return t;
      }
      const cards = findAllCards(document);
      // Try to find by name first, fallback to last card
      const match = cards.find(c => deepText(c).includes(mediaName));
      const target = match ?? cards[cards.length - 1];
      if (target) target.click();
      else throw new Error('No media cards found after upload');
    }, name);
  }

  async checkMediaFormat(expectedFormat: string) {
    await expect(this.elements.mediaFormat()).toContainText(expectedFormat);
  }

  async checkMediaDimension(expectedDimension: string) {
    await expect(this.elements.mediaDimension()).toContainText(expectedDimension);
  }

  async checkMediaSize(expectedSize: string) {
    await expect(this.elements.mediaSize()).toContainText(expectedSize);
  }

  async typeSizeInput(size: string) {
    const input = this.page.locator("vaadin-text-field[part='text-field'] input[part='value']").nth(0);
    await input.fill(size, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async typeDurationHourInput(hour: string) {
    const input = this.page.locator("paper-input#hour input[name='hour']");
    await input.fill(hour, { force: true });
  }

  async typeDurationMinuteInput(minute: string) {
    const input = this.page.locator("paper-input#min input[name='min']");
    await input.fill(minute, { force: true });
  }

  async typeDurationSecondInput(second: string) {
    const input = this.page.locator("paper-input#sec input[name='sec']");
    await input.fill(second, { force: true });
  }

  async removeAllTagsFromInput(containerLocator: ReturnType<typeof this.page.locator>) {
    const closeBtns = containerLocator.locator("paper-icon-button[icon='icons:close']");
    while (await closeBtns.count() > 0) {
      await closeBtns.first().click({ force: true });
      await this.page.waitForTimeout(100);
    }
  }

  async clearInclusionTags() {
    await this.removeAllTagsFromInput(this.page.locator("dex-textarea-tags#inclusionInput"));
  }

  async clearExclusionTags() {
    await this.removeAllTagsFromInput(this.page.locator("dex-textarea-tags#exclusionInput"));
  }

  async clearProductTags() {
    await this.removeAllTagsFromInput(this.page.locator("dex-product-combo"));
  }

  async clickBtnClearFromDateInput() {
    const container = this.page.locator("dex-date-picker.input-datepicker").nth(0);
    const clearIcon = container.locator("iron-icon[icon='cancel']");
    if (await clearIcon.count() > 0) await clearIcon.click({ force: true });
  }

  async clickBtnClearToDateInput() {
    const container = this.page.locator("dex-date-picker.input-datepicker").nth(1);
    const clearIcon = container.locator("iron-icon[icon='cancel']");
    if (await clearIcon.count() > 0) await clearIcon.click({ force: true });
  }

  async clearFromHourInput() {
    const input = this.page.locator("paper-input.flex.input").nth(0).locator("input[autocomplete='off']");
    await input.fill('', { force: true });
  }

  async clearToHourInput() {
    const input = this.page.locator("paper-input.flex.input").nth(1).locator("input[autocomplete='off']");
    await input.fill('', { force: true });
  }

  async clearFromHourRecurenceInput() {
    const input = this.page.locator("paper-input.flex.input").nth(2).locator("input[autocomplete='off']");
    await input.fill('', { force: true });
  }

  async clearToHourRecurenceInput() {
    const input = this.page.locator("paper-input.flex.input").nth(3).locator("input[autocomplete='off']");
    await input.fill('', { force: true });
  }

  async setEveryDaysCheckboxState(desiredState: boolean) {
    const checkbox = this.page.locator('.flex.day-checkbox').first();
    const isChecked = await checkbox.evaluate((el) => el.getAttribute('aria-checked') === 'true');
    if (isChecked !== desiredState) await checkbox.click({ force: true });
  }

  async setPOPCheckboxState(desiredState: boolean) {
    const checkbox = this.page.locator('.media-detail-list-data.paper-material').nth(0).locator('paper-checkbox');
    const isChecked = await checkbox.evaluate((el) => el.getAttribute('aria-checked') === 'true');
    if (isChecked !== desiredState) await checkbox.click({ force: true });
  }

  async getStatusSaveButton(): Promise<boolean> {
    const saveBtn = this.page.locator("[icon='save']");
    const ariaDisabled = await saveBtn.getAttribute('aria-disabled');
    return ariaDisabled !== 'true';
  }

  async clickSaveButton() {
    await this.page.locator("[icon='save']").click();
  }

  async clickCheckboxSelectAllPlaylist() {
    await this.page.locator('paper-checkbox').filter({ hasText: /seleccionar todo|select all/i }).nth(0).click({ force: true });
  }

  async clickNextButton() {
    await this.page.locator('paper-button').filter({ hasText: /siguiente|next/i }).first().click();
    await this.page.waitForTimeout(500);
  }

  async clickNextButton2() {
    await this.page.locator('paper-button').filter({ hasText: /siguiente|next/i }).nth(1).click();
    await this.page.waitForTimeout(500);
  }

  async clickOnAllCheckboxes() {
    const checkboxes = this.page.locator('paper-checkbox');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      const checked = await cb.evaluate((el) => el.getAttribute('aria-checked') === 'true');
      if (!checked) await cb.click({ force: true });
    }
  }

  async typeReplaceCombo(value: string) {
    const input = this.page.locator("vaadin-text-field[part='text-field'] input[part='value']").nth(1);
    await input.fill(value, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async typeNoReplaceCombo(value: string) {
    const input = this.page.locator("vaadin-text-field[part='text-field'] input[part='value']").nth(2);
    await input.fill(value, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async typeProductCombo(value: string) {
    const input = this.page.locator("vaadin-text-field[part='text-field'] input[part='value']").nth(3);
    await input.fill(value, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async clickConfirmButton() {
    await this.page.locator('paper-button').filter({ hasText: /confirmar|confirm/i }).last().click({ force: true });
    await this.page.waitForTimeout(2000);
  }

  async compareFullMessage(pattern: RegExp) {
    const text = await this.page.locator('paper-dialog').last().textContent();
    if (!pattern.test(text ?? '')) throw new Error(`Message does not match ${pattern}: "${text}"`);
  }

  async rightClickOnMedia(mediaName: string) {
    await this.page.evaluate((name: string) => {
      function findInShadow(root: Document | ShadowRoot, sel: string): HTMLElement | null {
        const found = root.querySelector(sel) as HTMLElement | null;
        if (found) return found;
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) { const r = findInShadow(sr, sel); if (r) return r; }
        }
        return null;
      }
      const card = findInShadow(document, `dex-media-card[slot='card'][title='${name}']`) ??
                   findInShadow(document, `[title='${name}']`);
      if (card) card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      else throw new Error(`Media card not found for right-click: ${name}`);
    }, mediaName);
  }

  async clickReplaceMedia() {
    await this.page.locator('paper-item').filter({ hasText: /reemplazar|replace/i }).first().click({ force: true });
    await this.page.waitForTimeout(2500);
  }

  async clickRemoveMedia() {
    await this.page.locator('paper-item').filter({ hasText: /quitar|remove/i }).first().click({ force: true });
    await this.page.waitForTimeout(1500);
  }

  async searchMediatoReplace2(mediaName: string) {
    const input = this.page.locator('#dexMediaReplaceDetail input[placeholder]').first();
    await input.fill(mediaName, { force: true });
    await input.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async findFolderForMediaReplace(folderName: string) {
    await this.page.locator('.folder-item, dex-folder-item').filter({ hasText: folderName }).first().click();
    await this.page.waitForTimeout(500);
  }

  async clickOnReplacementMedia(mediaName: string) {
    await this.page.locator('dex-media-card').filter({ hasText: mediaName }).first().click();
  }

  async clickContinueBtn() {
    await this.page.locator('paper-button').filter({ hasText: /continuar|continue/i }).first().click();
    await this.page.waitForTimeout(1000);
  }

  async clickSecondContinueBtn() {
    await this.page.locator('paper-button').filter({ hasText: /continuar|continue/i }).nth(1).click();
    await this.page.waitForTimeout(1000);
  }

  async clickSelectAllCheckBox() {
    await this.page.locator('paper-checkbox').filter({ hasText: /seleccionar todo|select all/i }).first().click({ force: true });
  }

  async clickPlaylistCheckbox(playlistName: string) {
    await this.page.locator('paper-checkbox').filter({ hasText: playlistName }).first().click({ force: true });
  }

  async clickConfirmBtn() {
    await this.page.locator('paper-button').filter({ hasText: /confirmar|confirm/i }).last().click({ force: true });
    await this.page.waitForTimeout(600);
  }

  async deleteMediaFromLibrary(mediaName: string) {
    await this.page.evaluate((name: string) => {
      function findInShadow(root: Document | ShadowRoot, sel: string): HTMLElement | null {
        const found = root.querySelector(sel) as HTMLElement | null;
        if (found) return found;
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) { const r = findInShadow(sr, sel); if (r) return r; }
        }
        return null;
      }
      const card = findInShadow(document, `dex-media-card[slot='card'][title='${name}']`) ??
                   findInShadow(document, `[title='${name}']`);
      if (card) card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      else throw new Error(`Media card not found: ${name}`);
    }, mediaName);
    await this.page.locator('paper-item').filter({ hasText: /eliminar|delete/i }).first().click({ force: true });
    await this.page.locator('paper-button[role="button"]').filter({ hasText: /Confirmar|Confirm|Aceptar|Accept/i }).first().click();
    await this.page.waitForTimeout(500);
  }

  async clickCloseBtn() {
    // The close button is inside #dexMediaDetail — scope search to that container
    await this.page.evaluate(() => {
      function allInShadow(root: Document | ShadowRoot, sel: string): HTMLElement[] {
        const result: HTMLElement[] = [];
        const found = root.querySelectorAll(sel);
        result.push(...Array.from(found) as HTMLElement[]);
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) result.push(...allInShadow(sr, sel));
        }
        return result;
      }
      // Look for paper-icon-button with title cerrar/close inside the detail panel
      const detail = document.querySelector('#dexMediaDetail') ?? document.querySelector('#dexMediaDetailPreview');
      const scope = detail ?? document;
      const buttons = allInShadow(scope as Document | ShadowRoot, 'paper-icon-button[title]');
      const closeBtn = buttons.find(b => /cerrar|close/i.test(b.getAttribute('title') ?? ''));
      if (closeBtn) closeBtn.click();
      else throw new Error('Close button not found in media detail panel');
    });
  }
}