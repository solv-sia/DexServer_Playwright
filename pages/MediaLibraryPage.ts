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