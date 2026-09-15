import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { requireSuperAdminToken, type AdminIdentity } from '@/lib/server/admin-auth';
import { writeAuditLog } from '@/lib/server/admin-audit';

const RECENT_AUTH_WINDOW_SECONDS = 10 * 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;

type AccountAction = 'change-email' | 'change-password' | 'prepare-replacement' | 'confirm-replacement';

type AccountRequest = {
  action?: AccountAction;
  email?: string;
  password?: string;
  promoteExisting?: boolean;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}

async function authorize(request: Request, requireRecentAuth = true) {
  const idToken = getBearerToken(request);
  if (!idToken) throw new Error('AUTHENTICATION_REQUIRED');

  const identity = await requireSuperAdminToken(idToken);
  const decodedToken = await getAdminAuth().verifyIdToken(idToken, true);
  const authTime = Number(decodedToken.auth_time || 0);
  if (requireRecentAuth && (!authTime || Math.floor(Date.now() / 1000) - authTime > RECENT_AUTH_WINDOW_SECONDS)) {
    throw new Error('RECENT_AUTH_REQUIRED');
  }

  return { idToken, identity, decodedToken };
}

function normalizeEmail(email: unknown) {
  if (typeof email !== 'string') throw new Error('INVALID_EMAIL');
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized) || normalized.length > 254) throw new Error('INVALID_EMAIL');
  return normalized;
}

function normalizePassword(password: unknown) {
  if (typeof password !== 'string' || !PASSWORD_PATTERN.test(password)) throw new Error('WEAK_PASSWORD');
  return password;
}

async function audit(admin: AdminIdentity, action: Parameters<typeof writeAuditLog>[0]['action'], targetId: string, success: boolean, metadata: Record<string, unknown> = {}) {
  await writeAuditLog({ admin, action, targetType: 'super-admin-account', targetId, reason: 'Super Admin account management', success, metadata });
}

async function getActiveSuperAdmins() {
  const result: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = await getAdminAuth().listUsers(1000, pageToken);
    for (const user of page.users) {
      if (!user.disabled && user.customClaims?.superAdmin === true) result.push(user.uid);
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return result;
}

async function promoteUser(uid: string) {
  const auth = getAdminAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...user.customClaims, superAdmin: true });
  await getAdminDb().collection('users').doc(uid).set({
    id: uid,
    email: user.email || '',
    role: 'Admin',
    updatedAt: new Date(),
  }, { merge: true });
  return auth.getUser(uid);
}

export async function GET(request: Request) {
  try {
    const { identity } = await authorize(request, false);
    const user = await getAdminAuth().getUser(identity.uid);
    return NextResponse.json({ email: user.email || null, emailVerified: user.emailVerified, uid: user.uid });
  } catch {
    return errorResponse('Unable to load Super Admin account information.', 403);
  }
}

