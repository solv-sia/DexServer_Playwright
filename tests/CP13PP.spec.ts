// Crear un calendario con varios periodos (hoy y mañana)
import { test } from '@playwright/test';
import config from '../utils/config';
import dateFormatter from '../utils/dateFormatter';
import { setSharedData } from '../utils/sharedData';
import { GlobalPage } from '../pages/GlobalPage';
import { loginWithSession } from '../utils/loginWithSession';
import { SchedulePage } from '../pages/SchedulePage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Crear un calendario con varios periodos', () => {
  test('@CP13PP', async ({ page }) => {
    test.setTimeout(300000);
    const scheduleName = 'Calendario creado con Playwright <3 ' + dateFormatter.datetime();


    const globalPage = new GlobalPage(page);
    const schedulePage = new SchedulePage(page);

    await loginWithSession(page, config.userName2, config.password);

    await globalPage.clickSchedule();

    await schedulePage.clickAddButton();
    await schedulePage.clickScheduleButton();
    await globalPage.waitSpinner();

    await schedulePage.createPeriodToday(config.calendarPL);
    await page.waitForTimeout(5000);
    await schedulePage.createPeriodTomorrow(config.calendarPL);
    await page.waitForTimeout(5000);
    await schedulePage.typeNameScheduleInput(scheduleName);

    await schedulePage.clickSaveButton();
    await globalPage.readInfoPopup(/Calendario guardado!|Schedule saved!/i);

    setSharedData('ScheudleCP13PP', scheduleName);

    await page.screenshot({ path: 'screenshots/cp13pp.png' });
  });
});
