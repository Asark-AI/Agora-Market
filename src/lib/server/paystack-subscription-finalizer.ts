import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import type { PaystackVerifyResult } from '@/lib/server/paystack';
import { paystackPaymentMismatch, PREMIUM_SELLER_PLAN } from '@/lib/server/paystack-payment-validation';

export type SubscriptionFinalizationResult = {
  status: 'SUCCESS' | 'ALREADY_PROCESSED' | 'REVIEW_REQUIRED' | 'MISMATCH';
  sellerId: string;
  reference: string;
  reason?: string;
};

export async function finalizePaystackSubscription(
  reference: string,
  verified: PaystackVerifyResult,
  source: 'buyer_verification' | 'paystack_webhook'
): Promise<SubscriptionFinalizationResult> {
  const db = getAdminDb();
  const paymentRef = db.collection('payments').doc(reference);

  return db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);
    if (!paymentSnapshot.exists) throw new Error('No Agora payment intent exists for this reference.');
    const payment = paymentSnapshot.data() || {};
    const sellerId = typeof payment.sellerId === 'string' ? payment.sellerId : '';
    const sellerRef = db.collection('sellers').doc(sellerId);
    const lockRef = db.collection('sellerSubscriptionLocks').doc(sellerId);
    const ledgerRef = db.collection('financialTransactions').doc(`paystack_subscription_${reference}`);
    const auditRef = db.collection('auditLogs').doc(`subscription_payment_${reference}`);
    const [sellerSnapshot, lockSnapshot, ledgerSnapshot, auditSnapshot] = await Promise.all([
      transaction.get(sellerRef),
      transaction.get(lockRef),
      transaction.get(ledgerRef),
      transaction.get(auditRef),
    ]);

    if (
      payment.provider !== 'paystack'
      || payment.purpose !== 'seller_subscription'
      || payment.buyerId !== payment.userId
      || typeof payment.buyerId !== 'string'
      || !payment.buyerId
      || !sellerId
      || payment.planId !== PREMIUM_SELLER_PLAN.id
    ) {
      throw new Error('The subscription payment intent is invalid.');
    }

    const mismatch = paystackPaymentMismatch(
      reference,
      payment.amountMinor === PREMIUM_SELLER_PLAN.amountMinor ? PREMIUM_SELLER_PLAN.amountMinor : -1,
      payment.currency === PREMIUM_SELLER_PLAN.currency ? PREMIUM_SELLER_PLAN.currency : 'INVALID',
      verified
    );
    const now = new Date().toISOString();
    const auditRecord = {
      actor: 'paystack',
      actorRole: 'SYSTEM',
      action: mismatch ? 'SUBSCRIPTION_PAYMENT_MISMATCH' : 'SUBSCRIPTION_PAYMENT_CONFIRMED',
      sellerId,
      reference,
      timestamp: now,
      idempotencyKey: `paystack-subscription:${reference}`,
      metadata: {
        buyerId: payment.buyerId,
        verificationSource: source,
        mismatch,
        expectedAmountMinor: Number(payment.amountMinor),
        receivedAmountMinor: Number(verified.amount),
        expectedCurrency: String(payment.currency || ''),
        receivedCurrency: verified.currency,
      },
    };

    if (payment.status === 'SUCCESS') {
      return { status: 'ALREADY_PROCESSED', sellerId, reference };
    }
    if (payment.status === 'MISMATCH') {
      return { status: 'MISMATCH', sellerId, reference, reason: 'The payment does not match the expected subscription charge.' };
    }

    if (mismatch) {
      transaction.set(paymentRef, {
        status: 'MISMATCH',
        verificationStatus: 'MISMATCH',
        mismatchReason: mismatch,
        provider: 'paystack',
        providerTransactionId: String(verified.id),
        receivedAmountMinor: Number(verified.amount),
        receivedCurrency: String(verified.currency || ''),
        webhookProcessed: source === 'paystack_webhook' || payment.webhookProcessed === true,
        updatedAt: now,
      }, { merge: true });
      if (!auditSnapshot.exists) transaction.create(auditRef, auditRecord);
      return { status: 'MISMATCH', sellerId, reference, reason: 'The payment does not match the expected subscription charge.' };
    }

    if (!sellerSnapshot.exists || sellerSnapshot.data()?.userId !== payment.buyerId || sellerSnapshot.data()?.status !== 'active') {
      const reason = 'The seller account is unavailable or ownership changed after payment initialization.';
      transaction.set(paymentRef, {
        status: 'REVIEW_REQUIRED',
        verificationStatus: 'VERIFIED',
        provider: 'paystack',
        providerTransactionId: String(verified.id),
        paidAt: verified.paid_at || now,
        reviewReason: reason,
        webhookProcessed: source === 'paystack_webhook' || payment.webhookProcessed === true,
        updatedAt: now,
      }, { merge: true });
      if (!auditSnapshot.exists) transaction.create(auditRef, auditRecord);
      return { status: 'REVIEW_REQUIRED', sellerId, reference, reason };
    }

    const paidAt = verified.paid_at && Number.isFinite(Date.parse(verified.paid_at))
      ? new Date(verified.paid_at)
      : new Date(now);
    const nextPaymentDate = new Date(paidAt);
    nextPaymentDate.setUTCDate(nextPaymentDate.getUTCDate() + PREMIUM_SELLER_PLAN.intervalDays);
    const amountMinor = PREMIUM_SELLER_PLAN.amountMinor;

    transaction.update(sellerRef, {
      subscriptionPlan: PREMIUM_SELLER_PLAN.id,
      lastPaymentDate: paidAt.toISOString(),
      nextPaymentDate: nextPaymentDate.toISOString(),
    });
    if (lockSnapshot.data()?.reference === reference) transaction.delete(lockRef);
    transaction.set(paymentRef, {
      status: 'SUCCESS',
      verificationStatus: 'VERIFIED',
      provider: 'paystack',
      providerTransactionId: String(verified.id),
      amountMinor,
      currency: PREMIUM_SELLER_PLAN.currency,
      paidAt: paidAt.toISOString(),
      webhookProcessed: source === 'paystack_webhook' || payment.webhookProcessed === true,
      updatedAt: now,
    }, { merge: true });
    if (!ledgerSnapshot.exists) {
      transaction.create(ledgerRef, {
        id: ledgerRef.id,
        sellerId,
        paymentId: reference,
        type: 'SELLER_SUBSCRIPTION_PAYMENT',
        amountMinor,
        currency: PREMIUM_SELLER_PLAN.currency,
        direction: 'CREDIT',
        status: 'POSTED',
        reference,
        description: 'Verified Agora Premium seller subscription received through Paystack.',
        createdAt: now,
        updatedAt: now,
        createdBy: source,
        idempotencyKey: `paystack-subscription:${reference}`,
        providerReference: reference,
        metadata: { providerTransactionId: String(verified.id) },
      });
    }
    if (!auditSnapshot.exists) transaction.create(auditRef, auditRecord);

    return { status: 'SUCCESS', sellerId, reference };
  });
}
