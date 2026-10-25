import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { BusinessErrorCode } from '../enums/business-error-code.enum'

interface ErrorResponse {
  success: false
  statusCode: number
  code: string
  message: string
  error: string | string[]
  path: string
  timestamp: string
  requiredTier?: string
  currentTier?: string
  upgradeUrl?: string
  [key: string]: unknown
}

/**
 * Global HTTP exception filter.
 * Normalizes all errors to a consistent JSON structure:
 * { success: false, statusCode, code, message, error, path, timestamp, ...extraPayload }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let statusCode: number
    let error: string | string[]
    let extraFields: Record<string, unknown> = {}
    let businessCode: string | undefined

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        error = exceptionResponse
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>
        // class-validator returns { message: string[] }
        error = (res.message as string | string[]) ?? (res.error as string) ?? exception.message
        if (typeof res.code === 'string') {
          businessCode = res.code
        }
        const { message: _m, error: _e, statusCode: _s, code: _c, ...rest } = res
        extraFields = rest
      } else {
        error = exception.message
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR
      error = 'Internal server error'

      // Log unexpected errors with full stack
      this.logger.error(
        `Unhandled exception: ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      )
    }

    // Determine fallback business code if not explicitly provided
    if (!businessCode) {
      if (Array.isArray(error)) {
        businessCode = BusinessErrorCode.COMMON_VALIDATION_ERROR
      } else if (statusCode === HttpStatus.UNAUTHORIZED) {
        businessCode = BusinessErrorCode.AUTH_UNAUTHORIZED
      } else if (statusCode === HttpStatus.FORBIDDEN) {
        businessCode = BusinessErrorCode.COMMON_FORBIDDEN
      } else if (statusCode === HttpStatus.NOT_FOUND) {
        businessCode = BusinessErrorCode.COMMON_RESOURCE_NOT_FOUND
      } else if (statusCode >= 500) {
        businessCode = BusinessErrorCode.COMMON_INTERNAL_ERROR
      } else {
        businessCode = BusinessErrorCode.COMMON_VALIDATION_ERROR
      }
    }

    const readableMessage = Array.isArray(error)
      ? error.join('. ')
      : typeof error === 'string'
        ? error
        : 'An error occurred while processing the request'

    const body: ErrorResponse = {
      success: false,
      statusCode,
      code: businessCode,
      message: readableMessage,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...extraFields,
    }

    response.status(statusCode).json(body)
  }
}

