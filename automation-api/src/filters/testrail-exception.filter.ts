import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class TestrailExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    console.error(`[ERROR] ${request.method} ${request.path} - ${exception?.message}`);

    // Errores de TestRail API (axios con response)
    if (exception?.response?.status && exception?.response?.data !== undefined) {
      const axiosResp = exception.response;
      console.error('TestRail API error:', {
        status: axiosResp.status,
        data: axiosResp.data,
      });

      response.status(axiosResp.status || 502).json({
        success: false,
        error: 'TestRail API error',
        detail: axiosResp.data?.error || exception.message,
        statusCode: axiosResp.status,
      });
      return;
    }

    // Excepciones HTTP de NestJS (guards, validation, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      response.status(status).json({
        success: false,
        error:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exceptionResponse.message,
      });
      return;
    }

    // Error genérico
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: exception?.message || 'Internal server error',
    });
  }
}
