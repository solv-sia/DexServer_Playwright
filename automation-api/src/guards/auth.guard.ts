import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

const CYPRESS_USER_AGENT_REGEX = /^Cypress\/\d+\.\d+\.\d+(\.\d+)*/;

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const token = process.env.TOKEN;

    if (!token) {
      console.warn('[AUTH] TOKEN env var is not set — authentication is disabled');
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();

    const userAgent = req.headers['user-agent'] || '';
    if (!CYPRESS_USER_AGENT_REGEX.test(userAgent)) {
      throw new ForbiddenException('Forbidden: invalid User-Agent');
    }

    const authHeader = req.headers['authorization'] || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!bearerToken || bearerToken !== token) {
      throw new UnauthorizedException('Unauthorized: invalid or missing token');
    }

    return true;
  }
}
