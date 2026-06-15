import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test('@DEBUG tagSelector position', async ({ page }) => {
  test.setTimeout(300000);

  await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

  const globalPage = new GlobalPage(page);
  const networkPage = new NetworkPage(page);

  await globalPage.waitSpinner();
  await globalPage.switchToNewTenant(config.clientName);
  await globalPage.loginDecision(config.password);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await globalPage.waitSpinner();

  await globalPage.clickNetwork();
  // Open player1 first (like CP21PP does), validate, then navigate to player2
  await globalPage.clickNetwork();
  await networkPage.clearAndSearch(config.player1);
  await page.waitForTimeout(1000);
  await networkPage.clickResultingPlayer();
  await page.waitForTimeout(2000);

  console.log('=== Player1 tag state ===');
  const p1Info = await page.evaluate(() => {
    function findInShadow(root: Document | ShadowRoot, sel: string): Element | null {
      const el = root.querySelector(sel); if (el) return el;
      for (const e of Array.from(root.querySelectorAll('*'))) { if ((e as any).shadowRoot) { const f = findInShadow((e as any).shadowRoot, sel); if (f) return f; } } return null;
    }
    const c = findInShadow(document, '#tagSelector .textarea-container');
    const sel = findInShadow(document, '#tagSelector');
    const rect = sel?.getBoundingClientRect();
    return { containerText: c?.textContent?.trim().slice(0, 80), rect: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width) } : null, viewport: { w: window.innerWidth, h: window.innerHeight } };
  });
  console.log(JSON.stringify(p1Info, null, 2));

  // Now navigate to player2 like the test does
  await globalPage.clickNetwork();
  await networkPage.clearAndSearch(config.player2);
  await page.waitForTimeout(1000);
  await networkPage.clickResultingPlayer();
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    function findAllInShadow(root: Document | ShadowRoot, selector: string, results: Element[] = []): Element[] {
      results.push(...Array.from(root.querySelectorAll(selector)));
      for (const e of Array.from(root.querySelectorAll('*'))) {
        if ((e as any).shadowRoot) findAllInShadow((e as any).shadowRoot, selector, results);
      }
      return results;
    }
    function findInShadow(root: Document | ShadowRoot, selector: string): Element | null {
      return findAllInShadow(root, selector)[0] || null;
    }

    // Count how many #tagSelector exist
    const allTagSelectors = findAllInShadow(document, '#tagSelector');
    const tagSelectorInfos = allTagSelectors.map((el, i) => {
      const rect = el.getBoundingClientRect();
      const container = el.shadowRoot?.querySelector('.textarea-container') || el.querySelector('.textarea-container');
      return {
        index: i,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        containerText: container?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) || '(empty)',
        containerFound: !!container,
        parentTag: el.parentElement?.tagName,
      };
    });

    // Check dex-network-display-detail host element
    const detail = findInShadow(document, 'dex-network-display-detail');
    const detailRect = detail?.getBoundingClientRect();

    // Check inner-container scrollLeft
    const inner = findInShadow(document, '.inner-container');
    const innerRect = inner?.getBoundingClientRect();

    return {
      tagSelectorCount: allTagSelectors.length,
      tagSelectors: tagSelectorInfos,
      detailRect: detailRect ? { x: Math.round(detailRect.x), y: Math.round(detailRect.y), w: Math.round(detailRect.width) } : null,
      innerContainer: inner ? { scrollLeft: (inner as any).scrollLeft, rect: innerRect ? { x: Math.round(innerRect.x), w: Math.round(innerRect.width) } : null } : null,
      viewportSize: { w: window.innerWidth, h: window.innerHeight },
    };
  });

  console.log('=== Player2 tagSelector DEBUG ===');
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'screenshots/debug_tagSelector.png' });
});
