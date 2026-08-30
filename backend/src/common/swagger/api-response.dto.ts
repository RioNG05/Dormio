import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic success response wrapper — mirrors TransformInterceptor output.
 * Usage: @ApiOkResponse({ type: ApiSuccessResponse(MyDto) })
 */
export function ApiSuccessResponse<T>(DataType: new (...args: any[]) => T) {
  class SuccessResponseWrapper {
    @ApiProperty({ example: true })
    success: true;

    @ApiProperty({ type: () => DataType })
    data: T;
  }

  Object.defineProperty(SuccessResponseWrapper, 'name', {
    value: `ApiSuccessResponse<${DataType.name}>`,
  });

  return SuccessResponseWrapper;
}

/**
 * Generic paginated response wrapper.
 * Usage: @ApiOkResponse({ type: ApiPaginatedResponse(MyDto) })
 */
export function ApiPaginatedResponse<T>(DataType: new (...args: any[]) => T) {
  class PaginationMeta {
    @ApiProperty({ example: 100, description: 'Total number of items' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page number (1-indexed)' })
    page: number;

    @ApiProperty({ example: 10, description: 'Number of items per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total number of pages' })
    totalPages: number;
  }

  class PaginatedResponseWrapper {
    @ApiProperty({ example: true })
    success: true;

    @ApiProperty({ isArray: true, type: () => DataType })
    data: T[];

    @ApiProperty({ type: () => PaginationMeta })
    meta: PaginationMeta;
  }

  Object.defineProperty(PaginatedResponseWrapper, 'name', {
    value: `ApiPaginatedResponse<${DataType.name}>`,
  });

  return PaginatedResponseWrapper;
}

/**
 * Standard error response shape — mirrors HttpExceptionFilter output.
 */
export class ApiErrorResponse {
  @ApiProperty({ example: false })
  success: false;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    description: 'Error code string or array of validation messages',
    oneOf: [
      { type: 'string', example: 'phone_number_already_exists' },
      { type: 'array', items: { type: 'string' }, example: ['field must not be empty'] },
    ],
  })
  error: string | string[];

  @ApiProperty({ example: '/api/v1/auth/register', description: 'Request path' })
  path: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: 'ISO 8601 timestamp' })
  timestamp: string;
}
