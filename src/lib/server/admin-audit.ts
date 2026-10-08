import 'server-only';

import { randomUUID } from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import type { AdminIdentity } from '@/lib/server/admin-auth';

export type AuditAction =
  | 'DELETE_USER'
  | 'DELETE_SELLER'
  | 'DELETE_PRODUCT'
  | 'SUSPEND_USER'
  | 'SUSPEND_SELLER'
  | 'APPROVE_SELLER'
  | 'REJECT_SELLER'
  | 'APPROVE_PRODUCT'
  | 'REJECT_PRODUCT'
  | 'CHANGE_SUPER_ADMIN_EMAIL'
  | 'CHANGE_SUPER_ADMIN_PASSWORD'
  | 'CREATE_SUPER_ADMIN'
  | 'DISABLE_SUPER_ADMIN'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGIN_FAILED'
  | 'ADMIN_PASSWORD_RESET_REQUESTED'
  | 'ADMIN_PASSWORD_RESET_COMPLETED'
  | 'ADMIN_ACCOUNT_CHANGED'
  | 'ADMIN_SECURITY_SETTING_CHANGED'
  | 'ADMIN_REFUND';

export async function writeAuditLog({ admin, action, targetType, targetId, reason, success, metadata = {}, requestId = `req_${randomUUID()}` }: {
  admin: AdminIdentity;
  action: AuditAction;
  targetType: string;
  targetId: string;
  reason: string;
  success: boolean;
  metadata?: Record<string, unknown>;
  requestId?: string;
}) {
  await getAdminDb().collection('adminAuditLogs').doc(requestId).create({
    adminUid: admin.uid,
    adminEmail: admin.email || null,
    action,
    targetType,
    targetId,
    reason,
    timestamp: new Date(),
    requestId,
    success,
    metadata,
  });
  return requestId;
}

export async function writeSecurityAuditLog({
  action,
  success,
  reason,
  requestId = `req_${randomUUID()}`,
  actorUid = null,
  metadata = {},
}: {
  action: Extract<AuditAction, 'ADMIN_LOGIN_FAILED' | 'ADMIN_PASSWORD_RESET_REQUESTED' | 'ADMIN_PASSWORD_RESET_COMPLETED'>;
  success: boolean;
  reason: string;
  requestId?: string;
  actorUid?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await getAdminDb().collection('adminAuditLogs').doc(requestId).create({
    adminUid: actorUid,
    adminEmail: null,
    action,
    targetType: 'super-admin-authentication',
    targetId: 'redacted',
    reason,
    timestamp: new Date(),
    requestId,
    success,
    metadata,
  });
  return requestId;
}
