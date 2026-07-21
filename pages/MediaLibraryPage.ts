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
    for (let i = 0; i < subfolders.length; i++) {
      const folder = subfolders[i];

      // Atomic: find, scroll into view, and click the folder in the same poll.
      await this.page.waitForFunction((title: string) => {
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
        if (!el) return false;
        el.scrollIntoView({ block: 'center' });
        el.click();
        return true;
      }, folder, { timeout: 15000 });

      // After clicking, wait for next subfolder or for media cards to appear.
      // Retry the click if cards don't appear — server load after propagation can delay response.
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
        }, nextFolder, { timeout: 10000 }).catch(() => {});
      } else {
        // Wait up to 20s for cards; if none appear, re-click and wait again (handles busy server).
        const hasCards = await this.page.waitForFunction(() => {
          function findAll(root: Document | ShadowRoot, sel: string): Element[] {
            const results = Array.from(root.querySelectorAll(sel));
            for (const el of root.querySelectorAll('*')) {
              const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
              if (sr) results.push(...findAll(sr, sel));
            }
            return results;
          }
          return findAll(document, 'dex-media-card[slot="card"]').length > 0;
        }, { timeout: 20000 }).then(() => true).catch(() => false);

        if (!hasCards) {
          // Re-click the folder (initial click may have only expanded the tree node).
          await this.page.waitForFunction((title: string) => {
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
            if (!el) return false;
            el.scrollIntoView({ block: 'center' });
            el.click();
            return true;
          }, folder, { timeout: 5000 }).catch(() => {});

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
          }, { timeout: 20000 }).catch(() => {});
        }
      }
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

    // Clicking inside waitForFunction causes a hash navigation (#!/media → #!/media/ID)
    // which fires Page.frameNavigated in CDP. Playwright restarts the waitForFunction poll,
    // ignoring the returned `true`, causing an infinite retry loop.
    // Fix: separate detection (waitForFunction, no click) from clicking (evaluate, one-shot).

    // Step 1: Wait until a VISIBLE card containing the media name is on screen.
    // Checks getBoundingClientRect > 0 to skip stale/hidden cards that exist in the
    // DOM but have no visual presence. deepText is only computed for visible cards.
    await this.page.waitForFunction(
      ({ mediaName, baseline }: { mediaName: string; baseline: number }) => {
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
          let t = (node as Element).getAttribute?.('title') ?? '';
          const sr = (node as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) t += deepText(sr);
          for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === 3) t += child.textContent ?? '';
            else if (child.nodeType === 1) t += deepText(child);
          }
          return t;
        }
        const cards = findAllCards(document);
        if (cards.length === 0) return false;
        // Only consider visible cards (rect.width > 0)
        const visible = cards.filter(c => (c as HTMLElement).getBoundingClientRect().width > 0);
        if (visible.some(c => deepText(c).includes(mediaName))) return true;
        // Fallback for newly dropped files (dropFile sets baseline > 0)
        if (baseline > 0 && cards.length > baseline) return true;
        return false;
      },
      { mediaName: name, baseline },
      { timeout: 30000 }
    );

    // Step 2: Among visible matching cards, pick the one where mediaName appears earliest
    // in deepText (that card's OWN name is mediaName; other cards merely reference it later).
    // Return center coordinates and click via page.mouse.click() for a real browser click
    // that activates Polymer pointer/mouse event handlers.
    const coords = await this.page.evaluate(
      ({ mediaName, baseline }: { mediaName: string; baseline: number }) => {
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
          let t = (node as Element).getAttribute?.('title') ?? '';
          const sr = (node as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) t += deepText(sr);
          for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === 3) t += child.textContent ?? '';
            else if (child.nodeType === 1) t += deepText(child);
          }
          return t;
        }
        const cards = findAllCards(document);

        // Fallback for newly dropped files
        if (baseline > 0 && cards.length > baseline) {
          const rect = cards[cards.length - 1].getBoundingClientRect();
          if (rect.width > 0) return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }

        // Only visible cards; sort by earliest occurrence to pick the card whose OWN name
        // is mediaName (not a card that merely references it, e.g. "bound" → "madre").
        const matching = cards
          .filter(c => {
            const rect = (c as HTMLElement).getBoundingClientRect();
            return rect.width > 0 && deepText(c).includes(mediaName);
          });
        if (matching.length === 0) return null;
        matching.sort((a, b) => deepText(a).indexOf(mediaName) - deepText(b).indexOf(mediaName));
        const rect = (matching[0] as HTMLElement).getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      },
      { mediaName: name, baseline }
    );

    if (coords) {
      await this.page.mouse.click(coords.x, coords.y);
    }
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

  async removeAllTagsFromInput(containerSelector: string) {
    // The container (e.g. dex-textarea-tags#inclusionInput) lives inside another
    // shadow root, so document.querySelector() cannot find it. We must first
    // recurse through all shadow roots to locate it, then search within IT for
    // paper-icon-button[icon='icons:close'] close buttons (also shadow-rooted).
    await this.page.waitForTimeout(500); // allow chips to render
    for (let attempt = 0; attempt < 25; attempt++) {
      const remaining = await this.page.evaluate((sel: string) => {
        function findInShadow(root: Document | ShadowRoot | Element, selector: string): Element | null {
          const found = (root as Element).querySelector?.(selector) ?? null;
          if (found) return found;
          for (const el of Array.from(root.querySelectorAll('*'))) {
            const sr = (el as any).shadowRoot as ShadowRoot | null;
            if (sr) { const r = findInShadow(sr, selector); if (r) return r; }
          }
          return null;
        }
        function searchShadow(root: Element | ShadowRoot): HTMLElement[] {
          const results: HTMLElement[] = [];
          for (const el of Array.from(root.querySelectorAll('*'))) {
            const e = el as HTMLElement;
            // dex-tag-item close buttons are paper-icon-button with class="icon" (no icon= attribute)
            if (e.tagName?.toLowerCase() === 'paper-icon-button' && e.classList?.contains('icon')) {
              results.push(e);
            }
            if ((e as any).shadowRoot) results.push(...searchShadow((e as any).shadowRoot));
          }
          return results;
        }
        const container = findInShadow(document, sel);
        if (!container) return -1; // container not found
        const buttons = [...searchShadow(container as Element)];
        if ((container as any).shadowRoot) buttons.push(...searchShadow((container as any).shadowRoot));
        if (buttons.length === 0) return 0;
        buttons[0].click();
        return buttons.length;
      }, containerSelector);
      if (remaining <= 0) break; // 0 = no more chips, -1 = container not found
      await this.page.waitForTimeout(400);
    }
  }

  async clearInclusionTags() {
    await this.removeAllTagsFromInput("dex-textarea-tags#inclusionInput");
  }

  async clearExclusionTags() {
    await this.removeAllTagsFromInput("dex-textarea-tags#exclusionInput");
  }

  async clearProductTags() {
    await this.removeAllTagsFromInput("dex-product-combo");
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
    const timeInputs = this.page.locator("paper-input[type='time']");
    if (await timeInputs.count() < 1) return;
    const input = timeInputs.nth(0).locator("input[autocomplete='off']");
    await input.fill('', { force: true });
  }

  async clearToHourInput() {
    const timeInputs = this.page.locator("paper-input[type='time']");
    if (await timeInputs.count() < 2) return;
    const input = timeInputs.nth(1).locator("input[autocomplete='off']");
    await input.fill('', { force: true });
  }

  async clearFromHourRecurenceInput() {
    const timeInputs = this.page.locator("paper-input[type='time']");
    if (await timeInputs.count() < 3) return;
    const input = timeInputs.nth(2).locator("input[autocomplete='off']");
    await input.fill('', { force: true });
  }

  async clearToHourRecurenceInput() {
    const timeInputs = this.page.locator("paper-input[type='time']");
    if (await timeInputs.count() < 4) return;
    const input = timeInputs.nth(3).locator("input[autocomplete='off']");
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
    await this.page.locator("[icon='save']").dispatchEvent('click');
  }

  async clickCheckboxSelectAllPlaylist() {
    // Hay múltiples "Seleccionar Todos" en el DOM (en diálogos ocultos).
    // El filtro visible:true apunta solo al del diálogo activo (rect > 0).
    const cb = this.page.locator('paper-checkbox')
      .filter({ hasText: /seleccionar todo|select all/i })
      .filter({ visible: true })
      .first();
    await cb.waitFor({ state: 'visible', timeout: 15000 });
    const isChecked = await cb.evaluate((el: any) => el.getAttribute('aria-checked') === 'true');
    if (!isChecked) await cb.dispatchEvent('click');
  }

  async clickNextButton() {
    // El DOM tiene múltiples "Siguiente" en diálogos ocultos (disabled, rect=0).
    // El filtro visible:true apunta solo al del diálogo activo.
    const btn = this.page.locator('paper-button')
      .filter({ hasText: /siguiente|next/i })
      .filter({ visible: true })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  async clickNextButton2() {
    const btn = this.page.locator('paper-button')
      .filter({ hasText: /siguiente|next/i })
      .filter({ visible: true })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  async clickOnAllCheckboxes() {
    // Esperar a que aparezca el paso 2 del wizard (al menos un checkbox visible y sin marcar)
    await this.page.waitForFunction(() => {
      function findAll(root: Document | ShadowRoot, sel: string): Element[] {
        const r = Array.from(root.querySelectorAll(sel));
        for (const el of Array.from(root.querySelectorAll('*'))) {
          const sr = (el as any).shadowRoot as ShadowRoot | null;
          if (sr) r.push(...findAll(sr, sel));
        }
        return r;
      }
      return findAll(document, 'paper-checkbox').some(
        c => c.getAttribute('aria-checked') === 'false' &&
             (c as HTMLElement).getBoundingClientRect().width > 0
      );
    }, { timeout: 15000 });

    // Solo checkboxes visibles (rect > 0) — excluye los de diálogos ocultos y paneles colapsados
    const checkboxes = this.page.locator('paper-checkbox').filter({ visible: true });
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      const checked = await cb.evaluate((el: any) => el.getAttribute('aria-checked') === 'true');
      if (!checked) await cb.dispatchEvent('click');
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
    // El texto de confirmación está dentro del shadow DOM de componentes hijo del paper-dialog.
    // d.textContent no lo ve. Se usa deepText para traversar shadow roots.
    // La visibilidad se comprueba con getBoundingClientRect (no con [opened] que puede removerse
    // durante la transición entre pasos del wizard).
    await this.page.waitForFunction((pat: string) => {
      function findAll(root: Document | ShadowRoot, sel: string): Element[] {
        const r = Array.from(root.querySelectorAll(sel));
        for (const el of Array.from(root.querySelectorAll('*'))) {
          const sr = (el as any).shadowRoot as ShadowRoot | null;
          if (sr) r.push(...findAll(sr, sel));
        }
        return r;
      }
      function deepText(node: Node): string {
        let t = '';
        if ((node as Element).getAttribute) t += (node as Element).getAttribute('title') || '';
        const sr = (node as any).shadowRoot as ShadowRoot | null;
        if (sr) t += deepText(sr);
        for (const c of Array.from(node.childNodes)) {
          if (c.nodeType === 3) t += c.textContent || '';
          else if (c.nodeType === 1) t += deepText(c);
        }
        return t;
      }
      return findAll(document, 'paper-dialog').some(d => {
        const rect = (d as HTMLElement).getBoundingClientRect();
        return rect.width > 0 && new RegExp(pat).test(deepText(d));
      });
    }, pattern.source, { timeout: 15000 }).catch(() => {});

    const text = await this.page.evaluate((pat: string) => {
      function findAll(root: Document | ShadowRoot, sel: string): Element[] {
        const r = Array.from(root.querySelectorAll(sel));
        for (const el of Array.from(root.querySelectorAll('*'))) {
          const sr = (el as any).shadowRoot as ShadowRoot | null;
          if (sr) r.push(...findAll(sr, sel));
        }
        return r;
      }
      function deepText(node: Node): string {
        let t = '';
        if ((node as Element).getAttribute) t += (node as Element).getAttribute('title') || '';
        const sr = (node as any).shadowRoot as ShadowRoot | null;
        if (sr) t += deepText(sr);
        for (const c of Array.from(node.childNodes)) {
          if (c.nodeType === 3) t += c.textContent || '';
          else if (c.nodeType === 1) t += deepText(c);
        }
        return t;
      }
      for (const d of findAll(document, 'paper-dialog')) {
        const rect = (d as HTMLElement).getBoundingClientRect();
        if (rect.width > 0) {
          const t = deepText(d);
          if (new RegExp(pat).test(t)) return t;
        }
      }
      return '';
    }, pattern.source);

    if (!pattern.test(text)) throw new Error(`Message does not match ${pattern}: "${text}"`);
  }

  async rightClickOnMedia(mediaName: string) {
    const card = this.page.locator(`dex-media-card[title="${mediaName}"]`)
      .or(this.page.locator('dex-media-card').filter({ hasText: mediaName }))
      .first();
    // Esperar a que el card esté en DOM con timeout extendido (la lista puede cargar lento)
    await card.waitFor({ state: 'attached', timeout: 30000 });
    // Traer el card a la vista (puede estar fuera del viewport en listas largas)
    await card.scrollIntoViewIfNeeded().catch(() => {});
    await card.waitFor({ state: 'visible', timeout: 10000 });
    const box = await card.boundingBox();
    if (!box) throw new Error(`No bounding box for media card: ${mediaName}`);
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
  }

  async clickReplaceMedia() {
    await this.page.waitForTimeout(200);
    const clicked = await this.page.evaluate(() => {
      function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
        const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) items.push(...findAll(sr, sel));
        }
        return items;
      }
      for (const sel of ['paper-icon-item', 'paper-item']) {
        const match = findAll(document, sel).find(el => /reemplazar|replace/i.test(el.textContent ?? ''));
        if (match) { match.click(); return true; }
      }
      return false;
    });
    if (!clicked) throw new Error('Reemplazar media menu item not found');
    await this.page.waitForTimeout(2500);
  }

  async clickRemoveMedia() {
    await this.page.waitForTimeout(200);
    const clicked = await this.page.evaluate(() => {
      function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
        const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) items.push(...findAll(sr, sel));
        }
        return items;
      }
      for (const sel of ['paper-icon-item', 'paper-item']) {
        const match = findAll(document, sel).find(el => /quitar|remove/i.test(el.textContent ?? ''));
        if (match) { match.click(); return true; }
      }
      return false;
    });
    if (!clicked) throw new Error('Quitar media menu item not found');
    await this.page.waitForTimeout(1500);
  }

  async searchMediatoReplace2(mediaName: string) {
    await this.page.evaluate((value: string) => {
      function findInShadow(root: Document | ShadowRoot, sel: string): HTMLInputElement | null {
        const found = root.querySelector(sel) as HTMLInputElement | null;
        if (found) return found;
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) { const r = findInShadow(sr, sel); if (r) return r; }
        }
        return null;
      }
      const input = findInShadow(document, 'input[placeholder="Búsqueda/Filtro"]')
        ?? findInShadow(document, 'input[placeholder="Search/Filter"]');
      if (!input) throw new Error('Replace dialog search input not found');
      input.focus();
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, mediaName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async findFolderForMediaReplace(folderName: string) {
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
    }, folderName, { timeout: 10000 });
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
    }, folderName);
    await this.page.waitForTimeout(300);
  }

  async clickOnReplacementMedia(mediaName: string) {
    const baseName = mediaName.replace(/\.[^/.]+$/, '');

    // Wait for the target item to appear — either as a div.mediaCardC (grid view)
    // or as a div[title] (list view used by the replacement dialog). The old waitFor
    // on div.mediaCardC.first() was hitting cards from the main library behind the
    // dialog overlay rather than the dialog's own items.
    await this.page.waitForFunction(
      ({ base, full }: { base: string; full: string }) => {
        function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
          const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
          for (const el of root.querySelectorAll('*')) {
            const sr = (el as any).shadowRoot;
            if (sr) items.push(...findAll(sr, sel));
          }
          return items;
        }
        return (
          findAll(document, 'div.mediaCardC').some(el => (el.textContent ?? '').includes(base)) ||
          findAll(document, 'div[title]').some(el => {
            const t = el.getAttribute('title') ?? '';
            return t === base || t === full || t.startsWith(base);
          })
        );
      },
      { base: baseName, full: mediaName },
      { timeout: 15000 },
    );

    const clicked = await this.page.evaluate(({ base, full }: { base: string; full: string }) => {
      function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
        const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as any).shadowRoot;
          if (sr) items.push(...findAll(sr, sel));
        }
        return items;
      }
      // Card view
      const cardMatch = findAll(document, 'div.mediaCardC')
        .find(el => (el.textContent ?? '').includes(base));
      if (cardMatch) { cardMatch.click(); return true; }
      // List view (replacement dialog uses div[title] like folder items do)
      const titleMatch = findAll(document, 'div[title]')
        .find(el => {
          const t = el.getAttribute('title') ?? '';
          return t === base || t === full || t.startsWith(base);
        });
      if (titleMatch) { titleMatch.click(); return true; }
      return false;
    }, { base: baseName, full: mediaName });

    if (!clicked) throw new Error(`Media card not found: ${baseName}`);
    await this.page.waitForTimeout(300);
  }

  async clickContinueBtn() {
    await this.page.evaluate(() => {
      function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
        const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) items.push(...findAll(sr, sel));
        }
        return items;
      }
      const match = findAll(document, 'paper-button').find(btn => {
        if (!/continuar|continue|siguiente|next/i.test(btn.textContent ?? '')) return false;
        const rect = btn.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (match) match.click();
      else throw new Error('Continue/Next button not found or not visible');
    });
    await this.page.waitForTimeout(1000);
  }

  async clickSecondContinueBtn() {
    await this.page.evaluate(() => {
      function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
        const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) items.push(...findAll(sr, sel));
        }
        return items;
      }
      const btn = findAll(document, 'paper-button').find(b => {
        if (!/siguiente|next|continuar|continue/i.test(b.textContent ?? '')) return false;
        const rect = b.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (btn) btn.click();
      else throw new Error('Siguiente/Continue button not found or not visible');
    });
    await this.page.waitForTimeout(1000);
  }

  async clickSelectAllCheckBox() {
    for (let attempt = 0; attempt < 30; attempt++) {
      const found = await this.page.evaluate(() => {
        function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
          const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
          for (const el of root.querySelectorAll('*')) {
            const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
            if (sr) items.push(...findAll(sr, sel));
          }
          return items;
        }
        const match = findAll(document, 'paper-checkbox').find(cb => {
          if (!/seleccionar todo|select all/i.test(cb.textContent ?? '')) return false;
          const rect = cb.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (match) { match.click(); return true; }
        return false;
      });
      if (found) return;
      await this.page.waitForTimeout(300);
    }
    throw new Error('Select all checkbox not found after waiting');
  }

  async clickPlaylistCheckbox(playlistName: string) {
    // Type the playlist name into the dialog's search box to filter the list
    await this.page.evaluate((name: string) => {
      function findAll(root: Element | Document | ShadowRoot, sel: string): HTMLElement[] {
        const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) items.push(...findAll(sr, sel));
        }
        return items;
      }
      const dialogs = Array.from(document.querySelectorAll('paper-dialog'));
      if (dialogs.length === 0) return;
      const dlg = dialogs[dialogs.length - 1] as HTMLElement;
      const inp = findAll(dlg, 'input').find(el => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }) as HTMLInputElement | undefined;
      if (!inp) return;
      inp.focus();
      inp.value = name;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    }, playlistName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(700);

    // Retry: find the checkbox now that the list is filtered
    let noScrollStreak = 0;
    for (let attempt = 0; attempt < 30; attempt++) {
      const result = await this.page.evaluate((name: string) => {
        function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
          const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
          for (const el of root.querySelectorAll('*')) {
            const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
            if (sr) items.push(...findAll(sr, sel));
          }
          return items;
        }

        function isCheckbox(el: Element): boolean {
          const tag = el.tagName?.toLowerCase() ?? '';
          return tag === 'paper-checkbox' || el.getAttribute('role') === 'checkbox' ||
                 (el as HTMLElement).shadowRoot?.querySelector('input[type="checkbox"]') !== null;
        }

        function findCheckboxInAncestors(start: Element): HTMLElement | null {
          let node: Element | null = start;
          for (let d = 0; d < 6 && node; d++) {
            const parent: Element | null = node.parentElement ??
              ((node.getRootNode() as ShadowRoot)?.host as Element | undefined) ?? null;
            if (!parent) break;
            const cb = Array.from(parent.children).find(isCheckbox) as HTMLElement | undefined;
            if (cb) return cb;
            node = parent;
          }
          return null;
        }

        // Strategy 1: paper-checkbox whose label text matches directly
        for (const cb of findAll(document, 'paper-checkbox')) {
          if ((cb.textContent ?? '').trim() === name) { cb.click(); return 'clicked'; }
        }

        // Strategy 2: text-matching element → walk ancestors to find sibling checkbox
        for (const el of findAll(document, '*')) {
          if ((el.textContent ?? '').trim() !== name) continue;
          const cb = findCheckboxInAncestors(el);
          if (cb) { cb.click(); return 'clicked'; }
        }

        // Scroll virtual list to load more rows
        for (const el of findAll(document, '*')) {
          const style = window.getComputedStyle(el);
          if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
              el.scrollHeight > el.clientHeight + 10) {
            const rect = el.getBoundingClientRect();
            if (rect.y < 60 || rect.height === 0) continue;
            (el as HTMLElement).scrollBy(0, 300);
            return 'scrolled';
          }
        }
        return 'no-scroll';
      }, playlistName);

      if (result === 'clicked') return;
      if (result === 'no-scroll') {
        noScrollStreak++;
        if (noScrollStreak >= 10) break;
      } else {
        noScrollStreak = 0;
      }
      await this.page.waitForTimeout(200);
    }
    throw new Error(`Playlist checkbox not found after scrolling: ${playlistName}`);
  }

  async clickConfirmBtn() {
    await this.page.evaluate(() => {
      function findAll(root: Document | ShadowRoot, sel: string): HTMLElement[] {
        const items = Array.from(root.querySelectorAll(sel)) as HTMLElement[];
        for (const el of root.querySelectorAll('*')) {
          const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) items.push(...findAll(sr, sel));
        }
        return items;
      }
      const btn = findAll(document, 'paper-button').find(b => {
        if (!/confirmar|confirm/i.test(b.textContent ?? '')) return false;
        const rect = b.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (btn) btn.click();
      else throw new Error('Confirm button not found or not visible');
    });
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