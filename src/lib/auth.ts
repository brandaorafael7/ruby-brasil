import crypto from 'crypto';

const SECRET = process.env.ADMIN_JWT_SECRET || 'rubybr_neon_production_admin_secret_key_2026_xyz';

export function isEmailAuthorized(email: string): boolean {
  const allowedList = [
    ...(process.env.ADMIN_EMAILS || '').split(','),
    ...(process.env.GMAIL_USER || '').split(','),
  ]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedList.length === 0) {
    console.warn('[AUTH] ADMIN_EMAILS não configurado no .env.');
    return false;
  }

  return allowedList.includes(email.trim().toLowerCase());
}

export function hashOtp(code: string, email: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

export function createOtpChallengeToken(email: string, code: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const codeHash = hashOtp(code, cleanEmail);
  const payload = {
    email: cleanEmail,
    codeHash,
    exp: Date.now() + 15 * 60 * 1000,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifyOtpChallengeToken(
  token: string,
  email: string,
  inputCode: string
): boolean {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (signature !== expectedSignature) return false;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return false;

    const cleanEmail = email.trim().toLowerCase();
    if (payload.email !== cleanEmail) return false;

    const expectedHash = hashOtp(inputCode, cleanEmail);
    return crypto.timingSafeEqual(
      Buffer.from(payload.codeHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch {
    return false;
  }
}

export function createSessionToken(email: string): string {
  const payload = {
    email: email.trim().toLowerCase(),
    role: 'ADMIN',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): { email: string } | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return null;

    return { email: payload.email };
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(request: Request): { email: string } | null {
  try {
    const cookiesHeader = request.headers.get('cookie') || '';
    const match = cookiesHeader.match(/rubybr_admin_session=([^;]+)/);
    const sessionToken = match ? decodeURIComponent(match[1]) : null;

    if (!sessionToken) return null;
    return verifySessionToken(sessionToken);
  } catch {
    return null;
  }
}

