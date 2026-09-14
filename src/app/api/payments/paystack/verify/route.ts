import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { requireAuthenticatedUser } from '@/lib/server/admin-auth';
import { PaystackError, verifyPaystackTransaction } from '@/lib/server/paystack';

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser();
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

    if (normalizedStatus !== 'SUCCESS' && normalizedStatus !== 'FAILED') {
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

    if (existingPayment.orderCreated === true || existingPayment.status === 'SUCCESS') {
      return NextResponse.json({
        ok: true,
        verified: true,
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

    if (draft?.sellerId && Array.isArray(draft.items) && draft.items.length > 0) {
      const sellerId = String(draft.sellerId);
      const orderRecord = {
        buyerId: draft.buyerId,
        userId: draft.buyerId,
        date: new Date().toISOString(),
        total: Number(draft.total || result.amount / 100),
        status: 'pending',
        items: draft.items.map((item: any) => ({
          productId: String(item.productId),
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
        })),
        paymentMethod: 'paystack',
        transactionId: reference,
        paymentReference: reference,
        paymentProvider: 'paystack',
        paymentStatus: normalizedStatus,
        paymentAmountMinor: result.amount,
        paymentCurrency: result.currency,
        paidAt: result.paid_at || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const orderRef = await getAdminDb().collection('sellers').doc(sellerId).collection('orders').add(orderRecord);

      await paymentRef.set({
        orderCreated: true,
        orderId: orderRef.id,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      for (const item of draft.items) {
        const productId = String(item.productId || '');
        const quantity = Number(item.quantity || 0);
        if (!productId || quantity <= 0) continue;

        const productRef = getAdminDb().collection('sellers').doc(sellerId).collection('products').doc(productId);
        const productSnap = await productRef.get();
        if (productSnap.exists) {
          const currentStock = Number(productSnap.data()?.stock ?? 0);
          await productRef.update({ stock: Math.max(0, currentStock - quantity) });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      verified: normalizedStatus === 'SUCCESS',
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
