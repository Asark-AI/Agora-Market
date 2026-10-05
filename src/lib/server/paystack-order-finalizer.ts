import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import type { PaystackVerifyResult } from '@/lib/server/paystack';
import { checkoutSubtotalMinor, CheckoutValidationError, currentProductUnitPrice, parseCheckoutLines } from '@/lib/server/checkout-pricing';
import { paystackPaymentMismatch } from '@/lib/server/paystack-payment-validation';

type FinalizationResult = {
  orderCreated: boolean;
  orderCreationStatus: 'CREATED' | 'ALREADY_CREATED' | 'REVIEW_REQUIRED';
  marketplaceOrderId: string;
  orderIds: Record<string, string>;
  reviewReason?: string;
  paymentMismatch?: boolean;
};

function getStoredLines(value: unknown) {
  const requested = parseCheckoutLines(value);
  const stored = value as Array<Record<string, unknown>>;
  return requested.map((line, index) => {
    const item = stored[index];
    const unitPrice = item.unitPrice ?? item.price;
    if (typeof unitPrice !== 'number') {
      throw new CheckoutValidationError('The verified payment contains an invalid checkout line.');
    }
    checkoutSubtotalMinor([{ unitPrice, quantity: line.quantity }]);
    return {
      ...line,
      unitPrice,
      productName: typeof item.productName === 'string' ? item.productName : 'Marketplace item',
      image: typeof item.image === 'string' ? item.image : null,
    };
  });
}

