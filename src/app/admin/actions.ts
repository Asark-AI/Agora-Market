'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { requireSuperAdminToken } from '@/lib/server/admin-auth';
import { writeAuditLog } from '@/lib/server/admin-audit';

type ModerationTarget = 'seller' | 'product' | 'user';

function assertReason(reason: string) {
  if (!reason || reason.trim().length < 5 || reason.length > 500) throw new Error('A reason between 5 and 500 characters is required.');
  return reason.trim();
}

function assertTransition(current: string, next: string, allowed: Record<string, string[]>) {
  if (!allowed[current]?.includes(next)) throw new Error(`Cannot change ${current || 'unknown'} to ${next}.`);
}

function assertId(value: string, label: string) {
  if (!value || value.length > 256 || /[\s/]/.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }
}

async function verifySuperAdmin(idToken: string, targetUserId?: string) {
  const identity = await requireSuperAdminToken(idToken);
  if (targetUserId && identity.uid === targetUserId) {
    throw new Error('You cannot delete your own Super Admin account.');
  }
  if (targetUserId) {
    const target = await getAdminAuth().getUser(targetUserId);
    if (target.customClaims?.superAdmin === true) throw new Error('Privileged Super Admin accounts cannot be modified.');
  }
  return identity;
}

export async function deleteAdminUser(idToken: string, userId: string, reason: string) {
  assertId(userId, 'user ID');
  if (!reason || reason.trim().length < 5) throw new Error('A deletion reason is required.');
  const admin = await verifySuperAdmin(idToken, userId);

  const auth = getAdminAuth();
  const db = getAdminDb();
  try {
    await auth.deleteUser(userId);
    await db.collection('users').doc(userId).delete();
    await writeAuditLog({ admin, action: 'DELETE_USER', targetType: 'user', targetId: userId, reason: reason.trim(), success: true });
  } catch (error) {
    await writeAuditLog({ admin, action: 'DELETE_USER', targetType: 'user', targetId: userId, reason: reason.trim(), success: false });
    throw new Error('Unable to delete the user profile. The operation was recorded for investigation.');
  }
}

export async function deleteAdminProduct(idToken: string, sellerId: string, productId: string, reason: string) {
  assertId(sellerId, 'seller ID');
  assertId(productId, 'product ID');
  if (!reason || reason.trim().length < 5) throw new Error('A deletion reason is required.');
  const admin = await verifySuperAdmin(idToken);

  try {
    await getAdminDb().collection('sellers').doc(sellerId).collection('products').doc(productId).delete();
    await writeAuditLog({ admin, action: 'DELETE_PRODUCT', targetType: 'product', targetId: productId, reason: reason.trim(), success: true, metadata: { sellerId } });
  } catch {
    await writeAuditLog({ admin, action: 'DELETE_PRODUCT', targetType: 'product', targetId: productId, reason: reason.trim(), success: false, metadata: { sellerId } });
    throw new Error('Unable to delete the product. The operation was recorded for investigation.');
  }
}

async function moderateDocument(idToken: string, targetType: ModerationTarget, targetId: string, nextStatus: string, reason: string, sellerId?: string) {
  const admin = await requireSuperAdminToken(idToken);
  const cleanReason = assertReason(reason);
  const db = getAdminDb();
  const ref = targetType === 'seller'
    ? db.collection('sellers').doc(targetId)
    : targetType === 'product'
      ? db.collection('sellers').doc(sellerId || '').collection('products').doc(targetId)
      : db.collection('users').doc(targetId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error(`${targetType} not found.`);
  const currentStatus = String(snapshot.get('status') || (targetType === 'user' ? 'active' : 'pending')).toLowerCase();
  const transitions = targetType === 'seller'
    ? { pending: ['approved', 'rejected'], approved: ['active', 'suspended'], active: ['suspended'], suspended: ['active'] }
    : targetType === 'product'
      ? { draft: ['pending_review'], pending_review: ['approved', 'rejected'], rejected: ['pending_review'], approved: ['active'], active: ['archived'], archived: ['active'] }
      : { active: ['suspended'], suspended: ['active'] };
  assertTransition(currentStatus, nextStatus, transitions);
  if (targetType === 'user') {
    const target = await getAdminAuth().getUser(targetId);
    if (target.customClaims?.superAdmin === true) throw new Error('Privileged Super Admin accounts cannot be modified.');
    await getAdminAuth().updateUser(targetId, { disabled: nextStatus === 'suspended' });
  }
  await ref.update({ status: nextStatus, moderationReason: cleanReason, moderatedBy: admin.uid, moderatedAt: new Date() });
  await writeAuditLog({ admin, action: `${nextStatus === 'approved' ? 'APPROVE' : nextStatus === 'rejected' ? 'REJECT' : nextStatus === 'suspended' ? 'SUSPEND' : nextStatus === 'archived' ? 'ARCHIVE' : 'RESTORE'}_${targetType.toUpperCase()}` as never, targetType, targetId, reason: cleanReason, success: true, metadata: { from: currentStatus, to: nextStatus, sellerId } });
}

export const moderateSeller = (idToken: string, sellerId: string, nextStatus: string, reason: string) => moderateDocument(idToken, 'seller', sellerId, nextStatus, reason);
export const moderateProduct = (idToken: string, sellerId: string, productId: string, nextStatus: string, reason: string) => moderateDocument(idToken, 'product', productId, nextStatus, reason, sellerId);
export const moderateUser = (idToken: string, userId: string, nextStatus: string, reason: string) => moderateDocument(idToken, 'user', userId, nextStatus, reason);
