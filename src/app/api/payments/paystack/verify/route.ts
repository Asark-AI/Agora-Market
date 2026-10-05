import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import { PaystackError, verifyPaystackTransaction } from '@/lib/server/paystack';
import { finalizePaystackOrder } from '@/lib/server/paystack-order-finalizer';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';
import { isPaystackReference } from '@/lib/server/paystack-payment-validation';

export async function POST(request: Request) {
  try {
    const identity = await verifyMarketplaceSession();
    if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    await enforceActorRateLimit({ scope: 'checkout-paystack-verify', actorId: identity.uid, limit: 12, windowMs: 60_000 });
    const body = await request.json().catch(() => null);
    const reference = body?.reference;
    if (!isPaystackReference(reference)) {
      return NextResponse.json({ error: 'A payment reference is required.' }, { status: 400 });
    }

    const paymentRef = getAdminDb().collection('payments').doc(reference);
    const paymentSnapshot = await paymentRef.get();
    if (!paymentSnapshot.exists || paymentSnapshot.data()?.buyerId !== identity.uid) {
      return NextResponse.json({ error: 'Payment intent not found.' }, { status: 404 });
    }

    const result = await verifyPaystackTransaction(reference);
    if (result.reference !== reference) return NextResponse.json({ error: 'Paystack returned a different payment reference.' }, { status: 400 });

    if (result.status === 'success') {
      const finalization = await finalizePaystackOrder(reference, result, 'buyer_verification');
      return NextResponse.json({ ok: true, verified: true, ...finalization });
    }

    const status = result.status === 'failed' ? 'FAILED' : 'PENDING';
    const persisted = await getAdminDb().runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(paymentRef);
      const current = currentSnapshot.data();
      if (!currentSnapshot.exists || current?.buyerId !== identity.uid) throw new Error('Payment intent not found.');
      const currentStatus = typeof current.status === 'string' ? current.status : '';
      if (['SUCCESS', 'MISMATCH', 'REVIEW_REQUIRED'].includes(currentStatus)) {
        return {
          status: currentStatus,
          orderCreationStatus: current.orderCreationStatus,
          marketplaceOrderId: current.orderDraft?.marketplaceOrderId,
        };
      }
      transaction.set(paymentRef, {
        status,
        provider: 'paystack',
        providerTransactionId: String(result.id),
        verificationStatus: status === 'FAILED' ? 'REJECTED' : 'UNVERIFIED',
        channel: result.channel || current.channel || null,
        customerEmail: result.customer?.email || current.customerEmail || null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { status };
    });

    if (persisted.status === 'SUCCESS') {
      return NextResponse.json({
        ok: true,
        verified: true,
        orderCreationStatus: persisted.orderCreationStatus || 'ALREADY_CREATED',
        marketplaceOrderId: persisted.marketplaceOrderId || paymentSnapshot.data()?.orderDraft?.marketplaceOrderId,
      });
    }
    if (persisted.status === 'MISMATCH') {
      return NextResponse.json({
        ok: true,
        verified: false,
        paymentMismatch: true,
        marketplaceOrderId: persisted.marketplaceOrderId || paymentSnapshot.data()?.orderDraft?.marketplaceOrderId,
      });
    }
    if (persisted.status === 'REVIEW_REQUIRED') {
      return NextResponse.json({
        ok: true,
        verified: true,
        orderCreationStatus: 'REVIEW_REQUIRED',
        marketplaceOrderId: persisted.marketplaceOrderId || paymentSnapshot.data()?.orderDraft?.marketplaceOrderId,
      });
    }
    return NextResponse.json({ ok: true, verified: false, payment: { reference, status: persisted.status } });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } });
    }
    console.error(JSON.stringify({
      event: 'paystack_buyer_verification_failure',
      errorCategory: error instanceof Error ? error.name : 'unknown_error',
    }));
    const message = error instanceof PaystackError ? error.message : 'Unable to verify payment.';
    return NextResponse.json({ error: message }, { status: error instanceof PaystackError ? (error.status || 500) : 500 });
  }
}
