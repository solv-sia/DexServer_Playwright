// Crear un calendario con varios periodos (hoy y mañana)
import { test } from '@playwright/test';
import * as path from 'path';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { SchedulePage } from '../pages/SchedulePage';

test.use({ storageState: path.join(__dirname, '../auth/storageState.json') });

test.describe('Crear un calendario con varios periodos', () => {
  test('@CP13PP', async ({ page }) => {
    test.setTimeout(60000);
    const scheduleName = 'Calendario creado con Playwright <3 ' + dateFormatter.datetime();

    await page.goto(`${config.baseUrl}/DexFrontEnd/`, { waitUntil: 'domcontentloaded' });

    const globalPage = new GlobalPage(page);
    const schedulePage = new SchedulePage(page);

    await globalPage.waitSpinner();
    await globalPage.switchToNewTenant(config.clientName);
    await globalPage.loginDecision(config.password);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await globalPage.waitSpinner();

    await globalPage.clickSchedule();

    await schedulePage.clickAddButton();
    await schedulePage.clickScheduleButton();
    await globalPage.waitSpinner();

    await schedulePage.createPeriodToday(config.calendarPL);
    await schedulePage.createPeriodTomorrow(config.calendarPL);
    await schedulePage.typeNameScheduleInput(scheduleName);

    await schedulePage.clickSaveButton();
    await globalPage.readInfoPopup(/Calendario guardado!|Schedule saved!/i);

    setSharedData('ScheudleCP13PP', scheduleName);

    await page.screenshot({ path: 'screenshots/cp13pp.png' });
  });
});
