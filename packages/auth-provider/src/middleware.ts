import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface MiddlewareConfig {
  /** Routes that require authentication. Default: ['/profile', '/dashboard'] */
  protectedRoutes?: string[];

  /** Path to redirect unauthenticated users. Default: '/' */
  loginPath?: string;

  /** Name of the access token cookie. Default: 'eg_access_token' */
  cookieName?: string;
}

/**
 * Creates a Next.js middleware function that protects routes requiring authentication.
 *
 * @example
 * // middleware.ts
 * import { createAuthMiddleware } from '@easygoal/auth-provider/middleware';
 *
 * export const middleware = createAuthMiddleware({
 *   protectedRoutes: ['/profile', '/dashboard'],
 * });
 *
 * export const config = {
 *   matcher: ['/((?!_next|favicon|auth).*)'],
 * };
 */
export function createAuthMiddleware({
  protectedRoutes = ['/profile', '/dashboard'],
  loginPath = '/',
  cookieName = 'eg_access_token',
}: MiddlewareConfig = {}) {
  return function middleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    );

    if (!isProtected) return NextResponse.next();

    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('redirect_after', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  };
}
