import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';
import { initializePaystackTransaction, isPaystackConfigured, PaystackError } from '@/lib/server/paystack';
import { isPaystackReference, PREMIUM_SELLER_PLAN } from '@/lib/server/paystack-payment-validation';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';

type InitializationError = { status: number; message: string };

export async function POST(request: Request) {
  try {
    const identity = await verifyMarketplaceSession();
    if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    if (!identity.email) return NextResponse.json({ error: 'An email address is required for payment.' }, { status: 400 });
    await enforceActorRateLimit({ scope: 'seller-subscription-paystack-initialize', actorId: identity.uid, limit: 3, windowMs: 60_000 });

    const body = await request.json().catch(() => null);
    const sellerId = body?.sellerId;
    if (typeof sellerId !== 'string' || !isPaystackReference(sellerId)) {
      return NextResponse.json({ error: 'A valid seller profile is required.' }, { status: 400 });
    }
    if (!isPaystackConfigured()) {
      return NextResponse.json({ error: 'Paystack is not configured on this server.' }, { status: 503 });
    }
    const appOrigin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
    if (!appOrigin) return NextResponse.json({ error: 'Payment callback URL is not configured on this server.' }, { status: 503 });

    const db = getAdminDb();
    const sellerRef = db.collection('sellers').doc(sellerId);
    const lockRef = db.collection('sellerSubscriptionLocks').doc(sellerId);
    const reference = `agora_sub_${Date.now()}_${randomUUID().replace(/-/g, '')}`;
    const paymentRef = db.collection('payments').doc(reference);
    const now = new Date().toISOString();
    const initialized = await db.runTransaction(async (transaction) => {
      const sellerSnapshot = await transaction.get(sellerRef);
      if (!sellerSnapshot.exists || sellerSnapshot.data()?.userId !== identity.uid) {
        throw { status: 404, message: 'Seller profile not found.' } satisfies InitializationError;
      }
      const seller = sellerSnapshot.data() || {};
      if (seller.status !== 'active') {
        throw { status: 409, message: 'Only active seller profiles can upgrade.' } satisfies InitializationError;
      }
      if (seller.subscriptionPlan === PREMIUM_SELLER_PLAN.id) {
        throw { status: 409, message: 'Your seller profile is already on the Premium plan.' } satisfies InitializationError;
      }

      const lockSnapshot = await transaction.get(lockRef);
      const pendingReference = lockSnapshot.data()?.reference;
      if (typeof pendingReference === 'string' && isPaystackReference(pendingReference)) {
        const pendingRef = db.collection('payments').doc(pendingReference);
        const pendingSnapshot = await transaction.get(pendingRef);
        const pending = pendingSnapshot.data();
        if (pendingSnapshot.exists && pending?.buyerId === identity.uid && pending?.sellerId === sellerId) {
          if (pending.status === 'PENDING' && typeof pending.authorizationUrl === 'string') {
            return { reference: pendingReference, authorizationUrl: pending.authorizationUrl, reused: true };
          }
          if (pending.status === 'INITIALIZING') {
            throw { status: 409, message: 'A payment attempt is already being prepared. Please retry shortly.' } satisfies InitializationError;
          }
          if (pending.status === 'SUCCESS') {
            throw { status: 409, message: 'Your Premium subscription payment has already been confirmed.' } satisfies InitializationError;
          }
          if (pending.status === 'MISMATCH' || pending.status === 'REVIEW_REQUIRED') {
            throw { status: 409, message: 'A previous payment requires support review before another attempt can be started.' } satisfies InitializationError;
          }
        }
      }

      transaction.create(paymentRef, {
        id: reference,
        reference,
        orderId: `subscription_${sellerId}`,
        buyerId: identity.uid,
        userId: identity.uid,
        sellerId,
        purpose: 'seller_subscription',
        planId: PREMIUM_SELLER_PLAN.id,
        amountMinor: PREMIUM_SELLER_PLAN.amountMinor,
        currency: PREMIUM_SELLER_PLAN.currency,
        status: 'INITIALIZING',
        provider: 'paystack',
        verificationStatus: 'UNVERIFIED',
        webhookProcessed: false,
        createdAt: now,
        updatedAt: now,
      });
      transaction.set(lockRef, { sellerId, buyerId: identity.uid, reference, createdAt: now });
      return { reference, authorizationUrl: null, reused: false };
    });

    if (initialized.authorizationUrl) {
      return NextResponse.json({ ok: true, reference: initialized.reference, authorizationUrl: initialized.authorizationUrl, reused: true });
    }

    try {
      const result = await initializePaystackTransaction({
        email: identity.email,
        amountMinor: PREMIUM_SELLER_PLAN.amountMinor,
        reference: initialized.reference,
        callbackUrl: `${appOrigin}/dashboard/subscription`,
        metadata: {
          purpose: 'seller_subscription',
          sellerId,
          buyerId: identity.uid,
          planId: PREMIUM_SELLER_PLAN.id,
          platform: 'agora',
        },
      });
      if (result.reference !== initialized.reference || !result.authorization_url) {
        throw new PaystackError('Paystack returned an invalid payment initialization response.');
      }

      await db.runTransaction(async (transaction) => {
        const [paymentSnapshot, sellerSnapshot] = await Promise.all([
          transaction.get(paymentRef),
          transaction.get(sellerRef),
        ]);
        const lockSnapshot = await transaction.get(lockRef);
          if (
            !paymentSnapshot.exists
            || paymentSnapshot.data()?.status !== 'INITIALIZING'
            || lockSnapshot.data()?.reference !== initialized.reference
          ) {
            throw new Error('Subscription payment attempt changed during initialization.');
          }
          if (
            !sellerSnapshot.exists
            || sellerSnapshot.data()?.userId !== identity.uid
            || sellerSnapshot.data()?.status !== 'active'
            || sellerSnapshot.data()?.subscriptionPlan === PREMIUM_SELLER_PLAN.id
          ) {
            throw new Error('Seller account changed during payment initialization.');
          }
          transaction.update(paymentRef, {
            status: 'PENDING',
            authorizationUrl: result.authorization_url,
          updatedAt: new Date().toISOString(),
        });
      });

      return NextResponse.json({ ok: true, reference: initialized.reference, authorizationUrl: result.authorization_url, reused: false });
    } catch (error) {
      await db.runTransaction(async (transaction) => {
        const [paymentSnapshot, lockSnapshot] = await Promise.all([
          transaction.get(paymentRef),
          transaction.get(lockRef),
        ]);
        if (paymentSnapshot.exists) {
          if (paymentSnapshot.data()?.status === 'INITIALIZING') {
            transaction.update(paymentRef, { status: 'INITIALIZATION_FAILED', updatedAt: new Date().toISOString() });
          }
        }
        if (lockSnapshot.data()?.reference === initialized.reference) {
          transaction.delete(lockRef);
        }
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } });
    }
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      const expectedError = error as InitializationError;
      return NextResponse.json({ error: expectedError.message }, { status: expectedError.status });
    }
    console.error(JSON.stringify({
      event: 'seller_subscription_initialization_failure',
      actorId: 'redacted',
      errorCategory: error instanceof Error ? error.name : 'unknown_error',
    }));
    return NextResponse.json({ error: 'Unable to start the subscription payment.' }, { status: 500 });
  }
}