export async function POST(request: Request) {
  let identity: AdminIdentity | undefined;
  let action: AccountAction | undefined;
  try {
    const body = (await request.json()) as AccountRequest;
    action = body.action;
    if (!action) return errorResponse('Invalid account operation.', 400);

    const authorized = await authorize(request, true);
    identity = authorized.identity;
    const auth = getAdminAuth();
    const db = getAdminDb();
    const currentUser = await auth.getUser(identity.uid);

    if (action === 'change-email') {
      const email = normalizeEmail(body.email);
      if (email === currentUser.email?.toLowerCase()) return errorResponse('Enter a different email address.', 400);
      try {
        const existing = await auth.getUserByEmail(email);
        if (existing.uid !== identity.uid) return errorResponse('That email address is already associated with an account.', 409);
      } catch (error) {
        if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
      }
      await auth.updateUser(identity.uid, { email, emailVerified: false });
      await db.collection('users').doc(identity.uid).set({ email, emailVerified: false, updatedAt: new Date() }, { merge: true });
      await audit(identity, 'CHANGE_SUPER_ADMIN_EMAIL', identity.uid, true, { emailVerified: false });
      return NextResponse.json({ ok: true, email, emailVerified: false });
    }

    if (action === 'change-password') {
      const password = normalizePassword(body.password);
      await auth.updateUser(identity.uid, { password });
      await audit(identity, 'CHANGE_SUPER_ADMIN_PASSWORD', identity.uid, true);
      return NextResponse.json({ ok: true });
    }

    if (action === 'prepare-replacement') {
      const email = normalizeEmail(body.email);
      if (email === currentUser.email?.toLowerCase()) return errorResponse('Enter a different email address.', 400);
      let target = null;
      try {
        target = await auth.getUserByEmail(email);
      } catch (error) {
        if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
      }

      if (target && !body.promoteExisting) {
        return NextResponse.json({ error: 'That email address is already associated with an account.', code: 'ACCOUNT_EXISTS' }, { status: 409 });
      }

      const replacement = target ?? await auth.createUser({ email, emailVerified: false, disabled: false });
      const promoted = await promoteUser(replacement.uid);
      await db.collection('superAdminReplacementRequests').doc(identity.uid).set({
        actorUid: identity.uid,
        targetUid: promoted.uid,
        targetEmail: email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        status: 'pending-confirmation',
      });
      await audit(identity, 'CREATE_SUPER_ADMIN', promoted.uid, true, { existingAccount: Boolean(target) });
      return NextResponse.json({ ok: true, targetEmail: email, targetUid: promoted.uid, existingAccount: Boolean(target), requiresConfirmation: true });
    }

    const requestRef = db.collection('superAdminReplacementRequests').doc(identity.uid);
    const requestSnapshot = await requestRef.get();
    const replacement = requestSnapshot.data();
    if (!requestSnapshot.exists || !replacement || replacement.status !== 'pending-confirmation' || replacement.expiresAt.toDate() < new Date()) {
      return errorResponse('The replacement request has expired. Start again.', 400);
    }
    if (replacement.actorUid !== identity.uid || replacement.targetUid === identity.uid) return errorResponse('Invalid replacement request.', 400);

    const target = await auth.getUser(replacement.targetUid);
    if (target.disabled || target.customClaims?.superAdmin !== true) return errorResponse('The new Super Admin is not ready to be activated.', 409);

    const activeAdmins = await getActiveSuperAdmins();
    if (!activeAdmins.includes(target.uid)) return errorResponse('The new Super Admin is not active.', 409);
    if (activeAdmins.length < 2) return errorResponse('A second active Super Admin is required before replacing this account.', 409);

    await auth.updateUser(identity.uid, { disabled: true });
    await requestRef.update({ status: 'completed', completedAt: new Date() });
    await audit(identity, 'DISABLE_SUPER_ADMIN', identity.uid, true, { replacementUid: target.uid });
    return NextResponse.json({ ok: true, targetEmail: target.email || replacement.targetEmail });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'AUTHENTICATION_REQUIRED') return errorResponse('Authentication is required.', 401);
    if (code === 'RECENT_AUTH_REQUIRED') return errorResponse('For your security, please sign in again before changing this information.', 401);
    if (code === 'INVALID_EMAIL') return errorResponse('Enter a valid email address.', 400);
    if (code === 'WEAK_PASSWORD') return errorResponse('Your new password does not meet the security requirements.', 400);
    if (code === 'auth/email-already-exists') return errorResponse('That email address is already associated with an account.', 409);
    if (identity && action) await audit(identity, action === 'change-email' ? 'CHANGE_SUPER_ADMIN_EMAIL' : action === 'change-password' ? 'CHANGE_SUPER_ADMIN_PASSWORD' : action === 'confirm-replacement' ? 'DISABLE_SUPER_ADMIN' : 'CREATE_SUPER_ADMIN', identity.uid, false);
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}
