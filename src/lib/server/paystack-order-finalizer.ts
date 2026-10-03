import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import type { PaystackVerifyResult } from '@/lib/server/paystack';

type StoredCheckoutLine = {
  sellerId?: unknown;
  productId?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  price?: unknown;
  productName?: unknown;
  image?: unknown;
};

type FinalizationResult = {
  orderCreated: boolean;
  orderCreationStatus: 'CREATED' | 'ALREADY_CREATED' | 'REVIEW_REQUIRED';
  marketplaceOrderId: string;
  orderIds: Record<string, string>;
  reviewReason?: string;
};

function getStoredLines(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    throw new Error('The verified payment has no valid checkout lines.');
  }

  return value.map((raw) => {
    const line = raw as StoredCheckoutLine;
    const sellerId = typeof line.sellerId === 'string' ? line.sellerId : '';
    const productId = typeof line.productId === 'string' ? line.productId : '';
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice ?? line.price);
    if (!sellerId || !productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error('The verified payment contains an invalid checkout line.');
    }
    return {
      sellerId,
      productId,
      quantity,
      unitPrice,
      productName: typeof line.productName === 'string' ? line.productName : 'Marketplace item',
      image: typeof line.image === 'string' ? line.image : null,
    };
  });
}

export async function finalizePaystackOrder(reference: string, verified: PaystackVerifyResult, source: 'buyer_verification' | 'paystack_webhook'): Promise<FinalizationResult> {
  if (verified.status !== 'success' || verified.reference !== reference) {
    throw new Error('Paystack did not verify a successful transaction for this reference.');
  }

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
    if (!Number.isSafeInteger(expectedAmountMinor) || expectedAmountMinor <= 0 || Number(verified.amount) !== expectedAmountMinor) {
      throw new Error('Payment amount does not match the Agora payment intent.');
    }
    if (String(payment.reference || paymentSnapshot.id) !== reference || String(payment.currency || '').toUpperCase() !== 'GHS' || String(verified.currency || '').toUpperCase() !== 'GHS') {
      throw new Error('Payment reference or currency does not match the Agora payment intent.');
    }
    if (typeof payment.buyerId !== 'string' || !payment.buyerId || draft.buyerId !== payment.buyerId) {
      throw new Error('The payment intent has invalid buyer ownership data.');
    }

    const marketplaceOrderId = typeof draft.marketplaceOrderId === 'string' && draft.marketplaceOrderId
      ? draft.marketplaceOrderId
      : `AGO-${reference.slice(-10).toUpperCase()}`;
    const lines = getStoredLines(draft.items);
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