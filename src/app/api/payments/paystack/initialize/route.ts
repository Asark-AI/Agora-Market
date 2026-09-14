import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/server/admin-auth';
import { initializePaystackTransaction, isPaystackConfigured, PaystackError } from '@/lib/server/paystack';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const identity = await requireAuthenticatedUser();
    const body = await request.json().catch(() => null);

    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const sellerId = typeof body?.sellerId === 'string' ? body.sellerId : '';
    const amountMajor = Number(body?.amount ?? body?.amountMajor ?? 0);
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!email || !Number.isFinite(amountMajor) || amountMajor <= 0) {
      return NextResponse.json({ error: 'A valid email and amount are required.' }, { status: 400 });
    }

    if (!isPaystackConfigured()) {
      return NextResponse.json({ error: 'Paystack is not configured on this server.' }, { status: 503 });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const callbackUrl = typeof body?.callbackUrl === 'string' && body.callbackUrl
      ? body.callbackUrl
      : `${protocol}://${host}/checkout/complete`;

    const amountMinor = Math.round(amountMajor * 100);
    const reference = `agora_${Date.now()}_${randomUUID().replace(/-/g, '')}`;

    const result = await initializePaystackTransaction({
      email,
      amountMinor,
      reference,
      callbackUrl,
      metadata: {
        orderId: sellerId,
        sellerId,
        buyerId: identity.uid,
        platform: 'agora',
        amountMajor,
      },
    });

    const paymentRecord = {
      id: reference,
      orderId: sellerId || null,
      buyerId: identity.uid,
      reference,
      amountMinor,
      currency: 'GHS',
      status: 'PENDING',
      provider: 'paystack',
      providerTransactionId: null,
      channel: null,
      customerEmail: email,
      verificationStatus: 'UNVERIFIED',
      webhookProcessed: false,
      refundedAmountMinor: 0,
      orderDraft: sellerId
        ? {
            sellerId,
            buyerId: identity.uid,
            buyerEmail: email,
            items: items.map((item: any) => ({
              productId: String(item?.productId || ''),
              quantity: Number(item?.quantity || 0),
              price: Number(item?.price || 0),
            })).filter((item: any) => item.productId && item.quantity > 0),
            total: Number(amountMajor),
            createdAt: new Date().toISOString(),
          }
        : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await getAdminDb().collection('payments').doc(reference).set(paymentRecord, { merge: true });

    return NextResponse.json({
      ok: true,
      reference,
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    });
  } catch (error) {
    const message = error instanceof PaystackError ? error.message : 'Unable to initialize payment.';
    return NextResponse.json({ error: message }, { status: error instanceof PaystackError ? (error.status || 500) : 500 });
  }
}
