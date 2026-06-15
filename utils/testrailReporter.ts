import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import configJson from './configuration.json';

const API_URL = process.env.AUTOMATION_API_URL || 'http://localhost:3050';
const API_TOKEN = process.env.AUTOMATION_API_TOKEN;
const RUN_ID = Number(configJson.testRunId);

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'User-Agent': 'Cypress/15.13.1',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    ...extra,
  };
}

function extractId(title: string): string | null {
  return title.match(/@([^\s]+)/)?.[1] ?? null;
}

export default class TestRailReporter implements Reporter {
  async onTestEnd(test: TestCase, result: TestResult) {
    const cypressId = extractId(test.title);
    if (!cypressId) return;

    const customComment = result.annotations.find(a => a.type === 'testRailComment')?.description;

    try {
      await fetch(`${API_URL}/api/result`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          runId: RUN_ID,
          cypressId,
          status: result.status === 'passed' ? 'passed' : 'failed',
          comment: result.status !== 'passed'
            ? `Test fallido: ${result.error?.message ?? 'Error no especificado'}`
            : 'Test ejecutado correctamente',
          elapsed: `${Math.ceil(result.duration / 1000)}s`,
          customComment,
        }),
      });
      console.log(`Dex Reporter: Result sent for ${cypressId} - ${result.status}`);
    } catch (error) {
      console.error(`Dex Reporter: Error sending result for ${cypressId}:`, error);
    }

    const video = result.attachments.find(a => a.name === 'video');
    if (video?.path) {
      try {
        const form = new FormData();
        const fileBuffer = fs.readFileSync(video.path);
        const blob = new Blob([fileBuffer], { type: 'video/webm' });
        form.append('file', blob, path.basename(video.path));
        form.append('runId', String(RUN_ID));
        form.append('cypressId', cypressId);

        await fetch(`${API_URL}/api/video`, {
          method: 'POST',
          headers: headers(),
          body: form,
        });
        console.log(`Dex Reporter: Video uploaded for ${cypressId}`);
      } catch (error) {
        console.error(`Dex Reporter: Error uploading video for ${cypressId}:`, error);
      }
    }
  }
}
