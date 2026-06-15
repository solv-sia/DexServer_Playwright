import { test } from '@playwright/test';

export function setTestRailComment(comment: string): void {
  test.info().annotations.push({ type: 'testRailComment', description: comment });
}
