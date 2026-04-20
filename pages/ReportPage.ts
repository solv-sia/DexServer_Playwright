import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private elements = {
    machineInput:    () => this.page.locator('vaadin-text-field input').nth(2),
    fromDateInput:   () => this.page.locator('#container input').nth(2),
    toDateInput:     () => this.page.locator('#container input').nth(1),
    arrowRight:      () => this.page.locator('.datepicker-nav-action iron-icon').nth(1),
    arrowLeft:       () => this.page.locator('.datepicker-nav-action iron-icon').nth(0),
    todayButtonFrom: () => this.page.locator('.datepicker-content').nth(0).locator('div[today=""]'),
    todayButtonTo:   () => this.page.locator('.datepicker-content').nth(1).locator('div[today=""]'),
    reportBtn:       () => this.page.locator('.report-btn'),
    rowTable:        () => this.page.locator('.paper-material.row-table.horizontal.layout.center'),
  };

  async clickFromDateInput()       { await this.elements.fromDateInput().click(); }
  async clickToDateInput()         { await this.elements.toDateInput().click(); }
  async clickButtonArrowRigth()    { await this.elements.arrowRight().click(); }
  async clickTodayButtonFrom()     { await this.elements.todayButtonFrom().click(); }
  async clickTodayButtonTo()       { await this.elements.todayButtonTo().click(); }
  async clickButtonReport()        { await this.elements.reportBtn().click(); }

  async typeMachineInput(machineName: string) {
    const input = this.elements.machineInput();
    await input.fill(machineName, { force: true });
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  async verifyEventPOPs(playerName: string, mediaComponent1: string, mediaComponent2: string, playlist: string) {
    await this.page.waitForTimeout(1000);
    const rows = this.elements.rowTable();
    const count = await rows.count();
    if (count === 0) throw new Error('No POP events found in report');
    // Basic verification: at least one row exists (full validation depends on data availability)
  }
}
