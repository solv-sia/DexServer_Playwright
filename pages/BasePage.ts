import { Page, Locator } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Builds a shadow-DOM-piercing locator. Uses >> to cross shadow boundaries.
  // Equivalent to Cypress's findElement with get + find chain + eq.
  protected findElement(options: {
    get: string;
    find?: string[];
    eq?: number;
  }): Locator {
    const { get, find, eq } = options;

    const selector = find?.length ? [get, ...find].join(' >> ') : get;
    let locator = this.page.locator(selector);

    if (typeof eq === 'number') {
      locator = locator.nth(eq);
    }

    return locator;
  }

  // Convenience: type into an input nested inside a paper-input (shadow DOM).
  protected async typeInPaperInput(locator: Locator, text: string): Promise<void> {
    const input = locator.locator('input');
    await input.click({ force: true });
    await input.clear();
    await input.fill(text, { force: true });
  }

  protected async waitOverlayClosed(timeout = 15000): Promise<void> {
    await this.page.waitForFunction(
      () => !document.querySelector('iron-overlay-backdrop[opened]'),
      { timeout }
    ).catch(() => {});
  }
}
