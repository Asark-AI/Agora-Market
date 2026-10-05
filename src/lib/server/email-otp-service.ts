import 'server-only';

import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';
import { EmailOtpRequestError } from '@/lib/server/email-otp-auth';
import { generateEmailOtp, generateEmailOtpSalt, hashEmailOtp, matchesEmailOtp } from '@/lib/server/email-otp-crypto';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const secret = () => process.env.EMAIL_OTP_HMAC_SECRET || '';

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function emailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from || /your-domain\.com|replace_with|placeholder/i.test(from)) {
    throw new EmailOtpRequestError('Email verification is not configured. Please contact support.', 503);
  }
  if (secret().length < 32) {
    throw new EmailOtpRequestError('Email verification is not configured. Please contact support.', 503);
  }
  return { apiKey, from };
}

async function sendVerificationEmail(to: string, code: string, apiKey: string, from: string) {
  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Your Agora verification code',
        text: `Your Agora email verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
        html: `<p>Your Agora email verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error('Resend email request failed.', error instanceof Error ? error.name : 'Unknown error');
    throw new EmailOtpRequestError('We could not send a verification email. Please try again.', 502);
  }

  if (!response.ok) {
    console.error('Resend rejected an email verification request.', { status: response.status });
    throw new EmailOtpRequestError('We could not send a verification email. Please try again.', 502);
  }
}

export async function issueEmailOtp(uid: string, email: string) {
  await enforceActorRateLimit({ scope: 'email-otp-send', actorId: uid, limit: 3, windowMs: 15 * 60 * 1000 });
  const { apiKey, from } = emailConfiguration();
  const now = Date.now();
  const expiresAt = now + OTP_TTL_MS;
  const ref = getAdminDb().collection('emailVerificationOtps').doc(uid);
  const code = generateEmailOtp();
  const salt = generateEmailOtpSalt();
  const challengeId = randomUUID();

  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const previous = snapshot.data();
    if (previous && Number(previous.resendAfterMs) > now) {
      throw new EmailOtpRequestError('Wait before requesting another verification code.', 429);
    }
    transaction.set(ref, {
      uid,
      email: normalizedEmail(email),
      status: 'pending',
      codeHash: hashEmailOtp(code, salt, secret()),
      salt,
      attempts: 0,
      challengeId,
      createdAt: Timestamp.fromMillis(now),
      expiresAt: Timestamp.fromMillis(expiresAt),
      resendAfterMs: now + RESEND_COOLDOWN_MS,
    });
  });

  try {
    await sendVerificationEmail(email, code, apiKey, from);
  } catch (error) {
    await getAdminDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.get('challengeId') === challengeId) transaction.delete(ref);
    });
    throw error;
  }
}

export async function verifyEmailOtp(uid: string, email: string, code: unknown) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    throw new EmailOtpRequestError('Enter the six-digit code from your email.', 400);
  }
  await enforceActorRateLimit({ scope: 'email-otp-verify', actorId: uid, limit: 10, windowMs: 15 * 60 * 1000 });
  const hmacSecret = secret();
  if (hmacSecret.length < 32) {
    throw new EmailOtpRequestError('Email verification is not configured. Please contact support.', 503);
  }

  const adminAuth = getAdminAuth();
  const user = await adminAuth.getUser(uid);
  if (!user.email || normalizedEmail(user.email) !== normalizedEmail(email)) {
    throw new EmailOtpRequestError('The email address for this account has changed. Request a new code.', 409);
  }
  if (user.emailVerified) return;

  const ref = getAdminDb().collection('emailVerificationOtps').doc(uid);
  const result = await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new EmailOtpRequestError('The code is invalid or expired. Request a new code.', 400);
    const challenge = snapshot.data() || {};
    if (normalizedEmail(String(challenge.email || '')) !== normalizedEmail(email)) {
      throw new EmailOtpRequestError('The code is invalid or expired. Request a new code.', 400);
    }
    if (challenge.status === 'verified') return { verified: true };
    if (challenge.status !== 'pending' || !(challenge.expiresAt instanceof Timestamp) || challenge.expiresAt.toMillis() <= Date.now()) {
      transaction.delete(ref);
      return { verified: false };
    }

    const attempts = Number(challenge.attempts || 0);
    if (!Number.isSafeInteger(attempts) || attempts < 0 || attempts >= MAX_ATTEMPTS) {
      return { verified: false };
    }
    if (!matchesEmailOtp(code, String(challenge.salt || ''), String(challenge.codeHash || ''), hmacSecret)) {
      transaction.update(ref, {
        attempts: attempts + 1,
        ...(attempts + 1 >= MAX_ATTEMPTS ? { status: 'locked' } : {}),
      });
      return { verified: false };
    }

    transaction.update(ref, {
      status: 'verified',
      verifiedAt: Timestamp.now(),
      codeHash: FieldValue.delete(),
      salt: FieldValue.delete(),
    });
    return { verified: true };
  });

  if (!result.verified) {
    throw new EmailOtpRequestError('The code is invalid or expired. Request a new code.', 400);
  }

  await adminAuth.updateUser(uid, { emailVerified: true });
  await ref.delete();
}

export { RateLimitError };
