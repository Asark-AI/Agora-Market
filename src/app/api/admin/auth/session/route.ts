import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { writeAuditLog } from '@/lib/server/admin-audit';
import { ADMIN_SESSION_COOKIE, requestActorHash, requireSuperAdminToken } from '@/lib/server/admin-auth';
import { enforceActorRateLimit } from '@/lib/server/rate-limit';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';

const SESSION_DURATION_SECONDS = 4 * 60 * 60;

function allowedOrigin(request: Request) {
  const origin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
  return Boolean(origin && request.headers.get('origin') === origin);
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) {
    return NextResponse.json({ error: 'This request origin is not allowed.' }, { status: 403 });
  }

  try {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    }
    const idToken = authorization.slice(7);
    const identity = await requireSuperAdminToken(idToken);
    await Promise.all([
      enforceActorRateLimit({
        scope: 'admin-session-uid',
        actorId: identity.uid,
        limit: 8,
        windowMs: 10 * 60 * 1000,
      }),
      enforceActorRateLimit({
        scope: 'admin-session-ip',
        actorId: requestActorHash(request),
        limit: 20,
        windowMs: 10 * 60 * 1000,
      }),
    ]);

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_SECONDS * 1000,
    });
    await writeAuditLog({
      admin: identity,
      action: 'ADMIN_LOGIN',
      targetType: 'super-admin-session',
      targetId: identity.uid,
      reason: 'Verified Firebase sign-in with TOTP MFA',
      success: true,
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && 'retryAfterSeconds' in error) {
      return NextResponse.json(
        { error: 'Too many admin sign-in attempts. Please wait before trying again.' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: 'Admin sign-in could not be verified. Confirm your email and TOTP authenticator, then try again.' },
      { status: 403 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
