import { NextResponse } from 'next/server';
import { emailOtpErrorResponse, requireEmailOtpIdentity } from '@/lib/server/email-otp-auth';
import { issueEmailOtp } from '@/lib/server/email-otp-service';

export async function POST(request: Request) {
  try {
    const identity = await requireEmailOtpIdentity(request);
    await issueEmailOtp(identity.uid, identity.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return emailOtpErrorResponse(error);
  }
}
