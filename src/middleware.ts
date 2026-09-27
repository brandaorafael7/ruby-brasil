import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Permitir acesso livre a login e rotas de auth
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/api/admin/auth')
  ) {
    return NextResponse.next();
  }

  // 2. Proteger rotas /admin
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('rubybr_admin_session')?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const [encodedPayload, signature] = sessionCookie.split('.');
      if (!encodedPayload || !signature) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }

      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = atob(base64);
      const payload = JSON.parse(jsonPayload);

      if (!payload.exp || Date.now() > payload.exp) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export default middleware;

export const config = {
  matcher: ['/admin/:path*'],
};
