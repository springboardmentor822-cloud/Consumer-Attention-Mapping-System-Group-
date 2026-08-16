import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route-level guard: runs on the server/edge before a page renders, so it
// can read the httpOnly `access_token` cookie that client-side JS can't see.
//
// NOTE: this only checks that the cookie is PRESENT, not that it's a valid,
// unexpired JWT — verifying the signature here would need a JWT library
// that works in the Edge runtime (e.g. `jose`, the npm package — unrelated
// to the backend's Python `python-jose`) plus the same SECRET_KEY shared
// with the frontend. That's a reasonable next step, but a forged/expired
// cookie would still fail on the backend, since every real API call re-
// validates the token there. This middleware's job is just to stop an
// obviously logged-out user from momentarily seeing the dashboard shell
// before an API call 401s.
const PROTECTED_PREFIXES = ['/dashboard'];
const COOKIE_NAME = 'access_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME);
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
