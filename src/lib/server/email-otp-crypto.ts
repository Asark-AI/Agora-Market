import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const EMAIL_OTP_LENGTH = 6;

export function generateEmailOtp() {
  return randomInt(0, 1_000_000).toString().padStart(EMAIL_OTP_LENGTH, '0');
}

export function generateEmailOtpSalt() {
  return randomBytes(32).toString('hex');
}

export function hashEmailOtp(code: string, salt: string, secret: string) {
  if (!/^\d{6}$/.test(code)) throw new Error('Email verification code must be six digits.');
  if (!/^[a-f0-9]{64}$/.test(salt)) throw new Error('Email verification salt is invalid.');
  if (secret.length < 32) throw new Error('EMAIL_OTP_HMAC_SECRET must contain at least 32 characters.');
  return createHmac('sha256', secret).update(`${salt}:${code}`).digest('hex');
}

export function matchesEmailOtp(code: string, salt: string, expectedHash: string, secret: string) {
  if (!/^\d{6}$/.test(code) || !/^[a-f0-9]{64}$/.test(expectedHash)) return false;
  const actualHash = Buffer.from(hashEmailOtp(code, salt, secret), 'hex');
  const storedHash = Buffer.from(expectedHash, 'hex');
  return timingSafeEqual(actualHash, storedHash);
}
