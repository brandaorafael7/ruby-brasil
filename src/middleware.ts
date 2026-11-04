import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SECRET = process.env.ADMIN_JWT_SECRET || 'rubybr_neon_production_admin_secret_key_2026_xyz';

function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(str);
  const buffer = new ArrayBuffer(encoded.byteLength);
  new Uint8Array(buffer).set(encoded);
  return buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlToString(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function verifyEdgeSessionToken(token: string): Promise<boolean> {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return false;

    const key = await crypto.subtle.importKey(
      'raw',
      stringToArrayBuffer(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signedBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      stringToArrayBuffer(encodedPayload)
    );

    const expectedSignature = arrayBufferToBase64Url(signedBuffer);

    if (signature.length !== expectedSignature.length) return false;
    let diff = 0;
    for (let i = 0; i < signature.length; i++) {
      diff |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    if (diff !== 0) return false;

    const payloadJson = decodeBase64UrlToString(encodedPayload);
    const payload = JSON.parse(payloadJson);

    if (!payload.exp || Date.now() > payload.exp) return false;
    if (payload.role !== 'ADMIN' || !payload.email) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Permitir acesso livre a login e rotas de auth
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/api/admin/auth')
  ) {
    return NextResponse.next();
  }

  // 2. Proteger rotas /admin e /api/admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const sessionCookie = request.cookies.get('rubybr_admin_session')?.value;

    const isValid = sessionCookie ? await verifyEdgeSessionToken(sessionCookie) : false;

    if (!isValid) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Não autorizado. Faça login como administrador.' },
          { status: 401 }
        );
      }

      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export default middleware;

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
