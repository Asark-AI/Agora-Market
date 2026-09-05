import 'server-only';

import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase-admin';

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

function requireUid(identity: DecodedIdToken): string {
  if (!identity.uid) throw new AuthorizationError('Authentication is required.');
  return identity.uid;
}

export async function requireSellerOwner(identity: DecodedIdToken, sellerId: string) {
  const uid = requireUid(identity);
  if (!sellerId || /[\\/\s]/.test(sellerId)) throw new AuthorizationError('Invalid seller ID.');

  const seller = await getAdminDb().collection('sellers').doc(sellerId).get();
  if (!seller.exists || seller.data()?.userId !== uid) {
    throw new AuthorizationError('Seller access is not authorized.');
  }

  const status = seller.data()?.status;
  if (status === 'suspended' || status === 'rejected' || status === 'deactivated') {
    throw new AuthorizationError('This seller account is not active.');
  }

  return seller;
}

export async function requireApprovedRider(identity: DecodedIdToken) {
  const uid = requireUid(identity);
  const rider = await getAdminDb().collection('riderProfiles').doc(uid).get();
  if (!rider.exists || rider.data()?.userId !== uid) {
    throw new AuthorizationError('Rider access is not authorized.');
  }
  if (rider.data()?.status !== 'approved') {
    throw new AuthorizationError('Rider approval is required for this action.');
  }

  return rider;
}
