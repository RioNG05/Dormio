import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string | string[];
  path: string;
  timestamp: string;
  code?: string;
  requiredTier?: string;
  currentTier?: string;
  upgradeUrl?: string;
  [key: string]: unknown;
}

/**
 * Global HTTP exception filter.
 * Normalizes all errors to a consistent JSON structure:
 * { success: false, statusCode, message, error, path, timestamp, ...extraPayload }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let error: string | string[];
    let extraFields: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        error = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, unknown>;
        // class-validator returns { message: string[] }
        error = (res.message as string | string[]) ?? (res.error as string) ?? exception.message;
        const { message: _m, error: _e, statusCode: _s, ...rest } = res;
        extraFields = rest;
      } else {
        error = exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal server error';

      // Log unexpected errors with full stack
      this.logger.error(
        `Unhandled exception: ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const readableMessage = Array.isArray(error)
      ? error.join('. ')
      : typeof error === 'string'
        ? error
        : 'An error occurred while processing the request';

    const body: ErrorResponse = {
      success: false,
      statusCode,
      message: readableMessage,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...extraFields,
    };

    response.status(statusCode).json(body);
  }
}
