import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { isEmailAuthorized, createOtpChallengeToken } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAuthorized = isEmailAuthorized(cleanEmail);

    let challengeToken = '';

    if (isAuthorized) {
      const otpCode = crypto.randomInt(100000, 999999).toString();

      await sendOtpEmail({
        to: cleanEmail,
        otpCode,
        expiresInMinutes: 15,
      });

      challengeToken = createOtpChallengeToken(cleanEmail, otpCode);
    } else {
      challengeToken = createOtpChallengeToken(cleanEmail, '000000');
    }

    const response = NextResponse.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado como administrador, o código de acesso foi enviado.',
    });

    response.cookies.set('rubybr_otp_challenge', challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('[AUTH ERROR] Erro ao enviar OTP:', error);
    return NextResponse.json(
      { error: 'Não foi possível enviar o código por e-mail. Verifique suas credenciais do Gmail SMTP no .env.' },
      { status: 500 }
    );
  }
}
