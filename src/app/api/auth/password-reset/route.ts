import { after, NextResponse } from 'next/server';
import {
  deliverPasswordReset,
  passwordResetEmailConfigured,
  passwordResetErrorResponse,
  preparePasswordReset,
} from '@/lib/server/password-reset-service';
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
    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > 4_096) {
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    }
    if (!request.body) return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > 4_096) {
        await reader.cancel();
        return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
      }
      chunks.push(value);
    }
    const bodyBytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body: unknown = JSON.parse(new TextDecoder().decode(bodyBytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }
    const email = (body as { email?: unknown }).email;
    if (typeof email !== 'string') {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!passwordResetEmailConfigured()) {
      return NextResponse.json({ error: 'Password reset email is not configured. Please contact support.' }, { status: 503 });
    }
    const resetJob = await preparePasswordReset(email);
    after(async () => {
      await deliverPasswordReset(resetJob);
    });
    return NextResponse.json(
      {
        ok: true,
        message: 'If an account exists for that email, password reset instructions will be sent. If you do not receive an email, wait a few minutes before trying again.',
      },
      { status: 202, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return passwordResetErrorResponse(error);
  }
}
