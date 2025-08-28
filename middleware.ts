import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect routes under /dashboard and other app sections
const protectedPaths = ['/dashboard', '/campaigns', '/subscriber-lists', '/subscribers', '/templates'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Allow static files and api routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Try to detect session cookie (NextAuth default cookie names)
  const token = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');

  // If user is on the signin page and already authenticated, redirect to callback or dashboard
  if (pathname === '/signin' && token) {
    const url = new URL(request.url);
    const callback = url.searchParams.get('callbackUrl') || '/dashboard';
    return NextResponse.redirect(new URL(callback, request.url));
  }

  const isProtected = protectedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !token) {
    const signInUrl = new URL('/signin', request.url);
    // preserve original path as callback so we can return after login
    const original = pathname + (search || '');
    signInUrl.searchParams.set('callbackUrl', original);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
