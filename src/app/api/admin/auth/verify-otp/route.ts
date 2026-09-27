import { NextResponse } from 'next/server';
import { verifyOtpChallengeToken, createSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'E-mail e código de 6 dígitos são obrigatórios.' },
        { status: 400 }
      );
    }

    const cookiesHeader = request.headers.get('cookie') || '';
    const match = cookiesHeader.match(/rubybr_otp_challenge=([^;]+)/);
    const challengeToken = match ? decodeURIComponent(match[1]) : null;

    if (!challengeToken) {
      return NextResponse.json(
        { error: 'Sessão de verificação expirada. Por favor, solicite um novo código.' },
        { status: 401 }
      );
    }

    const isValid = verifyOtpChallengeToken(challengeToken, email, code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Código de 6 dígitos incorreto ou expirado.' },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken(email);

    const response = NextResponse.json({
      success: true,
      redirect: '/admin',
    });

    response.cookies.set('rubybr_otp_challenge', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('rubybr_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[AUTH ERROR] Erro na validação do OTP:', error);
    return NextResponse.json(
      { error: 'Erro interno ao validar código.' },
      { status: 500 }
    );
  }
}
