import { NextResponse } from 'next/server';
import { emailOtpErrorResponse, requireEmailOtpIdentity } from '@/lib/server/email-otp-auth';
import { verifyEmailOtp } from '@/lib/server/email-otp-service';

export async function POST(request: Request) {
  try {
    const identity = await requireEmailOtpIdentity(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Enter the six-digit code from your email.' }, { status: 400 });
    }
    const code = body && typeof body === 'object' ? (body as Record<string, unknown>).code : undefined;
    await verifyEmailOtp(identity.uid, identity.email, code);
    return NextResponse.json({ ok: true, verified: true });
  } catch (error) {
    return emailOtpErrorResponse(error);
  }
}
