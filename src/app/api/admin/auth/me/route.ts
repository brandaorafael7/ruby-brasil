import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookiesHeader = request.headers.get('cookie') || '';
    const match = cookiesHeader.match(/rubybr_admin_session=([^;]+)/);
    const sessionToken = match ? decodeURIComponent(match[1]) : null;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = verifySessionToken(sessionToken);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      email: session.email,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
