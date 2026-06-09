import { NextRequest, NextResponse } from 'next/server';

const AUTH_TOKEN_KEY = 'auth_token';
const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/login', '/register', '/verify-otp'];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
