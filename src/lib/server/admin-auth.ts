import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_COOKIE = '__session';

export type AdminIdentity = Pick<DecodedIdToken, 'uid' | 'email' | 'name'> & {
  isSuperAdmin: true;
};

export async function verifySession(): Promise<DecodedIdToken | null> {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    return await getAdminAuth().verifySessionCookie(session, true);
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUser(): Promise<DecodedIdToken> {
  const decodedToken = await verifySession();
  if (!decodedToken) redirect('/sign-in');
  return decodedToken;
}

export async function requireSuperAdmin(): Promise<AdminIdentity> {
  const decodedToken = await requireAuthenticatedUser();
  if (decodedToken.superAdmin !== true) redirect('/');

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name,
    isSuperAdmin: true,
  };
}

export async function requireSuperAdminToken(idToken: string): Promise<AdminIdentity> {
  if (!idToken) throw new Error('Authentication token is required.');

  const decodedToken = await getAdminAuth().verifyIdToken(idToken, true);
  if (decodedToken.superAdmin !== true) throw new Error('Super Admin access is required.');

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name,
    isSuperAdmin: true,
  };
}

export { SESSION_COOKIE };
