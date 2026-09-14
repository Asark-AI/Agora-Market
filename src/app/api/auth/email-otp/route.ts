import { createHash, randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const OTP_COLLECTION = 'emailVerificationOtps';
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashOtp(email: string, otp: string) {
  return createHash('sha256').update(`${email}:${otp}:${process.env.FIREBASE_ADMIN_PROJECT_ID || 'agora'}`).digest('hex');
}

async function sendOtpEmail(email: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Email delivery is not configured.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your Agora verification code',
      text: `Your Agora verification code is ${otp}. It expires in 10 minutes. If you did not create this account, you can ignore this email.`,
    }),
  });
  if (!response.ok) throw new Error('Unable to send verification email.');
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; action?: 'send' | 'verify'; code?: string };
    const email = normalizeEmail(body.email || '');
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });

    const ref = getAdminDb().collection(OTP_COLLECTION).doc(encodeURIComponent(email));
    const snapshot = await ref.get();
    const existing = snapshot.exists ? snapshot.data() as { createdAt?: { toMillis: () => number }; lastSentAt?: { toMillis: () => number }; attempts?: number; verifiedAt?: unknown; otpHash?: string } : null;

    if (body.action === 'verify') {
      const code = String(body.code || '').trim();
      if (!/^\d{6}$/.test(code) || !existing?.createdAt || existing.attempts === undefined || existing.attempts >= 5) {
        return NextResponse.json({ error: 'That verification code is invalid or expired.' }, { status: 400 });
      }
      const createdAt = existing.createdAt.toMillis();
      if (Date.now() - createdAt > OTP_TTL_MS || hashOtp(email, code) !== existing.otpHash) {
        await ref.update({ attempts: (existing.attempts || 0) + 1 });
        return NextResponse.json({ error: 'That verification code is invalid or expired.' }, { status: 400 });
      }
      await ref.update({ verifiedAt: new Date(), otpHash: null, attempts: 0 });
      return NextResponse.json({ verified: true });
    }

    if (existing?.lastSentAt && Date.now() - existing.lastSentAt.toMillis() < RESEND_COOLDOWN_MS) {
      return NextResponse.json({ error: 'Please wait before requesting another code.' }, { status: 429 });
    }
    const otp = String(randomInt(100000, 1000000));
    await sendOtpEmail(email, otp);
    await ref.set({ otpHash: hashOtp(email, otp), createdAt: new Date(), lastSentAt: new Date(), attempts: 0 }, { merge: true });
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Email OTP error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process verification.' }, { status: 500 });
  }
}
