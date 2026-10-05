import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyPaystackTransaction, verifyWebhookSignature } from '@/lib/server/paystack';
import { finalizePaystackSubscription } from '@/lib/server/paystack-subscription-finalizer';
import { finalizePaystackOrder } from '@/lib/server/paystack-order-finalizer';
import { isPaystackReference } from '@/lib/server/paystack-payment-validation';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, status: 'ready' });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      console.warn(JSON.stringify({ event: 'paystack_webhook_signature_rejected', reason: 'missing_signature' }));
      return NextResponse.json({ error: 'Missing Paystack signature.' }, { status: 401 });
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn(JSON.stringify({ event: 'paystack_webhook_signature_rejected', reason: 'invalid_signature' }));
      return NextResponse.json({ error: 'Invalid Paystack signature.' }, { status: 401 });
    }

    let event: unknown;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed webhook payload.' }, { status: 400 });
    }

    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      return NextResponse.json({ error: 'Malformed webhook payload.' }, { status: 400 });
    }
    const eventRecord = event as Record<string, unknown>;
    const eventType = eventRecord.event;
    if (eventType !== 'charge.success') {
      return NextResponse.json({ ok: true, received: true, event: typeof eventType === 'string' ? eventType : 'paystack_event', ignored: true });
    }

    const payload = eventRecord.data;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json({ error: 'Missing transaction reference in webhook payload.' }, { status: 400 });
    }
    const reference = (payload as Record<string, unknown>).reference;
    if (!isPaystackReference(reference)) {
      return NextResponse.json({ error: 'Invalid transaction reference in webhook payload.' }, { status: 400 });
    }
    const db = getAdminDb();
    const paymentRef = db.collection('payments').doc(reference);
    const paymentSnapshot = await paymentRef.get();
    if (!paymentSnapshot.exists) {
      console.warn(JSON.stringify({ event: 'paystack_webhook_unknown_reference' }));
      return NextResponse.json({ error: 'Payment intent not found; retry delivery later.' }, { status: 503 });
    }

    let verified;
    try {
      verified = await verifyPaystackTransaction(reference);
    } catch (error) {
      console.error(JSON.stringify({
        event: 'paystack_webhook_verification_failure',
        errorCategory: error instanceof Error ? error.name : 'unknown_error',
      }));
      throw error;
    }
    if (verified.status !== 'success') return NextResponse.json({ ok: true, received: true, event: eventType, ignored: true });
    const payment = paymentSnapshot.data();
    const finalization = payment?.purpose === 'seller_subscription'
      ? await finalizePaystackSubscription(reference, verified, 'paystack_webhook')
      : await finalizePaystackOrder(reference, verified, 'paystack_webhook');
    const finalizationOutcome = 'status' in finalization ? finalization.status : finalization.orderCreationStatus;
    if (finalizationOutcome === 'ALREADY_CREATED' || finalizationOutcome === 'ALREADY_PROCESSED') {
      console.info(JSON.stringify({ event: 'paystack_webhook_duplicate_finalization', outcome: finalizationOutcome }));
    }
    if (finalizationOutcome === 'MISMATCH' || finalizationOutcome === 'REVIEW_REQUIRED') {
      console.error(JSON.stringify({ event: 'paystack_webhook_payment_review', outcome: finalizationOutcome }));
    }
    return NextResponse.json({ ok: true, received: true, event: eventType, ...finalization });
  } catch (error) {
    console.error(JSON.stringify({
      event: 'paystack_webhook_processing_failure',
      errorCategory: error instanceof Error ? error.name : 'unknown_error',
    }));
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
