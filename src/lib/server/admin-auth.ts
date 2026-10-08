import 'server-only';

import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_COOKIE = '__session';
const ADMIN_SESSION_COOKIE = 'agora_admin_session';
const ADMIN_ROLE = 'super_admin';

export type AdminIdentity = Pick<DecodedIdToken, 'uid' | 'email' | 'name'> & {
  role: typeof ADMIN_ROLE;
  isSuperAdmin: true;
};

function hasTotpSecondFactor(identity: DecodedIdToken) {
  const firebaseClaims = identity.firebase as { sign_in_second_factor?: unknown } | undefined;
  return firebaseClaims?.sign_in_second_factor === 'totp';
}

export function hasSuperAdminRole(identity: DecodedIdToken) {
  return identity.role === ADMIN_ROLE;
}

export function isSuperAdminIdentity(identity: DecodedIdToken) {
  return hasSuperAdminRole(identity)
    && identity.email_verified === true
    && hasTotpSecondFactor(identity);
}

export function requestActorHash(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  const actor = request.headers.get('x-real-ip')?.trim() || forwarded || 'unknown';
  return createHash('sha256').update(actor).digest('hex');
}

async function activeAdminIdentity(identity: DecodedIdToken): Promise<AdminIdentity | null> {
  if (!isSuperAdminIdentity(identity)) return null;
  const user = await getAdminAuth().getUser(identity.uid);
  if (user.disabled || !user.emailVerified || user.customClaims?.role !== ADMIN_ROLE) return null;

  return {
    uid: identity.uid,
    email: identity.email,
    name: identity.name,
    role: ADMIN_ROLE,
    isSuperAdmin: true,
  };
}

async function verifyCookieSession(cookieName: string): Promise<DecodedIdToken | null> {
  const session = (await cookies()).get(cookieName)?.value;
  if (!session) return null;

  try {
    return await getAdminAuth().verifySessionCookie(session, true);
  } catch {
    return null;
  }
}

export async function verifySession(): Promise<DecodedIdToken | null> {
  return verifyCookieSession(SESSION_COOKIE);
}

async function verifiedAdminSession() {
  const decodedToken = await verifyCookieSession(ADMIN_SESSION_COOKIE);
  if (!decodedToken) return null;
  const identity = await activeAdminIdentity(decodedToken);
  return identity ? { decodedToken, identity } : null;
}

export async function verifyAdminSession(): Promise<DecodedIdToken | null> {
  return (await verifiedAdminSession())?.decodedToken || null;
}

export async function verifyMarketplaceSession(): Promise<DecodedIdToken | null> {
  const decodedToken = await verifySession();
  if (
    !decodedToken
    || hasSuperAdminRole(decodedToken)
    || decodedToken.superAdmin === true
    || decodedToken.email_verified !== true
  ) return null;
  return decodedToken;
}

export async function verifySuperAdminSession(): Promise<AdminIdentity | null> {
  return (await verifiedAdminSession())?.identity || null;
}

export async function requireAuthenticatedUser(): Promise<DecodedIdToken> {
  const decodedToken = await verifySession();
  if (!decodedToken) redirect('/sign-in');
  return decodedToken;
}

export async function requireSuperAdmin(): Promise<AdminIdentity> {
  const session = await verifiedAdminSession();
  if (!session) redirect('/admin/sign-in');
  return session.identity;
}

export async function requireSuperAdminToken(idToken: string): Promise<AdminIdentity> {
  if (!idToken) throw new Error('Authentication token is required.');

  const decodedToken = await getAdminAuth().verifyIdToken(idToken, true);
  const identity = await activeAdminIdentity(decodedToken);
  if (!identity) throw new Error('Super Admin access with verified email and TOTP MFA is required.');
  return identity;
}

export { ADMIN_SESSION_COOKIE, SESSION_COOKIE };
