import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  events: Record<string, unknown>;
  error?: Error;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function enrichEvent(fields: Record<string, unknown>): void {
  const ctx = requestContext.getStore();
  if (ctx) Object.assign(ctx.events, fields);
}

export function setContextError(err: Error): void {
  const ctx = requestContext.getStore();
  if (ctx) ctx.error = err;
}
