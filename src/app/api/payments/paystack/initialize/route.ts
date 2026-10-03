import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import { initializePaystackTransaction, isPaystackConfigured, PaystackError } from '@/lib/server/paystack';
import { getAdminDb } from '@/lib/firebase-admin';
import { CheckoutValidationError, validateCheckoutLines } from '@/lib/server/checkout-validation';

export async function POST(request: Request) {
  try {
    const identity = await verifyMarketplaceSession();
    if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const body = await request.json().catch(() => null);

    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const address = body?.address;
    if (!email || typeof address?.name !== 'string' || typeof address?.phone !== 'string' || typeof address?.address !== 'string' || typeof address?.city !== 'string') {
      return NextResponse.json({ error: 'Valid email and delivery details are required.' }, { status: 400 });
    }
    if (identity.email && email.toLowerCase() !== identity.email.toLowerCase()) {
      return NextResponse.json({ error: 'Use the email address associated with your Agora account.' }, { status: 400 });
    }

    const { lines, subtotal } = await validateCheckoutLines(body?.items);
    const requestedTotal = Number(body?.amountMajor ?? body?.amount ?? 0);
    if (Number.isFinite(requestedTotal) && Math.abs(requestedTotal - subtotal) > 0.01) {
      return NextResponse.json({ error: 'Product prices changed. Review your cart and try again.', subtotal }, { status: 409 });
    }

    if (!isPaystackConfigured()) {
      return NextResponse.json({ error: 'Paystack is not configured on this server.' }, { status: 503 });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const callbackUrl = `${protocol}://${host}/checkout/complete`;

    const amountMinor = Math.round(subtotal * 100);
    const reference = `agora_${Date.now()}_${randomUUID().replace(/-/g, '')}`;
    const marketplaceOrderId = `AGO-${Date.now().toString().slice(-6)}-${randomUUID().slice(0, 4).toUpperCase()}`;

    const result = await initializePaystackTransaction({
      email,
      amountMinor,
      reference,
      callbackUrl,
      metadata: {
        orderId: marketplaceOrderId,
        marketplaceOrderId,
        buyerId: identity.uid,
        platform: 'agora',
        amountMajor: subtotal,
      },
    });

    const paymentRecord = {
      id: reference,
      orderId: marketplaceOrderId,
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
      orderDraft: {
            marketplaceOrderId,
            buyerId: identity.uid,
            buyerEmail: email,
        items: lines.map((line) => ({ ...line, price: line.unitPrice })),
            deliveryAddress: {
              name: address.name.trim(),
              phone: address.phone.trim(),
              address: address.address.trim(),
              city: address.city.trim(),
              instructions: typeof address.instructions === 'string' ? address.instructions.trim() : null,
            },
            total: subtotal,
            totalMinor: amountMinor,
            currency: 'GHS',
            deliveryFee: null,
            createdAt: new Date().toISOString(),
          },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await getAdminDb().collection('payments').doc(reference).set(paymentRecord, { merge: true });

    return NextResponse.json({
      ok: true,
      reference,
      marketplaceOrderId,
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    });
  } catch (error) {
    const message = error instanceof PaystackError ? error.message : 'Unable to initialize payment.';
    const status = error instanceof PaystackError ? (error.status || 500) : error instanceof CheckoutValidationError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
