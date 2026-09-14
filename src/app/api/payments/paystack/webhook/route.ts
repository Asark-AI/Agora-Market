import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getPaystackSecretKey } from '@/lib/server/paystack';

export const runtime = 'nodejs';

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !rawBody) return false;

  try {
    const expected = createHmac('sha512', getPaystackSecretKey()).update(rawBody).digest('hex');
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null) as { status?: boolean; message?: string; data?: any } | null;
  if (!response.ok || payload?.status === false || !payload?.data) {
    throw new Error(payload?.message || 'Paystack transaction verification failed.');
  }

  return payload.data as {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel?: string;
    customer?: { email?: string };
    paid_at?: string;
    metadata?: Record<string, unknown>;
  };
}

export async function GET() {
  return NextResponse.json({ ok: true, status: 'ready' });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Paystack signature.' }, { status: 401 });
    }

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid Paystack signature.' }, { status: 401 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed webhook payload.' }, { status: 400 });
    }

    const eventType = event?.event;
    const payload = event?.data;

    if (!payload || !payload.reference) {
      return NextResponse.json({ error: 'Missing transaction reference in webhook payload.' }, { status: 400 });
    }

    if (eventType !== 'charge.success') {
      return NextResponse.json({ ok: true, received: true, event: eventType || 'paystack_event', ignored: true });
    }

    const reference = String(payload.reference);
    const db = getAdminDb();
    const paymentRef = db.collection('payments').doc(reference);
    const paymentSnapshot = await paymentRef.get();
    const existingPayment = paymentSnapshot.data() || {};

    if (existingPayment.status === 'SUCCESS' && existingPayment.webhookProcessed === true && existingPayment.orderCreated === true) {
      return NextResponse.json({ ok: true, received: true, event: eventType, deduplicated: true });
    }

    const verified = await verifyPaystackTransaction(reference);
    const expectedAmountMinor = existingPayment.orderDraft?.total !== undefined && existingPayment.orderDraft?.total !== null
      ? Math.round(Number(existingPayment.orderDraft.total) * 100)
      : undefined;

    const normalizedStatus = verified.status === 'success' ? 'SUCCESS' : verified.status === 'failed' ? 'FAILED' : 'PENDING';
    const verificationStatus = normalizedStatus === 'SUCCESS' ? 'VERIFIED' : normalizedStatus === 'FAILED' ? 'REJECTED' : 'UNVERIFIED';

    if (expectedAmountMinor !== undefined && Number(verified.amount) !== expectedAmountMinor) {
      await paymentRef.set({
        ...existingPayment,
        reference,
        status: 'FAILED',
        amountMinor: Number(verified.amount || 0),
        currency: verified.currency || existingPayment.currency || 'GHS',
        verificationStatus: 'MISMATCH',
        failureReason: `Amount mismatch: expected ${expectedAmountMinor} minor units, received ${Number(verified.amount || 0)}.`,
        webhookProcessed: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 400 });
    }

    if (verified.currency && existingPayment.orderDraft && existingPayment.orderDraft.total !== undefined && verified.currency.toUpperCase() !== 'GHS') {
      await paymentRef.set({
        ...existingPayment,
        reference,
        status: 'FAILED',
        currency: verified.currency || existingPayment.currency || 'GHS',
        verificationStatus: 'MISMATCH',
        failureReason: `Currency mismatch: expected GHS, received ${verified.currency}.`,
        webhookProcessed: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return NextResponse.json({ error: 'Payment currency mismatch.' }, { status: 400 });
    }

    const paymentUpdate = {
      ...existingPayment,
      reference,
      orderId: existingPayment.orderId || payload.order_id || null,
      buyerId: existingPayment.buyerId || payload.customer?.id || null,
      amountMinor: Number(verified.amount ?? existingPayment.amountMinor ?? 0),
      currency: verified.currency || existingPayment.currency || 'GHS',
      status: normalizedStatus,
      provider: 'paystack',
      providerTransactionId: String(verified.id ?? existingPayment.providerTransactionId ?? ''),
      channel: verified.channel || existingPayment.channel || null,
      customerEmail: verified.customer?.email || existingPayment.customerEmail || null,
      paidAt: verified.paid_at || existingPayment.paidAt || null,
      verificationStatus,
      webhookProcessed: true,
      updatedAt: new Date().toISOString(),
    };

    await paymentRef.set(paymentUpdate, { merge: true });

    if (normalizedStatus === 'SUCCESS' && existingPayment.orderDraft?.sellerId && Array.isArray(existingPayment.orderDraft.items) && existingPayment.orderDraft.items.length > 0) {
      const sellerId = String(existingPayment.orderDraft.sellerId);
      const orderQuery = await db.collection('sellers').doc(sellerId).collection('orders').where('paymentReference', '==', reference).limit(1).get();
      const orderDoc = orderQuery.docs[0];

      if (!orderDoc) {
        const orderRecord = {
          buyerId: existingPayment.orderDraft.buyerId,
          userId: existingPayment.orderDraft.buyerId,
          date: new Date().toISOString(),
          total: Number(existingPayment.orderDraft.total || Number(verified.amount || 0) / 100),
          status: 'pending',
          items: existingPayment.orderDraft.items.map((item: any) => ({
            productId: String(item.productId),
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
          })),
          paymentMethod: 'paystack',
          transactionId: reference,
          paymentReference: reference,
          paymentProvider: 'paystack',
          paymentStatus: 'SUCCESS',
          paymentAmountMinor: Number(verified.amount || 0),
          paymentCurrency: verified.currency || 'GHS',
          paidAt: verified.paid_at || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const createdOrderRef = await db.collection('sellers').doc(sellerId).collection('orders').add(orderRecord);
        await paymentRef.set({
          orderCreated: true,
          orderId: createdOrderRef.id,
          status: 'SUCCESS',
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        for (const item of existingPayment.orderDraft.items) {
          const productId = String(item.productId || '');
          const quantity = Number(item.quantity || 0);
          if (!productId || quantity <= 0) continue;

          const productRef = db.collection('sellers').doc(sellerId).collection('products').doc(productId);
          const productSnap = await productRef.get();
          if (productSnap.exists) {
            const currentStock = Number(productSnap.data()?.stock ?? 0);
            await productRef.update({ stock: Math.max(0, currentStock - quantity) });
          }
        }
      } else {
        await orderDoc.ref.update({
          paymentStatus: 'SUCCESS',
          paymentProvider: 'paystack',
          paymentReference: reference,
          paymentAmountMinor: Number(verified.amount || 0),
          paymentCurrency: verified.currency || 'GHS',
          paidAt: verified.paid_at || null,
          updatedAt: new Date().toISOString(),
          status: orderDoc.data().status === 'cancelled' ? orderDoc.data().status : orderDoc.data().status,
        });

        await paymentRef.set({
          orderCreated: true,
          orderId: orderDoc.id,
          status: 'SUCCESS',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }

    return NextResponse.json({ ok: true, received: true, event: eventType || 'paystack_event' });
  } catch (error) {
    console.error('[Paystack Webhook] Failed to process event.', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
