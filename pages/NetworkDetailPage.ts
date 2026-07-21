import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NetworkDetailPage extends BasePage {
  plApplied = '';
  shApplied = '';

  constructor(page: Page) {
    super(page);
  }

  private elements = {
    plDefaultCombo:    () => this.page.locator('dex-network-display-detail#dexNetworkDetail dex-playlist-combo vaadin-combo-box#playlistMenu'),
    plDefaultInput:    () => this.page.locator('dex-network-display-detail#dexNetworkDetail dex-playlist-combo #playlistMenu input'),
    groupInput:        () => this.page.locator('dex-network-display-detail#dexNetworkDetail dex-group-combo #groupMenu input'),
    groupClearBtn:     () => this.page.locator('dex-network-display-detail#dexNetworkDetail #groupMenu #clearButton'),
    groupCombo:        () => this.page.locator('dex-network-display-detail#dexNetworkDetail dex-group-combo vaadin-combo-box'),
    scheduleCombo:     () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').first(),
    scheduleInput:     () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').first().locator('input'),
    tpCombo:           () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="settings-input-antenna"]) vaadin-combo-box'),
    hpCombo:           () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="settings-remote"]) vaadin-combo-box'),
    timeZoneCombo:     () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="schedule"]) vaadin-combo-box').nth(1),
    tagCombo:          () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="label"]) vaadin-combo-box'),
    versionInput:      () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="image:filter-2"])').nth(1).locator('vaadin-combo-box input'),
    versionCombo:      () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="image:filter-2"])').nth(1).locator('vaadin-combo-box'),
    versionLabel:      () => this.page.locator('paper-icon-item').filter({ hasText: /Versión actual|Current version/i }).locator('div.device-img + span'),
    playerNameInput:   () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-input.flex.input-name').locator('input'),
    saveButton:        () => this.page.locator("dex-network-display-detail#dexNetworkDetail paper-icon-button[title='Guardar'], dex-network-display-detail#dexNetworkDetail paper-icon-button[title='Save']"),
    closeButton:       () => this.page.locator("dex-network-display-detail#dexNetworkDetail paper-icon-button[title='Cerrar'], dex-network-display-detail#dexNetworkDetail paper-icon-button[title='Close']").first(),
    tagContainer:      () => this.page.locator('#tagSelector .textarea-container'),
    playlistAnalyzerBtn: () => this.page.locator("dex-network-display-detail#dexNetworkDetail paper-icon-button[icon='av:subscriptions']"),
    storeCombo:        () => this.page.locator('dex-network-display-detail#dexNetworkDetail paper-icon-item:has(iron-icon[icon="store"]) vaadin-combo-box'),
  };

  private async waitForDetailPanel() {
    // Poll the save button bounding box — the panel may be CSS-hidden (Polymer transform animation)
    // even after the [opened] attribute is set, so state:'visible' would always timeout.
    const saveBtn = this.elements.saveButton();
    for (let i = 0; i < 150; i++) {
      const box = await saveBtn.boundingBox().catch(() => null);
      if (box && box.width > 0 && box.height > 0) break;
      await this.page.waitForTimeout(200);
    }
    // Then confirm the group combo also has real dimensions before interacting
    const input = this.elements.groupCombo().locator('input');
    for (let i = 0; i < 40; i++) {
      const box = await input.boundingBox();
      if (box && box.width > 0 && box.height > 0) return;
      await this.page.waitForTimeout(200);
    }
  }

  private async waitForVaadinComboReady(combo: ReturnType<typeof this.page.locator>) {
    for (let i = 0; i < 20; i++) {
      const items = await combo.evaluate((el: any) => el.items ? el.items.length : 0).catch(() => 0);
      if (items > 0) return;
      await this.page.waitForTimeout(150);
    }
  }

  private async selectInOpenedCombo(value: string) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Primary: click the vaadin-combo-box-item directly (same approach as GroupDetailPage).
    // getByRole('option') was skipped because vaadin-combo-box-item does not expose
    // role="option" as a DOM attribute in this Vaadin version, so it always fell through
    // to the JS-assignment fallback which bypasses Polymer's dirty-tracking and left the
    // save button disabled.
    const option = this.page.locator('vaadin-combo-box-overlay[opened] vaadin-combo-box-item')
      .filter({ hasText: new RegExp(escaped, 'i') })
      .first();
    const clicked = await option.waitFor({ state: 'visible', timeout: 8000 })
      .then(() => option.click().then(() => true))
      .catch(() => false);
    if (clicked) return;

    // Fallback: JS property assignment via filteredItems (server-side combos or when overlay click fails)
    let hasMatch = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      hasMatch = await this.page.evaluate((val) => {
        function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
          const el = root.querySelector(sel);
          if (el) return el;
          for (const e of Array.from(root.querySelectorAll('*'))) {
            const sr = (e as any).shadowRoot;
            if (sr) { const f = findInShadow(sr, sel); if (f) return f; }
          }
          return null;
        }
        const c = findInShadow(document, 'vaadin-combo-box[opened]') as any;
        if (!c) return false;
        return (c.filteredItems || []).some((i: any) => {
          const text = typeof i === 'string' ? i
            : [i.label, i.name, i.text, i.displayValue].filter(Boolean).join(' ') || String(i.value ?? '');
          return text.toLowerCase().includes(val.toLowerCase());
        });
      }, value);
      if (hasMatch) break;
      await this.page.waitForTimeout(150);
    }

    if (!hasMatch) {
      throw new Error(`vaadin-combo: item matching "${value}" not found via role=option or filteredItems after 8s`);
    }

    await this.page.evaluate((val) => {
      function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
        const el = root.querySelector(sel);
        if (el) return el;
        for (const e of Array.from(root.querySelectorAll('*'))) {
          const sr = (e as any).shadowRoot;
          if (sr) { const f = findInShadow(sr, sel); if (f) return f; }
        }
        return null;
      }
      const vaadinCombo = findInShadow(document, 'vaadin-combo-box[opened]') as any;
      if (!vaadinCombo) return;
      const filtered: any[] = vaadinCombo.filteredItems || [];
      const match = filtered.find((i: any) => {
        const text = typeof i === 'string' ? i
          : [i.label, i.name, i.text, i.displayValue].filter(Boolean).join(' ') || String(i.value ?? '');
        return text.toLowerCase().includes(val.toLowerCase());
      }) ?? filtered[0] ?? (vaadinCombo.items || [])[0];
      if (!match) return;
      vaadinCombo.selectedItem = match;
      vaadinCombo.opened = false;
    }, value);
  }

  private async fillVaadinCombo(combo: ReturnType<typeof this.page.locator>, value: string) {
    await this.waitForVaadinComboReady(combo);
    const openOverlay = this.page.locator('vaadin-combo-box-overlay[opened]');
    await openOverlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    const input = combo.locator('input');
    await input.dispatchEvent('click');
    await input.dispatchEvent('focus');
    await input.fill(value, { force: true });
    await openOverlay.waitFor({ state: 'visible', timeout: 15000 });

    // Intentar click directo en el ítem del overlay (path principal)
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const option = this.page.locator('vaadin-combo-box-overlay[opened] vaadin-combo-box-item')
      .filter({ hasText: new RegExp(escaped, 'i') })
      .first();
    const clicked = await option.waitFor({ state: 'visible', timeout: 8000 })
      .then(() => option.click().then(() => true))
      .catch(() => false);

    if (!clicked) {
      // Fallback: ArrowDown + Enter pasa por el manejo de eventos de Polymer
      // (la asignación JS directa esquiva el dirty-tracking y deja el botón guardar deshabilitado)
      await input.press('ArrowDown');
      await input.press('Enter');
    }

    await openOverlay.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  private async waitForPlaylistReady() {
    const combo = this.page.locator('dex-network-display-detail#dexNetworkDetail dex-playlist-combo vaadin-combo-box#playlistMenu');
    for (let i = 0; i < 20; i++) {
      const items = await combo.evaluate((el: any) => el.items ? el.items.length : 0).catch(() => 0);
      if (items > 0) return;
      await this.page.waitForTimeout(200);
    }
  }

  private async fillPlaylistCombo(combo: ReturnType<typeof this.page.locator>, value: string) {
    await this.waitForPlaylistReady();
    const openOverlay = this.page.locator('vaadin-combo-box-overlay[opened]');
    await openOverlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    const input = combo.locator('input');
    await input.dispatchEvent('click');
    await input.dispatchEvent('focus');
    await input.fill(value, { force: true });
    await openOverlay.waitFor({ state: 'visible', timeout: 15000 });
    await this.selectInOpenedCombo(value);
    await openOverlay.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async setPlayerName(name: string) {
    await this.waitForDetailPanel();
    const input = this.elements.playerNameInput();
    await input.click({ force: true });
    await input.press('Control+a');
    await input.pressSequentially(name, { delay: 50 });
    await this.page.waitForTimeout(300);
  }

  async clickSave() {
    const btn = this.elements.saveButton();
    for (let i = 0; i < 150; i++) {
      const box = await btn.boundingBox().catch(() => null);
      if (box && box.width > 0 && box.height > 0) break;
      await this.page.waitForTimeout(200);
    }
    await btn.click({ force: true });
  }

  async dismissCloseDetailDialog() {
    try {
      const btn = this.page.locator('paper-dialog paper-button').filter({ hasText: /Cerrar|Close|Sí|Si|Yes|Confirmar|Confirm/i }).first();
      await btn.waitFor({ state: 'visible', timeout: 10000 });
      await btn.click({ force: true });
      await this.page.waitForTimeout(300);
    } catch {
      // No dialog appeared
    }
  }

  async decisionToSavePlayer(closeIfDisabled = true): Promise<boolean> {
    const btn = this.elements.saveButton();
    // Poll until the save button has real dimensions (panel animation may still be running)
    for (let i = 0; i < 150; i++) {
      const box = await btn.boundingBox().catch(() => null);
      if (box && box.width > 0 && box.height > 0) break;
      await this.page.waitForTimeout(200);
    }
    const ariaDisabled = await btn.getAttribute('aria-disabled');
    if (ariaDisabled === 'false' || ariaDisabled === null) {
      // force:true clicks the exact element referenced by the locator, bypassing
      // overlap detection that can cause adjacent buttons (like close) to be hit instead
      await btn.click({ force: true });
      const confirmBtns = this.page.locator('#saveConfirmDialog paper-button, #confirmDialog paper-button').filter({ hasText: /Confirmar/i });
      await confirmBtns.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      const count = await confirmBtns.count();
      for (let i = 0; i < count; i++) {
        if (await confirmBtns.nth(i).isVisible()) {
          await confirmBtns.nth(i).click({ force: true });
          break;
        }
      }
      await this.waitOverlayClosed(10000);
      return true;
    }
    // No pending changes
    if (closeIfDisabled) {
      await this.elements.closeButton().click({ force: true });
      await this.waitOverlayClosed(10000);
    }
    return false;
  }

  async setGroupNone() {
    await this.waitForDetailPanel();
    const infoToast = this.page.locator('#infoToast');
    // Ensure any previous toast is gone before we start monitoring.
    await infoToast.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    // Start monitoring BEFORE any combo interaction so we can't miss a fast auto-save
    // that fires during clearBtn.click() or fillVaadinCombo().
    const autoSavePromise = infoToast.waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true).catch(() => false);
    const clearBtn = this.elements.groupClearBtn();
    if (await clearBtn.isVisible()) await clearBtn.click({ force: true });
    await this.fillVaadinCombo(this.elements.groupCombo(), 'ninguno');
    // Collect any auto-save toast (same Polymer observer as completePlayerGroupSelect).
    // Wait for it to fully disappear so the stale label can't pollute the next readInfoPopup.
    if (await autoSavePromise) {
      await infoToast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }

  async completePlayerGroupSelect(groupName: string) {
    await this.fillVaadinCombo(this.elements.groupCombo(), groupName);
    // Group assignment auto-saves — wait for the save toast to confirm the save fired.
    // Do NOT wait for hidden: the caller's readInfoPopup verifies and consumes the toast.
    const infoToast = this.page.locator('#infoToast');
    await infoToast.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }

  // Deterministic check that the player ended up assigned to the given group. Preferred
  // over reading the save toast: the app's "Player guardado" toast is shown one-at-a-time
  // and gets suppressed by a still-visible "Display creado" toast, so it's an unreliable
  // signal even though the save itself succeeds.
  async verifyPlayerGroup(groupName: string) {
    await this.waitForDetailPanel();
    await expect(this.elements.groupInput())
      .toHaveValue(new RegExp(this.escapeRegex(groupName), 'i'), { timeout: 10000 });
  }

  async setInheritedPLDefault() {
    await this.fillPlaylistCombo(this.elements.plDefaultCombo(), 'heredado');
  }

  async setInheritedSchedule() {
    await this.fillVaadinCombo(this.elements.scheduleCombo(), 'heredado');
  }

  async setInheritedTP() {
    await this.fillVaadinCombo(this.elements.tpCombo(), 'heredado');
  }

  async setInheritedHP() {
    await this.fillVaadinCombo(this.elements.hpCombo(), 'heredado');
    // HP change can trigger a Polymer re-render of the whole panel — wait for it to settle
    await this.waitForDetailPanel();
  }

  async setNewPlaylist(playlist: string, backupPlaylist: string) {
    const current = await this.elements.plDefaultInput().inputValue();
    const target = current.trim() === playlist ? backupPlaylist : playlist;
    this.plApplied = target;
    await this.fillPlaylistCombo(this.elements.plDefaultCombo(), target);
    // El cambio de playlist puede re-renderizar el panel completo (igual que HP) — esperar que se estabilice
    await this.waitForDetailPanel();
  }

  async setNewSchedule(schedule: string, backupSchedule: string) {
    const current = await this.elements.scheduleInput().inputValue();
    const target = current.trim() === schedule ? backupSchedule : schedule;
    this.shApplied = target;
    await this.fillVaadinCombo(this.elements.scheduleCombo(), target);
  }

  async getCurrentVersion(): Promise<string> {
    const text = await this.elements.versionLabel().textContent();
    return (text ?? '').trim();
  }

  // Selects a firmware version in the "version to install" combo and saves it. Recipe
  // (verified against the live app): clear, type the version slowly, let the combo filter
  // to the single matching option, then click that option (NOT ArrowDown+Enter — ArrowDown
  // moves the highlight off the option and commits an empty value), and click Save
  // IMMEDIATELY — the Save button only stays enabled for a brief window after the version
  // commits, so any delay re-disables it and the change is lost. Returns once the save
  // toast confirms persistence. NOTE: the panel must be opened via deep-link URL
  // (#!/network/<id>); a card-opened panel binds this combo so it never commits.
  async setVersionToInstall(version: string) {
    await this.waitForDetailPanel();
    const input = this.elements.versionCombo().locator('input');
    const saveBtn = this.elements.saveButton();
    const infoToast = this.page.locator('#infoToast');
    const matcher = new RegExp(this.escapeRegex(version), 'i');

    for (let attempt = 0; attempt < 4; attempt++) {
      // Clear any stale toast so the success check below can't read a previous one.
      await infoToast.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
      await input.click();
      await input.press('Control+a');
      await input.press('Delete');
      await this.page.waitForTimeout(300);
      await input.pressSequentially(version, { delay: 110 });
      // Let the combo filter down to the single matching option before committing.
      await this.page.waitForTimeout(1200);
      // Click the matching dropdown option with a real mouse click (commits the value);
      // fall back to Enter if the option isn't rendered.
      const option = this.page.locator('vaadin-combo-box-overlay[opened] vaadin-combo-box-item')
        .filter({ hasText: matcher }).first();
      if (await option.isVisible().catch(() => false)) await option.click();
      else await input.press('Enter');
      // Click Save right away, within the brief window the button stays enabled.
      await saveBtn.click({ force: true });

      const saved = await infoToast.waitFor({ state: 'visible', timeout: 6000 })
        .then(() => true).catch(() => false);
      if (saved) return;
      await this.page.waitForTimeout(800);
    }
  }

  private async waitForInputValue(
    locator: ReturnType<typeof this.page.locator>,
    timeout = 8000,
    contains?: string,
  ): Promise<string> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const val = await locator.inputValue().catch(() => '');
      const ready = contains
        ? val.toLowerCase().includes(contains.toLowerCase())
        : val.length > 0;
      if (ready) return val;
      await this.page.waitForTimeout(300);
    }
    return await locator.inputValue().catch(() => '');
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private assertInherited(val: string, expected: string) {
    const pattern = new RegExp(this.escapeRegex(expected), 'i');
    expect(val).toMatch(pattern);
    expect(val.toLowerCase()).toContain('heredado');
  }

  private async dismissConfirmDialog() {
    const confirmBtns = this.page.locator('#saveConfirmDialog paper-button, #confirmDialog paper-button').filter({ hasText: /Confirmar/i });
    const count = await confirmBtns.count();
    for (let i = 0; i < count; i++) {
      if (await confirmBtns.nth(i).isVisible({ timeout: 500 }).catch(() => false)) {
        await confirmBtns.nth(i).click({ force: true });
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  async validateInheritedValues({
    playlistName,
    hardwarePolicyName,
    transmissionPolicyName,
    scheduleName,
    timeZone,
    storeName,
  }: {
    playlistName?: string;
    hardwarePolicyName?: string;
    transmissionPolicyName?: string;
    scheduleName?: string;
    timeZone?: string;
    storeName?: string;
  }) {
    await this.dismissConfirmDialog();
    await this.waitForDetailPanel();
    if (playlistName) {
      const val = await this.waitForInputValue(this.elements.plDefaultInput(), 15000, playlistName);
      this.assertInherited(val, playlistName);
    }
    if (scheduleName) {
      const val = await this.waitForInputValue(this.elements.scheduleInput(), 15000, scheduleName);
      this.assertInherited(val, scheduleName);
    }
    if (hardwarePolicyName) {
      const val = await this.waitForInputValue(this.elements.hpCombo().locator('input'), 15000, hardwarePolicyName);
      this.assertInherited(val, hardwarePolicyName);
    }
    if (transmissionPolicyName) {
      const val = await this.waitForInputValue(this.elements.tpCombo().locator('input'), 15000, transmissionPolicyName);
      this.assertInherited(val, transmissionPolicyName);
    }
    if (timeZone) {
      const val = await this.waitForInputValue(this.elements.timeZoneCombo().locator('input'), 15000, timeZone);
      this.assertInherited(val, timeZone);
    }
    if (storeName) {
      await this.page.evaluate(() => {
        function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
          const el = root.querySelector(sel); if (el) return el;
          for (const e of Array.from(root.querySelectorAll('*'))) {
            if ((e as any).shadowRoot) { const f = findInShadow((e as any).shadowRoot, sel); if (f) return f; }
          } return null;
        }
        const container = findInShadow(document, '.inner-container');
        if (container) (container as HTMLElement).scrollLeft = (container as HTMLElement).scrollWidth;
      });
      await this.page.waitForTimeout(500);
      // The store is rendered as a <span> inside the shadow DOM — getByText pierces shadow DOM automatically.
      await expect(
        this.page.locator('dex-network-display-detail#dexNetworkDetail').getByText(storeName, { exact: false })
      ).toBeVisible({ timeout: 8000 });
    }
  }

  async clickPlaylistAnalyzerBtn() { await this.elements.playlistAnalyzerBtn().dispatchEvent('click'); }

  async validateTagValue(tagName: string) {
    await this.waitForDetailPanel();
    await this.page.evaluate(() => {
      function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
        const el = root.querySelector(sel); if (el) return el;
        for (const e of Array.from(root.querySelectorAll('*'))) {
          if ((e as any).shadowRoot) { const f = findInShadow((e as any).shadowRoot, sel); if (f) return f; }
        } return null;
      }
      const tagSel = findInShadow(document, '#tagSelector');
      const innerContainer = findInShadow(document, '.inner-container');
      if (!tagSel || !innerContainer) return;
      const tagRect = tagSel.getBoundingClientRect();
      const containerRect = innerContainer.getBoundingClientRect();
      (innerContainer as HTMLElement).scrollLeft = (innerContainer as HTMLElement).scrollLeft + (tagRect.left - containerRect.left);
    });
    await this.page.waitForTimeout(1000);
    await expect(this.elements.tagContainer()).toContainText(tagName, { timeout: 30000 });
  }
}