export async function finalizePaystackOrder(reference: string, verified: PaystackVerifyResult, source: 'buyer_verification' | 'paystack_webhook'): Promise<FinalizationResult> {
  const db = getAdminDb();
  const paymentRef = db.collection('payments').doc(reference);
  const ledgerRef = db.collection('financialTransactions').doc(`paystack_${reference}`);
  const auditRef = db.collection('auditLogs').doc(`payment_confirmed_${reference}`);

  return db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);
    if (!paymentSnapshot.exists) throw new Error('No Agora payment intent exists for this reference.');
    const payment = paymentSnapshot.data() || {};
    const draft = payment.orderDraft || {};
    const expectedAmountMinor = Number(payment.amountMinor);
    const marketplaceOrderId = typeof draft.marketplaceOrderId === 'string' && draft.marketplaceOrderId
      ? draft.marketplaceOrderId
      : `AGO-${reference.slice(-10).toUpperCase()}`;
    const mismatch = String(payment.currency || '').toUpperCase() !== 'GHS'
      ? 'currency'
      : paystackPaymentMismatch(reference, expectedAmountMinor, 'GHS', verified)
        || (String(payment.reference || paymentSnapshot.id) !== reference ? 'reference' : null);

    if (payment.status === 'SUCCESS' && mismatch) {
      return {
        orderCreated: payment.orderCreationStatus === 'CREATED',
        orderCreationStatus: payment.orderCreationStatus === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'ALREADY_CREATED',
        marketplaceOrderId,
        orderIds: payment.orderIds && typeof payment.orderIds === 'object' ? payment.orderIds as Record<string, string> : {},
        reviewReason: typeof payment.reviewReason === 'string' ? payment.reviewReason : undefined,
      };
    }
    if (mismatch) {
      const mismatchRef = db.collection('paymentSecurityEvents').doc(reference);
      const mismatchSnapshot = await transaction.get(mismatchRef);
      const now = new Date().toISOString();
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
      if (!mismatchSnapshot.exists) {
        transaction.create(mismatchRef, {
          provider: 'paystack',
          reference,
          orderId: marketplaceOrderId,
          buyerId: payment.buyerId || null,
          mismatch,
          expectedAmountMinor,
          expectedCurrency: String(payment.currency || ''),
          receivedAmountMinor: Number(verified.amount),
          receivedCurrency: String(verified.currency || ''),
          createdAt: now,
          source,
        });
      }
      return {
        orderCreated: false,
        orderCreationStatus: 'REVIEW_REQUIRED',
        marketplaceOrderId,
        orderIds: {},
        reviewReason: 'The verified payment did not match the amount, currency, reference, or status expected by Agora. Contact support.',
        paymentMismatch: true,
      };
    }
    if (String(payment.reference || paymentSnapshot.id) !== reference || String(payment.currency || '').toUpperCase() !== 'GHS') {
      throw new Error('Payment reference or currency does not match the Agora payment intent.');
    }
    if (typeof payment.buyerId !== 'string' || !payment.buyerId || draft.buyerId !== payment.buyerId) {
      throw new Error('The payment intent has invalid buyer ownership data.');
    }

    const lines = getStoredLines(draft.items);
    if (checkoutSubtotalMinor(lines) !== expectedAmountMinor) {
      throw new Error('The payment intent total does not match its stored order lines.');
    }
    const sellerIds = [...new Set(lines.map((line) => line.sellerId))];
    const groupedLines = new Map(sellerIds.map((sellerId) => [sellerId, lines.filter((line) => line.sellerId === sellerId)]));
    const orderRefs = new Map(sellerIds.map((sellerId) => [sellerId, db.collection('sellers').doc(sellerId).collection('orders').doc(`${reference}_${sellerId}`)]));
    const sellerRefs = new Map(sellerIds.map((sellerId) => [sellerId, db.collection('sellers').doc(sellerId)]));
    const productRefs = lines.map((line) => db.collection('sellers').doc(line.sellerId).collection('products').doc(line.productId));
    const [orderSnapshots, sellerSnapshots, productSnapshots, ledgerSnapshot, auditSnapshot] = await Promise.all([
      Promise.all(sellerIds.map((sellerId) => transaction.get(orderRefs.get(sellerId)!))),
      Promise.all(sellerIds.map((sellerId) => transaction.get(sellerRefs.get(sellerId)!))),
      Promise.all(productRefs.map((productRef) => transaction.get(productRef))),
      transaction.get(ledgerRef),
      transaction.get(auditRef),
    ]);

    const orderIds = Object.fromEntries(sellerIds.map((sellerId, index) => [sellerId, orderRefs.get(sellerId)!.id]));
    const allOrdersExist = orderSnapshots.every((snapshot) => snapshot.exists);
    const someOrdersExist = orderSnapshots.some((snapshot) => snapshot.exists);
    const now = new Date().toISOString();
    const ledgerRecord = {
      id: ledgerRef.id,
      orderId: marketplaceOrderId,
      paymentId: reference,
      buyerId: payment.buyerId,
      type: 'CUSTOMER_PAYMENT',
      amountMinor: expectedAmountMinor,
      currency: 'GHS',
      direction: 'CREDIT',
      status: 'POSTED',
      reference,
      description: 'Verified buyer payment received by Agora through Paystack.',
      createdAt: now,
      updatedAt: now,
      createdBy: source,
      idempotencyKey: `paystack-payment:${reference}`,
      providerReference: reference,
      metadata: { providerTransactionId: String(verified.id), verificationSource: source },
    };
    const auditRecord = {
      actor: 'paystack',
      actorRole: 'SYSTEM',
      action: 'PAYMENT_CONFIRMED',
      orderId: marketplaceOrderId,
      transactionId: ledgerRef.id,
      previousState: String(payment.status || 'PENDING'),
      newState: 'SUCCESS',
      reason: 'Paystack transaction was verified server-side.',
      timestamp: now,
      reference,
      idempotencyKey: `paystack-payment:${reference}`,
      metadata: { buyerId: payment.buyerId, verificationSource: source },
    };

    const writeAuditRecord = () => {
      if (!auditSnapshot.exists) transaction.create(auditRef, auditRecord);
    };

    const markForReview = (reviewReason: string): FinalizationResult => {
      if (!ledgerSnapshot.exists) transaction.create(ledgerRef, ledgerRecord);
      writeAuditRecord();
      transaction.set(paymentRef, {
        status: 'SUCCESS',
        provider: 'paystack',
        providerTransactionId: String(verified.id),
        amountMinor: expectedAmountMinor,
        currency: 'GHS',
        paidAt: verified.paid_at || now,
        verificationStatus: 'VERIFIED',
        orderCreated: false,
        orderCreationStatus: 'REVIEW_REQUIRED',
        reviewReason,
        reviewRequiredAt: now,
        webhookProcessed: source === 'paystack_webhook' || payment.webhookProcessed === true,
        updatedAt: now,
      }, { merge: true });
      return { orderCreated: false, orderCreationStatus: 'REVIEW_REQUIRED', marketplaceOrderId, orderIds, reviewReason };
    };

    if (allOrdersExist) {
      if (!ledgerSnapshot.exists) transaction.create(ledgerRef, ledgerRecord);
      writeAuditRecord();
      transaction.set(paymentRef, {
        status: 'SUCCESS',
        verificationStatus: 'VERIFIED',
        orderCreationStatus: 'CREATED',
        webhookProcessed: source === 'paystack_webhook' || payment.webhookProcessed === true,
        updatedAt: now,
      }, { merge: true });
      return { orderCreated: true, orderCreationStatus: 'ALREADY_CREATED', marketplaceOrderId, orderIds };
    }

    if (payment.orderCreationStatus === 'REVIEW_REQUIRED') {
      if (!ledgerSnapshot.exists) transaction.create(ledgerRef, ledgerRecord);
      writeAuditRecord();
      return {
        orderCreated: false,
        orderCreationStatus: 'REVIEW_REQUIRED',
        marketplaceOrderId,
        orderIds,
        reviewReason: typeof payment.reviewReason === 'string' ? payment.reviewReason : 'The paid order requires manual review.',
      };
    }

    if (someOrdersExist && !allOrdersExist) {
      return markForReview('Only part of the expected seller orders exists; automatic retry is paused to prevent duplicate inventory changes.');
    }

    if (sellerSnapshots.some((snapshot) => !snapshot.exists || snapshot.data()?.status !== 'active')) {
      return markForReview('A seller became unavailable after payment was initialized.');
    }

    const unavailableLineIndex = productSnapshots.findIndex((snapshot, index) => {
      const line = lines[index];
      const stock = Number(snapshot.data()?.stock ?? 0);
      return !snapshot.exists || snapshot.data()?.status !== 'active' || !Number.isInteger(stock) || stock < line.quantity;
    });
    if (unavailableLineIndex >= 0) {
      const line = lines[unavailableLineIndex];
      const productName = String(productSnapshots[unavailableLineIndex].data()?.name || line.productName);
      return markForReview(`${productName} is no longer available in the quantity paid for.`);
    }

    const changedPriceIndex = productSnapshots.findIndex((snapshot, index) => {
      try {
        return currentProductUnitPrice(snapshot.data() || {}) !== lines[index].unitPrice;
      } catch (error) {
        if (error instanceof CheckoutValidationError) return true;
        throw error;
      }
    });
    if (changedPriceIndex >= 0) {
      const line = lines[changedPriceIndex];
      const productName = String(productSnapshots[changedPriceIndex].data()?.name || line.productName);
      return markForReview(`${productName} changed price after payment was initialized.`);
    }

    if (!ledgerSnapshot.exists) transaction.create(ledgerRef, ledgerRecord);
    writeAuditRecord();
    const address = draft.deliveryAddress || null;
    for (const sellerId of sellerIds) {
      const sellerLines = groupedLines.get(sellerId)!;
      const sellerGrossAmountMinor = sellerLines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity, 0);
      const sellerGrossAmount = Number((sellerGrossAmountMinor / 100).toFixed(2));
      const orderRef = orderRefs.get(sellerId)!;
      transaction.create(orderRef, {
        marketplaceOrderId,
        buyerId: payment.buyerId,
        userId: payment.buyerId,
        buyerEmail: draft.buyerEmail || verified.customer?.email || null,
        date: now,
        createdAt: now,
        updatedAt: now,
        subtotal: sellerGrossAmount,
        deliveryFee: null,
        deliveryFeeStatus: 'seller_to_confirm',
        total: sellerGrossAmount,
        status: 'pending',
        paymentMethod: 'paystack',
        transactionId: reference,
        paymentReference: reference,
        paymentProvider: 'paystack',
        paymentStatus: 'SUCCESS',
        paymentAmountMinor: sellerGrossAmountMinor,
        paymentCurrency: 'GHS',
        paidAt: verified.paid_at || now,
        fulfillmentStatus: 'PROCESSING',
        settlementStatus: 'PENDING',
        disputeStatus: 'NONE',
        payoutStatus: 'PENDING',
        financialBreakdown: {
          buyerPaidAmountMinor: sellerGrossAmountMinor,
          sellerGrossAmountMinor,
          sellerCommissionAmountMinor: null,
          sellerNetAmountMinor: null,
          deliveryGrossAmountMinor: 0,
          currency: 'GHS',
          settlementStatus: 'PENDING',
        },
        items: sellerLines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          price: line.unitPrice,
          productName: line.productName,
          image: line.image,
          sellerId,
        })),
        deliveryAddress: address,
      });
    }

    productSnapshots.forEach((productSnapshot, index) => {
      const line = lines[index];
      const product = productSnapshot.data() || {};
      const stock = Number(product.stock);
      const soldCount = Number(product.soldCount ?? 0);
      transaction.update(productRefs[index], {
        stock: stock - line.quantity,
        soldCount: Math.max(0, (Number.isFinite(soldCount) ? soldCount : 0) + line.quantity),
      });
    });

    transaction.set(paymentRef, {
      status: 'SUCCESS',
      provider: 'paystack',
      providerTransactionId: String(verified.id),
      amountMinor: expectedAmountMinor,
      currency: 'GHS',
      paidAt: verified.paid_at || now,
      verificationStatus: 'VERIFIED',
      orderCreated: true,
      orderCreationStatus: 'CREATED',
      orderId: marketplaceOrderId,
      orderIds,
      webhookProcessed: source === 'paystack_webhook' || payment.webhookProcessed === true,
      updatedAt: now,
    }, { merge: true });

    return { orderCreated: true, orderCreationStatus: 'CREATED', marketplaceOrderId, orderIds };
  });
}