import { NextResponse } from 'next/server';
import { writeSecurityAuditLog } from '@/lib/server/admin-audit';
import { requestActorHash } from '@/lib/server/admin-auth';
import { enforceActorRateLimit } from '@/lib/server/rate-limit';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';

type SecurityEvent = 'login-failed' | 'password-reset-completed';

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
    if (length > 512) return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid security event.' }, { status: 400 });
    }
    const event = (body as { event?: unknown }).event;
    if (event !== 'login-failed' && event !== 'password-reset-completed') {
      return NextResponse.json({ error: 'Invalid security event.' }, { status: 400 });
    }

    await enforceActorRateLimit({
      scope: 'admin-security-event-ip',
      actorId: requestActorHash(request),
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    await writeSecurityAuditLog({
      action: event === 'login-failed' ? 'ADMIN_LOGIN_FAILED' : 'ADMIN_PASSWORD_RESET_COMPLETED',
      success: event === 'password-reset-completed',
      reason: event === 'login-failed'
        ? 'Unauthenticated admin login attempt reported by the sign-in client'
        : 'Password reset completion reported by the reset handler',
      metadata: { source: 'client-reported' },
    });
    return NextResponse.json({ ok: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && 'retryAfterSeconds' in error) {
      return NextResponse.json({ error: 'Too many security events.' }, { status: 429 });
    }
    console.error('Unable to record Super Admin security event.', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Unable to record this security event.' }, { status: 500 });
  }
}
