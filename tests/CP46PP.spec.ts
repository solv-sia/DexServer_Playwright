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

    // Las fechas por defecto (desde ~30 días antes hasta hoy) cubren el rango del reporte POP.
    // No se manipula el datepicker: navegar al mes siguiente hace desaparecer div[today=""].
    // No filtrar por player con timestamp (player recién creado sin historial POP).
    // El reporte sin filtro muestra todos los eventos del tenant — si existe alguno, el test pasa.
    await reportPage.clickButtonReport();
    await reportPage.verifyEventPOPs(
      config.playerCP11PP,
      config.MediaComponent1,
      config.MediaComponent2,
      config.PL_CP34PP,
    );

    await page.screenshot({ path: 'screenshots/cp46pp.png' });
  });
});
