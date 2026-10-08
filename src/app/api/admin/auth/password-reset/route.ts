import { after, NextResponse } from 'next/server';
import {
  adminPasswordResetConfigured,
  adminPasswordResetErrorResponse,
  deliverAdminPasswordReset,
  prepareAdminPasswordReset,
} from '@/lib/server/admin-password-reset-service';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';

export const maxDuration = 15;

export async function POST(request: Request) {
  const origin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
  if (!origin || request.headers.get('origin') !== origin) {
    return NextResponse.json({ error: 'This request origin is not allowed.' }, { status: 403 });
  }
  try {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ error: 'Request content type must be application/json.' }, { status: 415 });
    }
    const length = Number(request.headers.get('content-length') || '0');
    if (length > 4_096) return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }
    if (!adminPasswordResetConfigured()) {
      return NextResponse.json({ error: 'Password reset is temporarily unavailable.' }, { status: 503 });
    }
    const job = await prepareAdminPasswordReset((body as { email?: unknown }).email, request);
    after(async () => deliverAdminPasswordReset(job));
    return NextResponse.json(
      {
        ok: true,
        message: 'If an eligible Agora Admin account uses that address, reset instructions will be sent.',
      },
      { status: 202, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return adminPasswordResetErrorResponse(error);
  }
}
