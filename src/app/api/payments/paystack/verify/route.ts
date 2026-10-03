import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import { PaystackError, verifyPaystackTransaction } from '@/lib/server/paystack';
import { finalizePaystackOrder } from '@/lib/server/paystack-order-finalizer';

export async function POST(request: Request) {
  try {
    const identity = await verifyMarketplaceSession();
    if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const body = await request.json().catch(() => null);
    const reference = typeof body?.reference === 'string' ? body.reference.trim() : '';

    if (!reference) {
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
    await getAdminDb().runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(paymentRef);
      const current = currentSnapshot.data();
      if (!currentSnapshot.exists || current?.buyerId !== identity.uid) throw new Error('Payment intent not found.');
      if (current.status === 'SUCCESS') return;
      transaction.set(paymentRef, {
        status,
        provider: 'paystack',
        providerTransactionId: String(result.id),
        amountMinor: Number(result.amount || current.amountMinor),
        currency: result.currency || current.currency,
        verificationStatus: status === 'FAILED' ? 'REJECTED' : 'UNVERIFIED',
        channel: result.channel || current.channel || null,
        customerEmail: result.customer?.email || current.customerEmail || null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });

    return NextResponse.json({ ok: true, verified: false, payment: { reference, status } });
  } catch (error) {
    const message = error instanceof PaystackError ? error.message : 'Unable to verify payment.';
    return NextResponse.json({ error: message }, { status: error instanceof PaystackError ? (error.status || 500) : 500 });
  }
}
