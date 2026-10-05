import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import { initializePaystackTransaction, isPaystackConfigured, PaystackError } from '@/lib/server/paystack';
import { getAdminDb } from '@/lib/firebase-admin';
import { CheckoutValidationError, validateCheckoutLines } from '@/lib/server/checkout-validation';
import { assertSubmittedSubtotalMatches, checkoutSubtotalMinor } from '@/lib/server/checkout-pricing';
import { enforceActorRateLimit, RateLimitError } from '@/lib/server/rate-limit';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';

export async function POST(request: Request) {
  try {
    const identity = await verifyMarketplaceSession();
    if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    await enforceActorRateLimit({ scope: 'checkout-paystack-initialize', actorId: identity.uid, limit: 5, windowMs: 60_000 });
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
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      assertSubmittedSubtotalMatches(body, subtotal);
    }

    if (!isPaystackConfigured()) {
      return NextResponse.json({ error: 'Paystack is not configured on this server.' }, { status: 503 });
    }

    const appOrigin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
    if (!appOrigin) {
      return NextResponse.json({ error: 'Payment callback URL is not configured on this server.' }, { status: 503 });
    }
    const callbackUrl = `${appOrigin}/checkout/complete`;

    const amountMinor = checkoutSubtotalMinor(lines);
    const reference = `agora_${Date.now()}_${randomUUID().replace(/-/g, '')}`;
    const marketplaceOrderId = `AGO-${Date.now().toString().slice(-6)}-${randomUUID().slice(0, 4).toUpperCase()}`;

    const db = getAdminDb();
    const paymentRecord = {
      id: reference,
      orderId: marketplaceOrderId,
      buyerId: identity.uid,
      reference,
      amountMinor,
      currency: 'GHS',
      status: 'INITIALIZING',
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

    const paymentRef = db.collection('payments').doc(reference);
    await paymentRef.create(paymentRecord);

    try {
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
      if (result.reference !== reference || !result.authorization_url) {
        throw new PaystackError('Paystack returned an invalid payment initialization response.');
      }

      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(paymentRef);
        if (!snapshot.exists) throw new Error('Payment intent disappeared during initialization.');
        if (snapshot.data()?.status === 'INITIALIZING') {
          transaction.update(paymentRef, {
            status: 'PENDING',
            authorizationUrl: result.authorization_url,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      return NextResponse.json({
        ok: true,
        reference,
        marketplaceOrderId,
        authorizationUrl: result.authorization_url,
        accessCode: result.access_code,
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      });
    } catch (error) {
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(paymentRef);
        if (snapshot.exists && snapshot.data()?.status === 'INITIALIZING') {
          transaction.update(paymentRef, {
            status: 'INITIALIZATION_FAILED',
            updatedAt: new Date().toISOString(),
          });
        }
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } });
    }
    const requestId = randomUUID();
    if (!(error instanceof CheckoutValidationError)) {
      console.error(JSON.stringify({
        event: 'checkout_request_failure',
        requestId,
        scope: 'paystack_initialize',
        errorCategory: error instanceof Error ? error.name : 'unknown_error',
      }));
    }
    const message = error instanceof CheckoutValidationError ? error.message : 'Unable to initialize payment.';
    const status = error instanceof PaystackError ? (error.status || 500) : error instanceof CheckoutValidationError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
