import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from './request-context';
import { logger } from './logger';

const SILENT_ROUTES = new Set(['/api/health']);

@Injectable()
export class WideEventMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const requestPath = req.originalUrl?.split('?')[0] ?? req.path;
    const isSilent = req.method === 'GET' && SILENT_ROUTES.has(requestPath);

    const ctx = {
      events: {
        method: req.method,
        path: requestPath,
        request_id: (req.headers['x-request-id'] as string) ?? randomUUID(),
      } as Record<string, unknown>,
      error: undefined as Error | undefined,
    };

    requestContext.run(ctx, () => {
      if (!isSilent) {
        logger.debug(`← ${req.method} ${requestPath}`, {
          logger: 'WideEventMiddleware',
          events: { method: req.method, path: requestPath, request_id: ctx.events.request_id },
        });
      }

      res.on('finish', () => {
        if (isSilent) return;

        ctx.events.status_code = res.statusCode;
        ctx.events.duration_ms = Date.now() - start;
        ctx.events.outcome = res.statusCode < 400 ? 'success' : 'error';
        const message = `${req.method} ${requestPath} ${res.statusCode}`;
        const level = res.statusCode >= 500 ? 'error' : 'info';
        logger.log(level, message, {
          logger: 'WideEventMiddleware',
          events: ctx.events,
          error: ctx.error,
        });
      });
      next();
    });
  }
}
