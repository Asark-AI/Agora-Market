import 'server-only';

import { randomUUID } from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import type { AdminIdentity } from '@/lib/server/admin-auth';

export type AuditAction = 'DELETE_USER' | 'DELETE_PRODUCT' | 'SUSPEND_USER' | 'SUSPEND_SELLER' | 'APPROVE_SELLER' | 'REJECT_SELLER' | 'APPROVE_PRODUCT' | 'REJECT_PRODUCT';

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
