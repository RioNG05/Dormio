import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Global response transform interceptor.
 * Automatically wraps every controller response in:
 * { success: true, data: <original response> }
 *
 * Controllers can return raw objects — no need to wrap manually.
 * Pagination: return { data: [...], meta: { total, page, limit } }
 * and the interceptor wraps the whole thing as `data`.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response: T) => {
        // If the controller already returned { success, data } format, pass through
        if (
          response !== null &&
          typeof response === 'object' &&
          'success' in (response as object)
        ) {
          return response as unknown as ApiResponse<T>;
        }

        return {
          success: true as const,
          data: response,
        };
      }),
    );
  }
}
