import 'server-only';

import { getAdminAuth } from '@/lib/firebase-admin';
import { RateLimitError } from '@/lib/server/rate-limit';
import type { DecodedIdToken } from 'firebase-admin/auth';

export class EmailOtpRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'EmailOtpRequestError';
  }
}

export async function requireEmailOtpIdentity(request: Request): Promise<DecodedIdToken & { email: string }> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new EmailOtpRequestError('Authentication is required.', 401);
  }

  let identity: DecodedIdToken;
  try {
    identity = await getAdminAuth().verifyIdToken(authorization.slice(7), true);
  } catch {
    throw new EmailOtpRequestError('Authentication is required.', 401);
  }

  if (identity.superAdmin === true) {
    throw new EmailOtpRequestError('This account cannot use marketplace email verification.', 403);
  }
  if (identity.email_verified === true) {
    throw new EmailOtpRequestError('This email address is already verified.', 409);
  }
  if (typeof identity.email !== 'string' || !identity.email) {
    throw new EmailOtpRequestError('This account does not have an email address to verify.', 400);
  }

  return { ...identity, email: identity.email };
}

export function emailOtpErrorResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return Response.json(
      { error: error.message },
      { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
    );
  }
  if (error instanceof EmailOtpRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error('Email verification request failed.', {
    name: error instanceof Error ? error.name : 'UnknownError',
  });
  return Response.json({ error: 'Unable to complete email verification. Please try again.' }, { status: 500 });
}
