import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface CookieCapabilities {
  isLandlord?: boolean;
  isTenant?: boolean;
  isEmployee?: boolean;
  isAdmin?: boolean;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const role = request.cookies.get('dormio_user_role')?.value;
  const isLoggedIn = request.cookies.get('dormio_logged_in')?.value === 'true';

  // 0. Protected checkout route /pricing/:plan and /rooms/:id/deposit (requires login)
  if (
    (pathname.startsWith('/pricing/') && pathname !== '/pricing') ||
    (pathname.startsWith('/rooms/') && pathname.endsWith('/deposit'))
  ) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If auth cookie is not set yet (e.g. first load before localStorage sync),
  // let client-side AuthGuard perform the check and redirect.
  if (!isLoggedIn || !role) {
    return NextResponse.next();
  }

  // Setup wizard is accessible to all authenticated users
  if (pathname === '/landlord/setup' || pathname.startsWith('/landlord/setup')) {
    return NextResponse.next();
  }

  let capabilities: CookieCapabilities = {};
  try {
    const capCookie = request.cookies.get('dormio_user_capabilities')?.value;
    if (capCookie) {
      capabilities = JSON.parse(decodeURIComponent(capCookie));
    }
  } catch {
    // Ignore invalid JSON in cookie
  }

  // 1. System admin area: only admin or users with isAdmin capability
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin' && !capabilities.isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 2. Landlord dashboard area
  if (pathname.startsWith('/landlord')) {
    if (role !== 'landlord' && !capabilities.isLandlord) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 3. Tenant portal area
  if (pathname.startsWith('/tenant')) {
    if (role !== 'tenant' && !capabilities.isTenant) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 4. Staff portal area
  if (pathname.startsWith('/staff')) {
    if (role !== 'employee' && !capabilities.isEmployee) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/landlord/:path*',
    '/tenant/:path*',
    '/staff/:path*',
    '/pricing/:path*',
    '/rooms/:path*',
  ],
};
