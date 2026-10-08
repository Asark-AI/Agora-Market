import 'server-only';

import { createHash } from 'node:crypto';
import { getAdminAuth } from '@/lib/firebase-admin';
import { passwordResetEmail } from '@/lib/password-reset-email';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';

export class PasswordResetRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'PasswordResetRequestError';
  }
}

function getEmailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from || /your-domain\.com|replace_with|placeholder/i.test(from)) {
    throw new PasswordResetRequestError('Password reset email is not configured. Please contact support.', 503);
  }
  return { apiKey, from };
}

export function passwordResetEmailConfigured() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  return Boolean(apiKey && from && !/your-domain\.com|replace_with|placeholder/i.test(from));
}

function appOrigin() {
  const origin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
  if (!origin) throw new PasswordResetRequestError('Password reset is not configured for this environment.', 503);
  return origin;
}

function supportUrl(origin: string) {
  const configured = process.env.AGORA_SUPPORT_URL?.trim();
  if (!configured) return `${origin}/about`;
  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      throw new Error('Invalid support URL.');
    }
    return parsed.toString();
  } catch {
    throw new PasswordResetRequestError('Password reset email configuration is invalid.', 503);
  }
}

async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  apiKey: string,
  from: string,
  supportPage: string,
) {
  const template = passwordResetEmail({
    resetUrl,
    supportUrl: supportPage,
  });
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
        subject: template.subject,
        text: template.text,
        html: template.html,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error('Resend password reset request failed.', error instanceof Error ? error.name : 'Unknown error');
    throw new PasswordResetRequestError('We could not send a password reset email. Please try again.', 502);
  }

  if (!response.ok) {
    console.error('Resend rejected a password reset email.', { status: response.status });
    throw new PasswordResetRequestError('We could not send a password reset email. Please try again.', 502);
  }
}

export type PasswordResetJob = {
  email: string;
  apiKey: string;
  from: string;
  origin: string;
  supportPage: string;
};

export async function preparePasswordReset(emailValue: string): Promise<PasswordResetJob> {
  const email = emailValue.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new PasswordResetRequestError('Enter a valid email address.', 400);
  }

  const emailKey = createHash('sha256').update(email).digest('hex');
  await enforceActorRateLimit({
    scope: 'password-reset-email',
    actorId: emailKey,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  const origin = appOrigin();
  const { apiKey, from } = getEmailConfiguration();
  const supportPage = supportUrl(origin);
  return { email, apiKey, from, origin, supportPage };
}

export async function deliverPasswordReset(job: PasswordResetJob) {
  try {
    const resetUrl = await getAdminAuth().generatePasswordResetLink(job.email, {
      url: `${job.origin}/sign-in`,
      handleCodeInApp: false,
    });
    await sendPasswordResetEmail(job.email, resetUrl, job.apiKey, job.from, job.supportPage);
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    if (code === 'auth/user-not-found') return;
    console.error('Password reset delivery failed.', {
      errorType: error instanceof Error ? error.name : 'Unknown error',
      code: typeof code === 'string' ? code : undefined,
      status: error instanceof PasswordResetRequestError ? error.status : undefined,
    });
  }
}

export function passwordResetErrorResponse(error: unknown) {
  if (error instanceof PasswordResetRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof RateLimitError) {
    return Response.json({ error: 'Too many reset requests. Please wait before trying again.' }, { status: 429 });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  console.error('Unexpected password reset request failure.');
  return Response.json({ error: 'We could not process your password reset request. Please try again.' }, { status: 500 });
}
