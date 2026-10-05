import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import { finalizePaystackSubscription } from '@/lib/server/paystack-subscription-finalizer';
import { PaystackError, verifyPaystackTransaction } from '@/lib/server/paystack';
import { isPaystackReference } from '@/lib/server/paystack-payment-validation';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';

export async function POST(request: Request) {
  try {
    const identity = await verifyMarketplaceSession();
    if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    await enforceActorRateLimit({ scope: 'seller-subscription-paystack-verify', actorId: identity.uid, limit: 12, windowMs: 60_000 });

    const body = await request.json().catch(() => null);
    const reference = body?.reference;
    if (!isPaystackReference(reference)) {
      return NextResponse.json({ error: 'A valid payment reference is required.' }, { status: 400 });
    }

    const db = getAdminDb();
    const paymentRef = db.collection('payments').doc(reference);
    const paymentSnapshot = await paymentRef.get();
    const payment = paymentSnapshot.data();
    if (!paymentSnapshot.exists || payment?.buyerId !== identity.uid || payment?.purpose !== 'seller_subscription') {
      return NextResponse.json({ error: 'Subscription payment not found.' }, { status: 404 });
    }
    if (payment.status === 'SUCCESS') {
      return NextResponse.json({ ok: true, verified: true, status: 'ALREADY_PROCESSED', sellerId: payment.sellerId });
    }
    if (payment.status === 'MISMATCH') {
      return NextResponse.json({ ok: true, verified: false, paymentMismatch: true, status: 'MISMATCH' });
    }

    const verified = await verifyPaystackTransaction(reference);
    if (verified.status !== 'success') {
      const status = verified.status === 'failed' ? 'FAILED' : verified.status === 'abandoned' ? 'CANCELLED' : 'PENDING';
      const sellerId = String(payment.sellerId || '');
      const sellerRef = db.collection('sellers').doc(sellerId);
      const lockRef = db.collection('sellerSubscriptionLocks').doc(sellerId);
      const persistedStatus = await db.runTransaction(async (transaction) => {
        const [currentSnapshot, sellerSnapshot, lockSnapshot] = await Promise.all([
          transaction.get(paymentRef),
          transaction.get(sellerRef),
          transaction.get(lockRef),
        ]);
        const current = currentSnapshot.data();
        if (!currentSnapshot.exists || current?.buyerId !== identity.uid || current?.purpose !== 'seller_subscription') {
          throw new Error('Subscription payment not found.');
        }
        const currentStatus = typeof current.status === 'string' ? current.status : '';
        if (currentStatus === 'SUCCESS' || currentStatus === 'MISMATCH' || currentStatus === 'REVIEW_REQUIRED') return currentStatus;
        transaction.update(paymentRef, {
          status,
          provider: 'paystack',
          providerTransactionId: String(verified.id),
          verificationStatus: status === 'FAILED' || status === 'CANCELLED' ? 'REJECTED' : 'UNVERIFIED',
          updatedAt: new Date().toISOString(),
        });
        if (
          status !== 'PENDING'
          && sellerSnapshot.data()?.userId === identity.uid
          && lockSnapshot.data()?.reference === reference
        ) transaction.delete(lockRef);
        return status;
      });
      if (persistedStatus === 'SUCCESS') {
        return NextResponse.json({ ok: true, verified: true, status: 'ALREADY_PROCESSED', sellerId });
      }
      if (persistedStatus === 'MISMATCH') {
        return NextResponse.json({ ok: true, verified: false, paymentMismatch: true, status: persistedStatus });
      }
      if (persistedStatus === 'REVIEW_REQUIRED') {
        return NextResponse.json({
          ok: true,
          verified: false,
          status: persistedStatus,
          message: 'Payment was received, but the seller account requires support review before the subscription can be changed.',
        });
      }
      return NextResponse.json({ ok: true, verified: false, status: persistedStatus });
    }

    const finalization = await finalizePaystackSubscription(reference, verified, 'buyer_verification');
    if (finalization.status === 'MISMATCH') {
      return NextResponse.json({
        ok: true,
        verified: false,
        paymentMismatch: true,
        status: finalization.status,
        message: 'Payment could not be matched to the expected subscription amount. Contact Agora support before trying again.',
      });
    }
    if (finalization.status === 'REVIEW_REQUIRED') {
      return NextResponse.json({
        ok: true,
        verified: false,
        status: finalization.status,
        message: 'Payment was received, but the seller account requires support review before the subscription can be changed.',
      });
    }
    return NextResponse.json({
      ok: true,
      verified: true,
      status: finalization.status,
      sellerId: finalization.sellerId,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } });
    }
    const message = error instanceof PaystackError ? error.message : 'Unable to verify subscription payment.';
    return NextResponse.json({ error: message }, { status: error instanceof PaystackError ? (error.status || 500) : 500 });
  }
}
