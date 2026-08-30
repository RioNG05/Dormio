import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ApiErrorResponse } from './api-response.dto';

/**
 * Applies JWT bearer auth + standard 401/403 responses.
 * Use on every protected endpoint instead of repeating decorators manually.
 *
 * @example
 * @ApiAuth()
 * @Get('profile')
 */
export function ApiAuth() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid JWT token',
      type: ApiErrorResponse,
    }),
    ApiForbiddenResponse({
      description: 'Insufficient role permissions',
      type: ApiErrorResponse,
    }),
  );
}

/**
 * Documents the required X-Boarding-House-Id header for BHMS landlord endpoints.
 * Apply alongside @ApiAuth() on every BHMS landlord endpoint.
 * The header is validated server-side by PropertyOwnershipGuard.
 *
 * @example
 * @ApiAuth()
 * @ApiBoardingHouseHeader()
 * @Get('rooms')
 */
export function ApiBoardingHouseHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'X-Boarding-House-Id',
      description:
        'UUID of the boarding house to scope the operation to. ' +
        'Required for all BHMS landlord endpoints. ' +
        'Validated server-side by PropertyOwnershipGuard — never trusted from client alone.',
      required: true,
      schema: {
        type: 'string',
        format: 'uuid',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
    }),
  );
}
