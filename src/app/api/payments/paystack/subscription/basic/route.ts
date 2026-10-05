import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';
import { isPaystackReference } from '@/lib/server/paystack-payment-validation';

export async function POST(request: Request) {
  try {
    const identity = await verifyMarketplaceSession();
    if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    await enforceActorRateLimit({ scope: 'seller-subscription-downgrade', actorId: identity.uid, limit: 5, windowMs: 60_000 });

    const body = await request.json().catch(() => null);
    const sellerId = body?.sellerId;
    if (typeof sellerId !== 'string' || !isPaystackReference(sellerId)) {
      return NextResponse.json({ error: 'A valid seller profile is required.' }, { status: 400 });
    }

    const db = getAdminDb();
    const sellerRef = db.collection('sellers').doc(sellerId);
    await db.runTransaction(async (transaction) => {
      const sellerSnapshot = await transaction.get(sellerRef);
      if (!sellerSnapshot.exists || sellerSnapshot.data()?.userId !== identity.uid) {
        throw new Error('Seller profile not found.');
      }
      const lockRef = db.collection('sellerSubscriptionLocks').doc(sellerId);
      const lockSnapshot = await transaction.get(lockRef);
      const pendingReference = lockSnapshot.data()?.reference;
      if (typeof pendingReference === 'string' && isPaystackReference(pendingReference)) {
        const pendingRef = db.collection('payments').doc(pendingReference);
        const pendingSnapshot = await transaction.get(pendingRef);
        const pending = pendingSnapshot.data();
        if (pendingSnapshot.exists && ['INITIALIZING', 'PENDING'].includes(String(pending?.status))) {
          throw new Error('Resolve your pending Premium payment before changing plans.');
        }
        if (pendingSnapshot.exists && ['MISMATCH', 'REVIEW_REQUIRED'].includes(String(pending?.status))) {
          throw new Error('Contact Agora support to resolve your previous Premium payment before changing plans.');
        }
        transaction.delete(lockRef);
      }
      transaction.update(sellerRef, {
        subscriptionPlan: 'basic',
        lastPaymentDate: null,
        nextPaymentDate: null,
      });
    });
    return NextResponse.json({ ok: true, subscriptionPlan: 'basic' });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } });
    }
    const message = error instanceof Error ? error.message : '';
    const status = message === 'Seller profile not found.' ? 404 : message ? 409 : 500;
    if (status === 500) console.error('Unable to change seller subscription plan:', error);
    return NextResponse.json({ error: message || 'Unable to change subscription plan.' }, { status });
  }
}
