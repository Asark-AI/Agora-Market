import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { requestActorHash } from '@/lib/server/admin-auth';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';

type ResetCodeResponse = {
  email?: unknown;
  requestType?: unknown;
};

function invalidLink() {
  return NextResponse.json(
    { error: 'This reset link is invalid, expired, or unavailable. Request a new Admin reset link.' },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  const origin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
  if (!origin || request.headers.get('origin') !== origin) {
    return NextResponse.json({ error: 'This request origin is not allowed.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Request content type must be application/json.' }, { status: 415 });
  }

  try {
    const length = Number(request.headers.get('content-length') || '0');
    if (length > 8_192) return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    const body: unknown = await request.json();
    const oobCode = body && typeof body === 'object' && !Array.isArray(body)
      ? (body as { oobCode?: unknown }).oobCode
      : null;
    if (typeof oobCode !== 'string' || oobCode.length < 1 || oobCode.length > 4_096) {
      return invalidLink();
    }

    const codeHash = createHash('sha256').update(oobCode).digest('hex');
    await Promise.all([
      enforceActorRateLimit({
        scope: 'admin-password-reset-validation-code',
        actorId: codeHash,
        limit: 5,
        windowMs: 15 * 60 * 1000,
      }),
      enforceActorRateLimit({
        scope: 'admin-password-reset-validation-ip',
        actorId: requestActorHash(request),
        limit: 15,
        windowMs: 15 * 60 * 1000,
      }),
    ]);

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Admin password reset is temporarily unavailable.' }, { status: 503 });
    }
    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode }),
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!firebaseResponse.ok) return invalidLink();

    const resetCode = await firebaseResponse.json() as ResetCodeResponse;
    if (resetCode.requestType !== 'PASSWORD_RESET' || typeof resetCode.email !== 'string') return invalidLink();

    const user = await getAdminAuth().getUserByEmail(resetCode.email);
    const hasTotp = user.multiFactor?.enrolledFactors.some((factor) => factor.factorId === 'totp') === true;
    if (user.disabled || !user.emailVerified || user.customClaims?.role !== 'super_admin' || !hasTotp) {
      return invalidLink();
    }

    return NextResponse.json(
      { email: user.email },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Too many reset validations. Request a new link later.' },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds), 'Cache-Control': 'no-store' } },
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    console.error('Unable to validate Super Admin password reset link.', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: 'Admin password reset validation is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
