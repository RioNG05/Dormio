import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface CookieCapabilities {
  isLandlord?: boolean
  isTenant?: boolean
  isEmployee?: boolean
  isAdmin?: boolean
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const role = request.cookies.get('dormio_user_role')?.value
  const isLoggedIn = request.cookies.get('dormio_logged_in')?.value === 'true'

  // 0. Redirect hidden rental marketplace routes (BHRP) on frontend
  if (
    pathname === '/rooms' ||
    pathname.startsWith('/rooms/') ||
    pathname === '/saved-posts' ||
    pathname.startsWith('/saved-posts/') ||
    pathname === '/compare' ||
    pathname.startsWith('/compare/') ||
    pathname === '/posts' ||
    pathname.startsWith('/posts/') ||
    pathname === '/posters' ||
    pathname.startsWith('/posters/')
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname === '/pricing/rental-platform' || pathname.startsWith('/pricing/rental-platform/')) {
    return NextResponse.redirect(new URL('/pricing', request.url))
  }

  if (pathname === '/landlord/listings' || pathname.startsWith('/landlord/listings/')) {
    return NextResponse.redirect(new URL('/landlord', request.url))
  }

  if (pathname === '/admin/blogs' || pathname.startsWith('/admin/blogs/')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // 1. Protected checkout route /pricing/**/purchase (requires login)
  if (pathname.startsWith('/pricing/') && pathname.includes('/purchase')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url)
      const redirectTarget = pathname + (request.nextUrl.search || '')
      loginUrl.searchParams.set('redirect', redirectTarget)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If auth cookie is not set yet (e.g. first load before localStorage sync),
  // let client-side AuthGuard perform the check and redirect.
  if (!isLoggedIn || !role) {
    return NextResponse.next()
  }

  // Setup wizard is accessible to all authenticated users
  if (pathname === '/landlord/setup' || pathname.startsWith('/landlord/setup')) {
    return NextResponse.next()
  }

  let capabilities: CookieCapabilities = {}
  let hasCapCookie = false
  try {
    const capCookie = request.cookies.get('dormio_user_capabilities')?.value
    if (capCookie) {
      capabilities = JSON.parse(decodeURIComponent(capCookie))
      hasCapCookie = true
    }
  } catch {
    // Ignore invalid JSON in cookie
  }

  // 0. Superuser inspection: Admin has universal access across all dashboard portals
  if (role === 'admin' || capabilities.isAdmin) {
    return NextResponse.next()
  }

  // If capabilities cookie has not been synced yet, let client-side AuthGuard hydrate
  // and resolve capabilities from localStorage or API instead of prematurely rejecting
  if (!hasCapCookie) {
    return NextResponse.next()
  }

  // 1. System admin area: only admin or users with isAdmin capability
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin' && !capabilities.isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // 2. Landlord dashboard area
  if (pathname.startsWith('/landlord')) {
    if (role !== 'landlord' && !capabilities.isLandlord) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // 3. Tenant portal area
  if (pathname.startsWith('/tenant')) {
    if (role !== 'tenant' && !capabilities.isTenant) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // 4. Staff portal area
  if (pathname.startsWith('/staff')) {
    if (role !== 'employee' && !capabilities.isEmployee) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/landlord/:path*',
    '/tenant/:path*',
    '/staff/:path*',
    '/pricing/:path*',
    '/rooms/:path*',
    '/saved-posts/:path*',
    '/compare/:path*',
    '/posts/:path*',
    '/posters/:path*',
  ],
}
