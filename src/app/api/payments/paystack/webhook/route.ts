import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyPaystackTransaction, verifyWebhookSignature } from '@/lib/server/paystack';
import { finalizePaystackOrder } from '@/lib/server/paystack-order-finalizer';

export const runtime = 'nodejs';

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

    if (!verifyWebhookSignature(rawBody, signature)) {
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
    if (!paymentSnapshot.exists) return NextResponse.json({ error: 'Payment intent not found; retry delivery later.' }, { status: 503 });

    const verified = await verifyPaystackTransaction(reference);
    if (verified.status !== 'success') return NextResponse.json({ ok: true, received: true, event: eventType, ignored: true });
    const finalization = await finalizePaystackOrder(reference, verified, 'paystack_webhook');
    return NextResponse.json({ ok: true, received: true, event: eventType, ...finalization });
  } catch (error) {
    console.error('[Paystack Webhook] Failed to process event.', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
