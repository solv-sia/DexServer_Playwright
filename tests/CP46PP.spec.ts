// Consultar eventos POP en reporte de impresiones diarias
import { test } from '@playwright/test';
import config from '../utils/config';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { ReportPage } from '../pages/ReportPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Consultar eventos POP', () => {
  test('@CP46PP', async ({ page }) => {
    test.setTimeout(300000);


    const globalPage = new GlobalPage(page);
    const reportPage = new ReportPage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickButtonReport();
    await globalPage.clickOptionPOP();
    await page.waitForTimeout(500);

    await reportPage.clickFromDateInput();
    await reportPage.clickButtonArrowRigth();
    await reportPage.clickTodayButtonFrom();
    await reportPage.typeMachineInput(config.playerCP11PP);
    await reportPage.clickButtonReport();
    await page.waitForTimeout(1000);

    await reportPage.verifyEventPOPs(
      config.playerCP11PP,
      config.MediaComponent1,
      config.MediaComponent2,
      config.PL_CP34PP,
    );

    await page.screenshot({ path: 'screenshots/cp46pp.png' });
  });
});
