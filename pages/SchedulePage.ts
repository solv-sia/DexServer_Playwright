import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SchedulePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    addButton:           () => this.findElement({ get: "[icon-start='add']", find: ['#paperFab'], eq: 0 }),
    scheduleButton:      () => this.findElement({ get: "[icon='schedule']", find: ['#paperFab'] }),
    nameScheduleInput:   () => this.findElement({ get: '.flex.input-name', find: ["input[autocomplete='off']"] }),
    saveButton:          () => this.findElement({ get: "[icon='save']", find: ['#icon'] }),
    acceptButton:        () => this.page.locator('#dexScheduleDetail paper-button[role="button"][tabindex="0"][aria-disabled="false"]').nth(1),
    everyDaysCheckbox:   () => this.page.locator('#dialogAddEditPeriod paper-checkbox').first(),
    playlistPeriodInput: () => this.page.locator('#playlistMenu input[role="combobox"]'),
    scheduleSearchInput: () => this.findElement({ get: 'dex-schedules-view', find: ['paper-input.search-input', 'input'] }),
    resultingSchedule:   () => this.page.locator("div[slot='row'].schedule-row").first(),
    deleteScheduleBtn:   () => this.page.locator('#dexScheduleDetail paper-icon-button[icon="delete"]'),
    confirmDeleteBtn:    () => this.page.locator('#dialogDeleteSchedule paper-button[role="button"]').filter({ hasText: /Aceptar|Accept/i }),
    playlistAnalyzerBtn: () => this.page.locator("#dexScheduleDetail paper-icon-button[icon='av:subscriptions']"),
  };

  private todayDayIndex(): number {
    const d = new Date().getDay();
    return (d + 6) % 7;
  }

  private tomorrowDayIndex(): number {
    const d = this.todayDayIndex();
    return d === 6 ? 0 : d + 1;
  }

  async clickAddButton()      { await this.waitOverlayClosed(); await this.elements.addButton().click(); }
  async clickScheduleButton() { await this.waitOverlayClosed(); await this.elements.scheduleButton().click(); }
  async clickSaveButton() {
    const btn = this.elements.saveButton();
    await btn.scrollIntoViewIfNeeded();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }
  async clickAcceptButton() {
    await this.elements.acceptButton().click({ force: true });
    await this.waitOverlayClosed();
  }
  async clickResultingSchedule() {
    await this.waitOverlayClosed();
    await this.elements.resultingSchedule().click();
  }

  async typeNameScheduleInput(name: string) {
    await this.elements.nameScheduleInput().fill(name, { force: true });
  }

  async typePlaylistPeriodInput(playlistName: string) {
    await this.elements.playlistPeriodInput().fill(playlistName);
    await this.elements.playlistPeriodInput().press('ArrowDown');
    await this.elements.playlistPeriodInput().press('Enter');
  }

  async clickGridDay(dayIndex: number) {
    await this.page.locator(`#day-${dayIndex}`).click();
  }

  async createPeriodToday(calendarPL: string) {
    await this.clickGridDay(this.todayDayIndex());
    await this.typePlaylistPeriodInput(calendarPL);
    await this.clickAcceptButton();
  }

  async createPeriodTomorrow(calendarPL: string) {
    await this.clickGridDay(this.tomorrowDayIndex());
    await this.typePlaylistPeriodInput(calendarPL);
    await this.clickAcceptButton();
  }

  async searchSchedule(scheduleName: string) {
    await this.elements.scheduleSearchInput().fill(scheduleName, { force: true });
    await this.elements.scheduleSearchInput().press('Enter');
  }

  async clickPlaylistAnalyzerBtn() { await this.elements.playlistAnalyzerBtn().click({ force: true }); }

  async deleteSchedule(scheduleName: string) {
    await this.searchSchedule(scheduleName);
    await this.waitOverlayClosed();
    await this.elements.resultingSchedule().click();
    await this.elements.deleteScheduleBtn().click({ force: true });
    await this.elements.confirmDeleteBtn().click({ force: true });
    await this.waitOverlayClosed();
  }
}
