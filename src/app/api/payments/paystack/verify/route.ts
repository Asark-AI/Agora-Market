import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/server/admin-auth';
import { PaystackError, verifyPaystackTransaction } from '@/lib/server/paystack';

export async function POST(request: Request) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const body = await request.json().catch(() => null);
    const reference = typeof body?.reference === 'string' ? body.reference.trim() : '';

    if (!reference) {
      return NextResponse.json({ error: 'A payment reference is required.' }, { status: 400 });
    }

    const result = await verifyPaystackTransaction(reference);
    const paymentRef = getAdminDb().collection('payments').doc(reference);
    const paymentSnapshot = await paymentRef.get();
    const existingPayment = paymentSnapshot.data() || {};
    const draft = existingPayment.orderDraft || null;

    const normalizedStatus = result.status === 'success' ? 'SUCCESS' : result.status === 'failed' ? 'FAILED' : 'PENDING';
    const verificationStatus = normalizedStatus === 'SUCCESS' ? 'VERIFIED' : normalizedStatus === 'FAILED' ? 'REJECTED' : 'UNVERIFIED';

    const expectedAmountMinor = draft?.total !== undefined && draft?.total !== null
      ? Math.round(Number(draft.total) * 100)
      : undefined;

    if (expectedAmountMinor !== undefined && Number(result.amount) !== expectedAmountMinor) {
      await paymentRef.set({
        ...existingPayment,
        reference,
        amountMinor: Number(result.amount || 0),
        currency: result.currency || existingPayment.currency || 'GHS',
        status: 'FAILED',
        provider: 'paystack',
        providerTransactionId: String(result.id),
        verificationStatus: 'MISMATCH',
        failureReason: `Amount mismatch: expected ${expectedAmountMinor} minor units, received ${Number(result.amount || 0)}.`,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return NextResponse.json({
        ok: false,
        verified: false,
        error: 'Payment amount does not match the order amount.',
      }, { status: 400 });
    }

    if (normalizedStatus !== 'SUCCESS') {
      await paymentRef.set({
        ...existingPayment,
        reference,
        amountMinor: result.amount,
        currency: result.currency,
        status: normalizedStatus,
        provider: 'paystack',
        providerTransactionId: String(result.id),
        channel: result.channel || existingPayment.channel || null,
        customerEmail: result.customer?.email || existingPayment.customerEmail || null,
        paidAt: result.paid_at || existingPayment.paidAt || null,
        verificationStatus,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return NextResponse.json({
        ok: true,
        verified: false,
        payment: {
          reference,
          amountMinor: result.amount,
          currency: result.currency,
          status: normalizedStatus,
          providerTransactionId: String(result.id),
        },
      });
    }

    if (existingPayment.orderCreated === true) {
      return NextResponse.json({
        ok: true,
        verified: true,
        marketplaceOrderId: existingPayment.orderId || draft?.marketplaceOrderId || null,
        payment: {
          reference,
          amountMinor: result.amount,
          currency: result.currency,
          status: 'SUCCESS',
          providerTransactionId: String(result.id),
        },
      });
    }

    await paymentRef.set({
      ...existingPayment,
      reference,
      amountMinor: result.amount,
      currency: result.currency,
      status: normalizedStatus,
      provider: 'paystack',
      providerTransactionId: String(result.id),
      channel: result.channel || existingPayment.channel || null,
      customerEmail: result.customer?.email || existingPayment.customerEmail || null,
      paidAt: result.paid_at || existingPayment.paidAt || null,
      verificationStatus,
      orderCreated: false,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    const lines = Array.isArray(draft?.items) ? draft.items : [];
    const groups = new Map<string, any[]>();
    for (const item of lines) {
      const sellerId = String(item.sellerId || draft?.sellerId || '');
      if (!sellerId || !item.productId || Number(item.quantity) <= 0) continue;
      groups.set(sellerId, [...(groups.get(sellerId) || []), item]);
    }

    const db = getAdminDb();
    const marketplaceOrderId = String(draft?.marketplaceOrderId || `AGO-${reference.slice(-10).toUpperCase()}`);
    const orderIds: Record<string, string> = {};
    for (const [sellerId, sellerItems] of groups) {
      const orderRef = db.collection('sellers').doc(sellerId).collection('orders').doc(`${reference}_${sellerId}`);
      const productRefs = sellerItems.map((item) => db.collection('sellers').doc(sellerId).collection('products').doc(String(item.productId)));
      const sellerTotal = sellerItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
      await db.runTransaction(async (transaction) => {
        const existingOrder = await transaction.get(orderRef);
        if (existingOrder.exists) return;
        const products = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));
        const now = new Date().toISOString();
        for (let index = 0; index < products.length; index += 1) {
          const product = products[index].data();
          const quantity = Number(sellerItems[index].quantity || 0);
          const stock = Number(product?.stock ?? 0);
          if (!products[index].exists || stock < quantity) {
            throw new Error('A paid order requires seller review because product stock changed during payment.');
          }
        }
        transaction.set(orderRef, {
          marketplaceOrderId,
          buyerId: draft.buyerId,
          userId: draft.buyerId,
          buyerEmail: draft.buyerEmail || result.customer?.email || null,
          date: now,
          createdAt: now,
          updatedAt: now,
          subtotal: Number(sellerTotal.toFixed(2)),
          deliveryFee: null,
          deliveryFeeStatus: 'seller_to_confirm',
          total: Number(sellerTotal.toFixed(2)),
          status: 'pending',
          items: sellerItems.map((item) => ({
            productId: String(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            productName: String(item.productName || 'Marketplace item'),
            image: item.image || null,
          })),
          deliveryAddress: draft.deliveryAddress || null,
          paymentMethod: 'paystack',
          transactionId: reference,
          paymentReference: reference,
          paymentProvider: 'paystack',
          paymentStatus: normalizedStatus,
          paymentAmountMinor: result.amount,
          paymentCurrency: result.currency,
          paidAt: result.paid_at || null,
        });
        products.forEach((productSnapshot, index) => {
          const product = productSnapshot.data();
          const quantity = Number(sellerItems[index].quantity);
          const soldCount = Number(product?.soldCount ?? 0);
          transaction.update(productRefs[index], {
            stock: Number(product?.stock ?? 0) - quantity,
            ...(normalizedStatus === 'SUCCESS' ? { soldCount: Math.max(0, Number.isFinite(soldCount) ? soldCount : 0) + quantity } : {}),
          });
        });
      });
      orderIds[sellerId] = orderRef.id;
    }

    await paymentRef.set({
      orderCreated: Object.keys(orderIds).length > 0,
      orderId: marketplaceOrderId,
      orderIds,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      ok: true,
      verified: normalizedStatus === 'SUCCESS',
      marketplaceOrderId,
      orderIds,
      payment: {
        reference,
        amountMinor: result.amount,
        currency: result.currency,
        status: normalizedStatus,
        providerTransactionId: String(result.id),
      },
    });
  } catch (error) {
    const message = error instanceof PaystackError ? error.message : 'Unable to verify payment.';
    return NextResponse.json({ error: message }, { status: error instanceof PaystackError ? (error.status || 500) : 500 });
  }
}
