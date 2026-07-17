// Crear grupo LNL y asignar players validando herencia
import { test, expect } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { NetworkPage } from '../pages/NetworkPage';
import { NetworkDetailPage } from '../pages/NetworkDetailPage';
import { GroupDetailPage } from '../pages/GroupDetailPage';
import { createPlayer, deletePlayer } from '../utils/automationApi';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Create LNL Group', () => {
  const cleanupIds: number[] = [];

  test.afterAll(async () => {
    for (const id of cleanupIds) await deletePlayer(id).catch(() => { });
  });

  test('@CP16PP', async ({ page }) => {
    test.setTimeout(300000);
    const lonelyGroupName = 'Grupo Lonely Automation ' + dateFormatter.datetime();

    const [player1, player2] = await Promise.all([
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP16PP1),
      createPlayer(config.tenantActivationKeyCP16PP, config.playerCP16PP2),
    ]);
    cleanupIds.push(player1.machineId, player2.machineId);


    const globalPage = new GlobalPage(page);
    const networkPage = new NetworkPage(page);
    const networkDetailPage = new NetworkDetailPage(page);
    const groupDetailPage = new GroupDetailPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();

    await networkPage.clickMoreBtn();
    await networkPage.clickGroupBtn();

    await groupDetailPage.completeGroupNameInput(lonelyGroupName);
    await groupDetailPage.completePlaylistSelect(config.LNLplaylistName);
    await groupDetailPage.completeScheduleSelect(config.LNLscheduleName);
    await groupDetailPage.completeTransmissionPolicySelect(config.LNLtransmissionPolicyName);
    await groupDetailPage.completeHardwarePolicySelect(config.LNLhardwarePolicyName);
    await groupDetailPage.clickSaveGroupBtn();
    await globalPage.readInfoPopup(/Grupo guardado|Group saved/i);
    await globalPage.waitSpinner();
    await page.screenshot({ path: 'screenshots/cp16pp_group.png' });

    // Asignar cada player al grupo y validar que hereda la configuración del grupo.
    const assignToGroup = async (player: { machineId: number }) => {
      const url = `${config.baseUrl}/DexFrontEnd/#!/network/${player.machineId}`;
      // Navegar vía deep-link (no por clic en tarjeta): el panel abierto desde tarjeta no confirma
      // los combos de valores heredados, por lo que setInheritedPLDefault y similares fallan silenciosamente
      // y el player conserva valores literales en lugar de heredar del grupo. El primer goto puede
      // redirigir a #!/network, por eso se navega dos veces.
      const openPlayer = async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
      };
      await openPlayer();
      await networkDetailPage.setGroupNone();
      await networkDetailPage.setInheritedPLDefault();
      await networkDetailPage.setInheritedSchedule();
      await networkDetailPage.setInheritedTP();
      await networkDetailPage.setInheritedHP();
      if (await networkDetailPage.decisionToSavePlayer()) {
        await globalPage.readInfoPopup(/Player guardado|Player saved/i).catch(() => {});
      } else {
        await openPlayer();
      }
      await networkDetailPage.completePlayerGroupSelect(lonelyGroupName);
      if (await networkDetailPage.decisionToSavePlayer(false)) {
        await globalPage.readInfoPopup(/Player guardado|Player saved/i).catch(() => {});
      }
      // La herencia es eventualmente consistente — reabrir y revalidar hasta que los valores
      // heredados del grupo aparezcan en el player.
      await expect(async () => {
        await openPlayer();
        await networkDetailPage.validateInheritedValues({
          playlistName: config.LNLplaylistName,
          hardwarePolicyName: config.LNLhardwarePolicyName,
          transmissionPolicyName: config.LNLtransmissionPolicyName,
          scheduleName: config.LNLscheduleName,
        });
      }).toPass({ timeout: 90000, intervals: [3000, 5000, 5000, 8000, 8000] });
    };

    await assignToGroup(player1);
    await page.screenshot({ path: 'screenshots/cp16pp_player1.png' });
    await assignToGroup(player2);
    await page.screenshot({ path: 'screenshots/cp16pp_player2.png' });

    await globalPage.clickNetwork();
    await globalPage.waitSpinner();
    await networkPage.clearAndSearch(lonelyGroupName);
    await page.screenshot({ path: 'screenshots/cp16pp_final.png' });

    setSharedData('groupCP16PP', lonelyGroupName);
  });
});
