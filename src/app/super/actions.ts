'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { requireSuperAdminToken } from '@/lib/server/admin-auth';
import { writeAuditLog } from '@/lib/server/admin-audit';

type ModerationTarget = 'seller' | 'product' | 'user';

function assertReason(reason: string) {
  if (!reason || reason.trim().length < 5 || reason.length > 500) throw new Error('A reason between 5 and 500 characters is required.');
  return reason.trim();
}

function assertTransition(current: string, next: string, allowed: Record<string, string[] | undefined>) {
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
    try {
      const target = await getAdminAuth().getUser(targetUserId);
      if (target.customClaims?.role === 'super_admin' || target.customClaims?.superAdmin === true) throw new Error('Privileged Super Admin accounts cannot be modified.');
    } catch (error) {
      if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
    }
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
    const authDeletion = auth.deleteUser(userId).catch((error: { code?: string }) => {
      if (error.code !== 'auth/user-not-found') throw error;
    });
    const profileDeletion = db.collection('users').doc(userId).delete();
    const deletionResults = await Promise.allSettled([authDeletion, profileDeletion]);
    const failedDeletion = deletionResults.find((result) => result.status === 'rejected');
    if (failedDeletion?.status === 'rejected') throw failedDeletion.reason;
    await writeAuditLog({ admin, action: 'DELETE_USER', targetType: 'user', targetId: userId, reason: reason.trim(), success: true });
  } catch (error) {
    await writeAuditLog({ admin, action: 'DELETE_USER', targetType: 'user', targetId: userId, reason: reason.trim(), success: false });
    throw new Error('Unable to delete the user profile. The operation was recorded for investigation.');
  }
}

export async function deleteAdminUsers(idToken: string, userIds: string[], reason: string) {
  if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > 100) {
    throw new Error('Select between 1 and 100 users to delete.');
  }
  const uniqueIds = [...new Set(userIds)];
  uniqueIds.forEach((userId) => assertId(userId, 'user ID'));
  const cleanReason = assertReason(reason);
  const admin = await requireSuperAdminToken(idToken);
  if (uniqueIds.includes(admin.uid)) throw new Error('You cannot delete your own Super Admin account.');

  const auth = getAdminAuth();
  const db = getAdminDb();
  const targets = await Promise.all(uniqueIds.map(async (userId) => {
    try {
      return { userId, target: await auth.getUser(userId) };
    } catch (error) {
      if ((error as { code?: string }).code === 'auth/user-not-found') return { userId, target: null };
      throw error;
    }
  }));
  if (targets.some(({ target }) => target?.customClaims?.role === 'super_admin' || target?.customClaims?.superAdmin === true)) {
    throw new Error('Selection includes a protected Super Admin account. No accounts were deleted.');
  }

  const outcomes = await Promise.all(targets.map(async ({ userId }) => {
    try {
      const [authResult, profileResult] = await Promise.allSettled([
        auth.deleteUser(userId).catch((error: { code?: string }) => {
          if (error.code !== 'auth/user-not-found') throw error;
        }),
        db.collection('users').doc(userId).delete(),
      ]);
      if (authResult.status === 'rejected' || profileResult.status === 'rejected') {
        throw authResult.status === 'rejected' ? authResult.reason : (profileResult as PromiseRejectedResult).reason;
      }
      await writeAuditLog({ admin, action: 'DELETE_USER', targetType: 'user', targetId: userId, reason: cleanReason, success: true });
      return { userId, deleted: true };
    } catch {
      try {
        await writeAuditLog({ admin, action: 'DELETE_USER', targetType: 'user', targetId: userId, reason: cleanReason, success: false });
      } catch (auditError) {
        console.error('Unable to write bulk user deletion audit log:', auditError);
      }
      return { userId, deleted: false };
    }
  }));

  return {
    deletedIds: outcomes.filter((outcome) => outcome.deleted).map((outcome) => outcome.userId),
    failedIds: outcomes.filter((outcome) => !outcome.deleted).map((outcome) => outcome.userId),
  };
}

export async function deleteAdminSeller(idToken: string, sellerId: string, reason: string) {
  assertId(sellerId, 'seller ID');
  const cleanReason = assertReason(reason);
  const admin = await requireSuperAdminToken(idToken);
  const db = getAdminDb();
  const auth = getAdminAuth();
  const sellerRef = db.collection('sellers').doc(sellerId);
  const sellerSnapshot = await sellerRef.get();
  if (!sellerSnapshot.exists) throw new Error('Seller was not found. Refresh the list and try again.');

  const sellerData = sellerSnapshot.data() || {};
  const ownerId = typeof sellerData.userId === 'string' ? sellerData.userId : '';
  let owner = null;
  if (ownerId) {
    try {
      owner = await auth.getUser(ownerId);
    } catch (error) {
      if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
    }
    if (owner?.customClaims?.role === 'super_admin' || owner?.customClaims?.superAdmin === true) {
      throw new Error('This seller belongs to a protected Super Admin account.');
    }
  }

  try {
    await db.recursiveDelete(sellerRef.collection('products'));
    await sellerRef.delete();
    const ownerUpdates: Promise<unknown>[] = [];
    if (owner) ownerUpdates.push(auth.setCustomUserClaims(owner.uid, { ...owner.customClaims, seller: false }));
    if (ownerId) {
      ownerUpdates.push(db.collection('users').doc(ownerId).set({
        roles: { seller: false },
        updatedAt: new Date(),
      }, { merge: true }));
    }
    await Promise.all(ownerUpdates);
    await writeAuditLog({
      admin,
      action: 'DELETE_SELLER',
      targetType: 'seller',
      targetId: sellerId,
      reason: cleanReason,
      success: true,
      metadata: { ownerId: ownerId || null, productsDeleted: true, orderHistoryPreserved: true },
    });
  } catch (error) {
    try {
      await writeAuditLog({ admin, action: 'DELETE_SELLER', targetType: 'seller', targetId: sellerId, reason: cleanReason, success: false, metadata: { ownerId: ownerId || null } });
    } catch (auditError) {
      console.error('Unable to write seller deletion audit log:', auditError);
    }
    throw new Error(error instanceof Error ? `Seller deletion did not complete: ${error.message}` : 'Seller deletion did not complete.');
  }
}

