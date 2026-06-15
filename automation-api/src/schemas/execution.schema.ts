import { Schema, Document } from 'mongoose';

export const EXECUTION_MODEL = 'Execution';

export interface ICaseResult {
  cypressId: string;
  status: string;
  statusId: number;
  comment: string;
  customComment?: string;
  elapsed?: string;
  defects?: string;
  testRailTestId?: number;
  testRailCaseId?: number;
  testRailResultId?: number;
  testRailSent: boolean;
  testRailError?: string;
  videoUploaded: boolean;
  videoAttachmentId?: number;
  receivedAt: Date;
}

export interface IExecution extends Document {
  runId: number;
  project: string;
  framework: string;
  testRailUrl: string;
  status: 'initialized' | 'in_progress' | 'completed' | 'failed';
  mappingsLoaded: number;
  totalTests: number;
  cases: ICaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    retest: number;
    untested: number;
    sentToTestRail: number;
    failedToSend: number;
  };
  startedAt: Date;
  completedAt?: Date;
}

export const CaseResultSchema = new Schema<ICaseResult>(
  {
    cypressId: { type: String, required: true },
    status: { type: String, required: true },
    statusId: { type: Number, required: true },
    comment: { type: String, default: '' },
    customComment: String,
    elapsed: String,
    defects: String,
    testRailTestId: Number,
    testRailCaseId: Number,
    testRailResultId: Number,
    testRailSent: { type: Boolean, default: false },
    testRailError: String,
    videoUploaded: { type: Boolean, default: false },
    videoAttachmentId: Number,
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const ExecutionSchema = new Schema<IExecution>(
  {
    runId: { type: Number, required: true, index: true },
    project: { type: String, required: true, index: true },
    framework: { type: String, required: true },
    testRailUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['initialized', 'in_progress', 'completed', 'failed'],
      default: 'initialized',
    },
    mappingsLoaded: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    cases: [CaseResultSchema],
    summary: {
      total: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      blocked: { type: Number, default: 0 },
      retest: { type: Number, default: 0 },
      untested: { type: Number, default: 0 },
      sentToTestRail: { type: Number, default: 0 },
      failedToSend: { type: Number, default: 0 },
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);
