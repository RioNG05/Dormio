import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public (skip JWT auth guard).
 *
 * @example
 * @Public()
 * @Post('login')
 * async login() {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