export async function approveAdminSeller(idToken: string, sellerId: string, reason: string) {
  assertId(sellerId, 'seller ID');
  const cleanReason = assertReason(reason);
  const admin = await requireSuperAdminToken(idToken);
  const db = getAdminDb();
  const auth = getAdminAuth();
  const sellerRef = db.collection('sellers').doc(sellerId);
  const sellerSnapshot = await sellerRef.get();
  if (!sellerSnapshot.exists) throw new Error('Seller application was not found. Refresh the list and try again.');

  const sellerData = sellerSnapshot.data() || {};
  const ownerId = typeof sellerData.userId === 'string' ? sellerData.userId : '';
  if (!ownerId) throw new Error('The seller profile has no account owner and cannot be approved.');
  if (ownerId === admin.uid) throw new Error('You cannot approve a seller profile linked to your own Super Admin account.');

  const owner = await auth.getUser(ownerId);
  if (owner.customClaims?.role === 'super_admin' || owner.customClaims?.superAdmin === true) throw new Error('Seller profiles belonging to a Super Admin cannot be approved through marketplace review.');
  const applications = await db.collection('sellerApplications').where('sellerId', '==', sellerId).get();
  const previousClaims = owner.customClaims || {};
  await auth.setCustomUserClaims(ownerId, { ...previousClaims, seller: true });

  try {
    const batch = db.batch();
    batch.update(sellerRef, {
      status: 'active',
      moderationReason: cleanReason,
      moderatedBy: admin.uid,
      moderatedAt: new Date(),
    });
    batch.set(db.collection('users').doc(ownerId), {
      roles: { seller: true },
      updatedAt: new Date(),
    }, { merge: true });
    applications.docs.forEach((application) => {
      batch.update(application.ref, {
        status: 'approved',
        reviewedBy: admin.uid,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        moderationReason: cleanReason,
      });
    });
    await batch.commit();
  } catch (error) {
    await auth.setCustomUserClaims(ownerId, previousClaims);
    await writeAuditLog({ admin, action: 'APPROVE_SELLER', targetType: 'seller', targetId: sellerId, reason: cleanReason, success: false, metadata: { ownerId } });
    throw new Error(error instanceof Error ? `Seller approval did not complete: ${error.message}` : 'Seller approval did not complete.');
  }

  await writeAuditLog({
    admin,
    action: 'APPROVE_SELLER',
    targetType: 'seller',
    targetId: sellerId,
    reason: cleanReason,
    success: true,
    metadata: { ownerId, applicationsUpdated: applications.size },
  });
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
    if (target.customClaims?.role === 'super_admin' || target.customClaims?.superAdmin === true) throw new Error('Privileged Super Admin accounts cannot be modified.');
    await getAdminAuth().updateUser(targetId, { disabled: nextStatus === 'suspended' });
  }
  await ref.update({ status: nextStatus, moderationReason: cleanReason, moderatedBy: admin.uid, moderatedAt: new Date() });
  await writeAuditLog({ admin, action: `${nextStatus === 'approved' ? 'APPROVE' : nextStatus === 'rejected' ? 'REJECT' : nextStatus === 'suspended' ? 'SUSPEND' : nextStatus === 'archived' ? 'ARCHIVE' : 'RESTORE'}_${targetType.toUpperCase()}` as never, targetType, targetId, reason: cleanReason, success: true, metadata: { from: currentStatus, to: nextStatus, sellerId } });
}

export const moderateSeller = async (idToken: string, sellerId: string, nextStatus: string, reason: string) => nextStatus === 'approved'
  ? approveAdminSeller(idToken, sellerId, reason)
  : moderateDocument(idToken, 'seller', sellerId, nextStatus, reason);
export const moderateProduct = async (idToken: string, sellerId: string, productId: string, nextStatus: string, reason: string) => moderateDocument(idToken, 'product', productId, nextStatus, reason, sellerId);
export const moderateUser = async (idToken: string, userId: string, nextStatus: string, reason: string) => moderateDocument(idToken, 'user', userId, nextStatus, reason);
