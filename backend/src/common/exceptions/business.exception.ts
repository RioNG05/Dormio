import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common'
import { BusinessErrorCode } from '../enums/business-error-code.enum'

export interface BusinessErrorPayload {
  code: BusinessErrorCode
  message: string
  statusCode?: HttpStatus
  details?: Record<string, unknown>
}

/**
 * Standard business exception for domain logic rejections.
 * Always includes a typed `code` from BusinessErrorCode for client-side i18n mapping.
 */
export class BusinessException extends HttpException {
  public readonly code: BusinessErrorCode
  public readonly details?: Record<string, unknown>

  constructor(
    code: BusinessErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>,
  ) {
    super(
      {
        code,
        message,
        statusCode: status,
        ...details,
      },
      status,
    )
    this.code = code
    this.details = details
  }
}

export class BusinessNotFoundException extends NotFoundException {
  public readonly code: BusinessErrorCode
  public readonly details?: Record<string, unknown>

  constructor(code: BusinessErrorCode, message: string, details?: Record<string, unknown>) {
    super({ code, message, error: 'Not Found', statusCode: HttpStatus.NOT_FOUND, ...details })
    this.code = code
    this.details = details
  }
}

export class BusinessBadRequestException extends BadRequestException {
  public readonly code: BusinessErrorCode
  public readonly details?: Record<string, unknown>

  constructor(code: BusinessErrorCode, message: string, details?: Record<string, unknown>) {
    super({ code, message, error: 'Bad Request', statusCode: HttpStatus.BAD_REQUEST, ...details })
    this.code = code
    this.details = details
  }
}

export class BusinessForbiddenException extends ForbiddenException {
  public readonly code: BusinessErrorCode
  public readonly details?: Record<string, unknown>

  constructor(code: BusinessErrorCode, message: string, details?: Record<string, unknown>) {
    super({ code, message, error: 'Forbidden', statusCode: HttpStatus.FORBIDDEN, ...details })
    this.code = code
    this.details = details
  }
}

export class BusinessConflictException extends ConflictException {
  public readonly code: BusinessErrorCode
  public readonly details?: Record<string, unknown>

  constructor(code: BusinessErrorCode, message: string, details?: Record<string, unknown>) {
    super({ code, message, error: 'Conflict', statusCode: HttpStatus.CONFLICT, ...details })
    this.code = code
    this.details = details
  }
}

export class BusinessUnauthorizedException extends UnauthorizedException {
  public readonly code: BusinessErrorCode
  public readonly details?: Record<string, unknown>

  constructor(code: BusinessErrorCode, message: string, details?: Record<string, unknown>) {
    super({ code, message, error: 'Unauthorized', statusCode: HttpStatus.UNAUTHORIZED, ...details })
    this.code = code
    this.details = details
  }
}

