export interface InitRequest {
  runId: number;
  project: string;
  framework: string;
  debug?: boolean;
}

export interface ResultRequest {
  runId: number;
  cypressId: string;
  status: 'passed' | 'failed' | 'blocked' | 'retest' | 'untested';
  comment?: string;
  elapsed?: string;
  defects?: string;
  customComment?: string;
}

export interface VideoRequest {
  runId: number;
  cypressId: string;
}

export interface TestMapping {
  caseId: number;
  testId: number;
  cypressId: string;
  resultId?: number;
}

export interface RunSession {
  runId: number;
  project: string;
  framework: string;
  username: string;
  password: string;
  testRailUrl: string;
  debug: boolean;
  mappings: Map<string, TestMapping>;
  resultsCount: number;
  createdAt: Date;
  executionId: string;
}

export const STATUS_MAP: Record<string, number> = {
  passed: 1,
  blocked: 2,
  untested: 3,
  retest: 4,
  failed: 5,
};
