// Verificar en BD que la política de transmisión se aplicó correctamente a los players
import { test, expect } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import { getSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
// import { connectDB, dbGetPlayerPolicies } from '../utils/dbHelper';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Verificar política de transmisión en BD (post CP30PP)', () => {
  test('@CP31PP', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    const trPolicyName = getSharedData('policyCP30PP') ?? config.LNLtransmissionPolicyName;

    // ── Verificación UI: player1 hereda la política de transmisión ────────────
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player1);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    await networkDetailPage.validateInheritedValues({ transmissionPolicyName: trPolicyName });
    await page.screenshot({ path: 'screenshots/cp31pp_player1.png' });

    // Verificar player2
    await globalPage.clickNetwork();
    await networkPage.clearAndSearch(config.player2);
    await page.waitForTimeout(1500);
    await networkPage.clickResultingPlayer();
    await page.waitForTimeout(1000);

    await networkDetailPage.validateInheritedValues({ transmissionPolicyName: trPolicyName });
    await page.screenshot({ path: 'screenshots/cp31pp_player2.png' });

    // ── Verificación BD ───────────────────────────────────────────────────────
    // Verificar que la BD tiene registrada la política de transmisión en los players.
    // Descomentar cuando se implemente connectDB():
    //
    // const db = await connectDB();
    // try {
    //   for (const playerName of [config.player1, config.player2]) {
    //     const policies = await dbGetPlayerPolicies(db, playerName);
    //     expect(policies).not.toBeNull();
    //     expect((policies!.TransmissionPolicy as string).toLowerCase())
    //       .toContain(trPolicyName.toLowerCase());
    //   }
    // } finally {
    //   await db.close();
    // }
    // ─────────────────────────────────────────────────────────────────────────
  });
});
