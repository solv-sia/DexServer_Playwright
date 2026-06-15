import { Injectable, Optional, Inject } from '@nestjs/common';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import {
  InitRequest,
  ResultRequest,
  TestMapping,
  RunSession,
  STATUS_MAP,
} from '../interfaces/testrail.interfaces';
import { ICaseResult, IExecution, EXECUTION_MODEL } from '../schemas/execution.schema';
import { ConfigService } from '@nestjs/config';
import { logger } from '../logger/logger';
import { enrichEvent, setContextError } from '../logger/request-context';

@Injectable()
export class ReporterService {
  private sessions: Map<number, RunSession> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(getModelToken(EXECUTION_MODEL)) private executionModel: Model<IExecution> | null
  ) {}

  private getAuth(session: RunSession): string {
    return Buffer.from(`${session.username}:${session.password}`).toString('base64');
  }

  private async apiRequest(
    session: RunSession,
    method: string,
    uri: string,
    data: any = null
  ): Promise<AxiosResponse> {
    const url = `${session.testRailUrl}/index.php?/api/v2/${uri}`;
    const auth = this.getAuth(session);

    if (session.debug) {
      logger.debug(`TestRail API: ${method} ${uri}`, { logger: 'ReporterService' });
    }

    return axios({
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      data,
    });
  }

  private normalizeId(id: string | number): string {
    return id.toString().replace(/^@?C?/, '').trim();
  }

  private findMapping(session: RunSession, cypressId: string): TestMapping | null {
    const normalizedId = this.normalizeId(cypressId);

    let mapping = session.mappings.get(normalizedId);
    if (mapping) return mapping;

    const variants = [
      cypressId,
      `C${normalizedId}`,
      `@${normalizedId}`,
      `@C${normalizedId}`,
    ];

    for (const variant of variants) {
      mapping = session.mappings.get(variant);
      if (mapping) return mapping;
    }

    return null;
  }

  private updateSummary(execution: any): void {
    const cases = execution.cases as ICaseResult[];
    execution.summary = {
      total: cases.length,
      passed: cases.filter((c: ICaseResult) => c.status === 'passed').length,
      failed: cases.filter((c: ICaseResult) => c.status === 'failed').length,
      blocked: cases.filter((c: ICaseResult) => c.status === 'blocked').length,
      retest: cases.filter((c: ICaseResult) => c.status === 'retest').length,
      untested: cases.filter((c: ICaseResult) => c.status === 'untested').length,
      sentToTestRail: cases.filter((c: ICaseResult) => c.testRailSent).length,
      failedToSend: cases.filter((c: ICaseResult) => !c.testRailSent).length,
    };
  }

  async initSession(request: InitRequest): Promise<{ runId: number; executionId: string; mappingsLoaded: number; totalTests: number }> {
    const testRailUrl = this.configService.get('TESTRAIL_URL');
    const username = this.configService.get('TESTRAIL_USERNAME');
    const password = this.configService.get('TESTRAIL_PASSWORD');
    
    const session: RunSession = {
      runId: request.runId,
      project: request.project,
      framework: request.framework,
      username: username,
      password: password,
      testRailUrl,
      debug: request.debug ?? false,
      mappings: new Map(),
      resultsCount: 0,
      createdAt: new Date(),
      executionId: '',
    };

    // Cargar mapeos del test run
    const response = await this.apiRequest(session, 'GET', `get_tests/${request.runId}`);

    let mappingsLoaded = 0;
    const tests = response.data?.tests || [];

    for (const test of tests) {
      if (test.custom_case_cypress_id) {
        const normalizedId = this.normalizeId(test.custom_case_cypress_id);

        const mapping: TestMapping = {
          caseId: test.case_id,
          testId: test.id,
          cypressId: test.custom_case_cypress_id,
        };

        session.mappings.set(normalizedId, mapping);

        if (normalizedId !== test.custom_case_cypress_id) {
          session.mappings.set(test.custom_case_cypress_id, { ...mapping });
        }

        mappingsLoaded++;
      }
    }

    if (this.executionModel) {
      const execution = await this.executionModel.create({
        runId: request.runId,
        project: request.project,
        framework: request.framework,
        testRailUrl,
        status: 'initialized',
        mappingsLoaded,
        totalTests: tests.length,
        cases: [],
        summary: {
          total: 0, passed: 0, failed: 0, blocked: 0,
          retest: 0, untested: 0, sentToTestRail: 0, failedToSend: 0,
        },
      });
      session.executionId = execution._id.toString();
    }
    this.sessions.set(request.runId, session);

    enrichEvent({
      run_id: request.runId,
      project: request.project,
      framework: request.framework,
      mappings_loaded: mappingsLoaded,
      total_tests: tests.length,
    });

    return {
      runId: request.runId,
      executionId: session.executionId,
      mappingsLoaded,
      totalTests: tests.length,
    };
  }

  async addResult(request: ResultRequest): Promise<{ success: boolean; resultId?: number; message: string }> {
    const session = this.sessions.get(request.runId);
    if (!session) {
      throw new Error(`No session found for run #${request.runId}. Call /api/init first.`);
    }

    const mapping = this.findMapping(session, request.cypressId);

    const statusId = STATUS_MAP[request.status] || STATUS_MAP.untested;

    // Preparar el case result para MongoDB
    const caseResult: ICaseResult = {
      cypressId: request.cypressId,
      status: request.status,
      statusId,
      comment: request.customComment || request.comment || '',
      customComment: request.customComment,
      elapsed: request.elapsed,
      defects: request.defects,
      testRailTestId: mapping?.testId,
      testRailCaseId: mapping?.caseId,
      testRailSent: false,
      videoUploaded: false,
      receivedAt: new Date(),
    };

    if (!mapping) {
      enrichEvent({ cypress_id: request.cypressId, run_id: request.runId, testrail_sent: false, outcome: 'no_mapping' });
      caseResult.testRailError = `No mapping found for cypressId: ${request.cypressId}`;

      // Persistir caso fallido en MongoDB
      await this.persistCaseResult(session.executionId, caseResult);

      return {
        success: false,
        message: `No mapping found for cypressId: ${request.cypressId}`,
      };
    }

    // Enviar a TestRail
    const resultData = {
      status_id: statusId,
      comment: caseResult.comment,
      elapsed: request.elapsed || null,
      defects: request.defects || null,
    };

    try {
      const response = await this.apiRequest(
        session,
        'POST',
        `add_result/${mapping.testId}`,
        resultData
      );

      if (response.data?.id) {
        mapping.resultId = response.data.id;
        session.resultsCount++;

        caseResult.testRailResultId = response.data.id;
        caseResult.testRailSent = true;

        enrichEvent({ cypress_id: request.cypressId, test_id: mapping.testId, result_id: response.data.id, status: request.status, testrail_sent: true });

        await this.persistCaseResult(session.executionId, caseResult);

        return {
          success: true,
          resultId: response.data.id,
          message: `Result sent to TestRail: ${request.cypressId} = ${request.status}`,
        };
      }

      caseResult.testRailError = 'TestRail did not return a result ID';
      await this.persistCaseResult(session.executionId, caseResult);

      return { success: false, message: 'TestRail did not return a result ID' };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || String(error);
      caseResult.testRailError = errorMsg;

      enrichEvent({ cypress_id: request.cypressId, testrail_sent: false });
      setContextError(error instanceof Error ? error : new Error(errorMsg));

      await this.persistCaseResult(session.executionId, caseResult);

      throw error;
    }
  }

  async uploadVideo(
    runId: number,
    cypressId: string,
    filePath: string
  ): Promise<{ success: boolean; attachmentId?: number; message: string }> {
    enrichEvent({ run_id: runId, cypress_id: cypressId, file_path: filePath });

    const session = this.sessions.get(runId);
    if (!session) {
      throw new Error(`No session found for run #${runId}. Call /api/init first.`);
    }

    const mapping = this.findMapping(session, cypressId);
    if (!mapping) {
      return { success: false, message: `No mapping found for cypressId: ${cypressId}` };
    }

    let resultId = mapping.resultId;

    if (!resultId) {
      try {
        const resultsResponse = await this.apiRequest(
          session,
          'GET',
          `get_results_for_run/${runId}`
        );

        if (resultsResponse.data?.length > 0) {
          const specificResult = resultsResponse.data.find(
            (result: any) => result.test_id === mapping.testId
          );
          if (specificResult) {
            resultId = specificResult.id;
            mapping.resultId = resultId;
          }
        }
      } catch (err) {
        enrichEvent({ video_fetch_results_error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (!resultId) {
      return { success: false, message: `No result ID found for ${cypressId}. Send a result first.` };
    }

    if (!fs.existsSync(filePath)) {
      return { success: false, message: `Video file not found: ${filePath}` };
    }

    const formData = new FormData();
    formData.append('attachment', fs.createReadStream(filePath));

    const url = `${session.testRailUrl}/index.php?/api/v2/add_attachment_to_result/${resultId}`;
    const auth = this.getAuth(session);

    const response = await axios({
      method: 'POST',
      url,
      headers: {
        Authorization: `Basic ${auth}`,
        ...formData.getHeaders(),
      },
      data: formData,
      maxBodyLength: Infinity,
      timeout: 60000,
    });

    const attachmentId = response.data?.attachment_id;

    // Actualizar caso en MongoDB con info del video
    if (this.executionModel) await this.executionModel.updateOne(
      { _id: session.executionId, 'cases.cypressId': cypressId },
      {
        $set: {
          'cases.$.videoUploaded': true,
          'cases.$.videoAttachmentId': attachmentId,
        },
      }
    );

    enrichEvent({ cypress_id: cypressId, result_id: resultId, attachment_id: attachmentId, video_uploaded: true });

    return {
      success: true,
      attachmentId,
      message: `Video attached to result ${resultId}`,
    };
  }

  private async persistCaseResult(executionId: string, caseResult: ICaseResult): Promise<void> {
    if (!this.executionModel) return;

    const execution = await this.executionModel.findById(executionId);
    if (!execution) {
      logger.error(`Execution not found in DB`, { logger: 'ReporterService', events: { execution_id: executionId } });
      return;
    }

    // Reemplazar si ya existe un caso con el mismo cypressId, o agregar
    const existingIndex = execution.cases.findIndex(c => c.cypressId === caseResult.cypressId);
    if (existingIndex >= 0) {
      execution.cases[existingIndex] = caseResult;
    } else {
      execution.cases.push(caseResult);
    }

    if (execution.status === 'initialized') {
      execution.status = 'in_progress';
    }

    this.updateSummary(execution);
    await execution.save();
  }

  getSessionStatus(runId: number): {
    exists: boolean;
    runId: number;
    executionId?: string;
    project?: string;
    framework?: string;
    mappingsCount?: number;
    resultsCount?: number;
    createdAt?: Date;
  } {
    const session = this.sessions.get(runId);
    if (!session) {
      return { exists: false, runId };
    }

    return {
      exists: true,
      runId: session.runId,
      executionId: session.executionId,
      project: session.project,
      framework: session.framework,
      mappingsCount: session.mappings.size,
      resultsCount: session.resultsCount,
      createdAt: session.createdAt,
    };
  }

  getActiveSessions(): number[] {
    return Array.from(this.sessions.keys());
  }
}
