import 'server-only';

import { createHash } from 'node:crypto';
import { getAdminAuth } from '@/lib/firebase-admin';
import { adminPasswordResetEmail } from '@/lib/admin-password-reset-email';
import { writeSecurityAuditLog } from '@/lib/server/admin-audit';
import { requestActorHash } from '@/lib/server/admin-auth';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';

export class AdminPasswordResetError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'AdminPasswordResetError';
  }
}

function emailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const validFrom = from && !/your-domain\.com|replace_with|placeholder/i.test(from) ? from : null;
  if ((!apiKey || !validFrom) && !firebaseApiKey) {
    throw new AdminPasswordResetError('Password reset email is not configured.', 503);
  }
  return { apiKey: apiKey && validFrom ? apiKey : null, from: validFrom, firebaseApiKey };
}

export function adminPasswordResetConfigured() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const hasResend = Boolean(apiKey && from && !/your-domain\.com|replace_with|placeholder/i.test(from));
  return hasResend || Boolean(firebaseApiKey);
}

function trustedOrigin() {
  const origin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
  if (!origin) throw new AdminPasswordResetError('Admin password reset is not configured.', 503);
  return origin;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') throw new AdminPasswordResetError('Enter a valid email address.', 400);
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AdminPasswordResetError('Enter a valid email address.', 400);
  }
  return email;
}

export async function prepareAdminPasswordReset(value: unknown, request: Request) {
  const email = normalizeEmail(value);
  const emailHash = createHash('sha256').update(email).digest('hex');
  await Promise.all([
    enforceActorRateLimit({
      scope: 'admin-password-reset-email',
      actorId: emailHash,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    }),
    enforceActorRateLimit({
      scope: 'admin-password-reset-ip',
      actorId: requestActorHash(request),
      limit: 10,
      windowMs: 60 * 60 * 1000,
    }),
  ]);

  const emailConfig = emailConfiguration();
  const origin = trustedOrigin();
  const supportUrl = process.env.AGORA_SUPPORT_URL?.trim() || `${origin}/about`;
  if (process.env.AGORA_SUPPORT_URL?.trim()) {
    let parsed: URL;
    try {
      parsed = new URL(supportUrl);
    } catch {
      throw new AdminPasswordResetError('Admin password reset email configuration is invalid.', 503);
    }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      throw new AdminPasswordResetError('Admin password reset email configuration is invalid.', 503);
    }
  }

  await writeSecurityAuditLog({
    action: 'ADMIN_PASSWORD_RESET_REQUESTED',
    success: true,
    reason: 'Super Admin password reset requested',
  });

  return { email, ...emailConfig, origin, supportUrl };
}

export async function deliverAdminPasswordReset(job: Awaited<ReturnType<typeof prepareAdminPasswordReset>>) {
  try {
    const user = await getAdminAuth().getUserByEmail(job.email);
    if (
      user.disabled
      || !user.emailVerified
      || user.customClaims?.role !== 'super_admin'
    ) return;

    if (!job.apiKey || !job.from) {
      if (!job.firebaseApiKey) {
        console.error('Admin password reset email delivery is not configured.');
        return;
      }
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(job.firebaseApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email: job.email,
            continueUrl: `${job.origin}/admin/sign-in`,
            canHandleCodeInApp: false,
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!response.ok) {
        console.error('Admin password reset email delivery failed.', {
          provider: 'firebase-auth',
          status: response.status,
        });
      }
      return;
    }

    const resetUrl = await getAdminAuth().generatePasswordResetLink(job.email, {
      url: `${job.origin}/admin/sign-in`,
      handleCodeInApp: false,
    });
    const template = adminPasswordResetEmail({ resetUrl, supportUrl: job.supportUrl });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${job.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: job.from,
        to: [job.email],
        subject: template.subject,
        text: template.text,
        html: template.html,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error('Admin password reset email delivery failed.', { status: response.status });
    }
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    if (code !== 'auth/user-not-found') {
      console.error('Admin password reset delivery failed.', {
        errorType: error instanceof Error ? error.name : 'UnknownError',
        code: typeof code === 'string' ? code : undefined,
      });
    }
  }
}

export function adminPasswordResetErrorResponse(error: unknown) {
  if (error instanceof AdminPasswordResetError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof RateLimitError) {
    return Response.json(
      { error: 'Too many reset requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
    );
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  console.error('Unexpected admin password reset request failure.', {
    errorType: error instanceof Error ? error.name : 'UnknownError',
  });
  return Response.json({ error: 'We could not process the request. Please try again.' }, { status: 500 });
}
