import winston from 'winston';
import * as os from 'os';

const LOG_MODE = process.env.LOG_MODE ?? 'clf';

export const resource = {
  'service.name': process.env.SERVICE_NAME ?? 'automation-api',
  'service.version': process.env.SERVICE_VERSION ?? '1.0.0',
  'service.environment': process.env.NODE_ENV ?? 'production',
  'service.node.name': process.env.HOSTNAME ?? os.hostname(),
};

const LEVEL_MAP: Record<string, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  verbose: 'TRACE',
  debug: 'DEBUG',
  silly: 'TRACE',
};

function makeJsonFormat(): winston.Logform.Format {
  return winston.format.printf((info) => {
    const level = LEVEL_MAP[info.level] ?? info.level.toUpperCase();
    const err = info.error as Error | undefined;
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      'log.level': level,
      'log.logger': (info.logger as string) ?? 'automation-api',
      'log.origin.file.name': '',
      'log.origin.file.line': '',
      'log.origin.function': '',
      message: info.message,
      'error.type': err?.constructor?.name ?? '',
      'error.message': err?.message ?? '',
      'error.stack_trace': err?.stack ?? '',
      'process.thread.name': `pid-${process.pid}`,
      resource,
      events: (info.events as Record<string, unknown>) ?? {},
    };
    return JSON.stringify(entry);
  });
}

function makeClfFormat(): winston.Logform.Format {
  return winston.format.printf((info) => {
    const level = LEVEL_MAP[info.level] ?? info.level.toUpperCase();
    const loggerName = (info.logger as string) ?? 'automation-api';
    const ts = new Date().toISOString();
    const thread = `pid-${process.pid}`;
    const events = (info.events as Record<string, unknown>) ?? {};
    const err = info.error as Error | undefined;

    const eventStr = Object.entries(events)
      .map(([k, v]) => (typeof v === 'string' ? `${k}="${v}"` : `${k}=${v}`))
      .join(' ');

    const errorSuffix = err
      ? ` error.type=${err.constructor?.name ?? 'Error'} error.message="${err.message}"`
      : '';

    let line = `${ts} ${level} [${loggerName}] "${info.message}" service=${resource['service.name']} version=${resource['service.version']} env=${resource['service.environment']} thread=${thread}`;
    if (eventStr) line += ` ${eventStr}`;
    line += errorSuffix;
    if (err?.stack) line += `\n${err.stack}`;
    return line;
  });
}

export const logger = winston.createLogger({
  level: 'info',
  format: LOG_MODE === 'json' ? makeJsonFormat() : makeClfFormat(),
  transports: [new winston.transports.Console()],
});
