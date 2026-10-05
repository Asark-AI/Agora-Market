import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import {
  isPaystackReference,
  paystackCredentialsMatchEnvironment,
  paystackPaymentMismatch,
  PREMIUM_SELLER_PLAN,
  verifyPaystackWebhookSignature,
} from '../src/lib/server/paystack-payment-validation.ts';

const verified = {
  status: 'success',
  reference: 'agora_test_12345',
  amount: 5000,
  currency: 'GHS',
};

test('verified Paystack transaction must match reference, status, amount, and currency', () => {
  assert.equal(paystackPaymentMismatch('agora_test_12345', 5000, 'GHS', verified), null);
  assert.equal(paystackPaymentMismatch('different_reference', 5000, 'GHS', verified), 'reference');
  assert.equal(paystackPaymentMismatch('agora_test_12345', 5000, 'GHS', { ...verified, status: 'pending' }), 'status');
  assert.equal(paystackPaymentMismatch('agora_test_12345', 4999, 'GHS', verified), 'amount');
  assert.equal(paystackPaymentMismatch('agora_test_12345', 5000, 'USD', verified), 'currency');
});

test('invalid expected amounts can never validate', () => {
  for (const amount of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(paystackPaymentMismatch('agora_test_12345', amount, 'GHS', verified), 'amount');
  }
});

test('Paystack references are bounded document-safe identifiers', () => {
  assert.equal(isPaystackReference('agora_test_12345'), true);
  for (const value of ['', 'short', 'reference/with/slash', 'white space', 'x'.repeat(101), null, 5]) {
    assert.equal(isPaystackReference(value), false);
  }
});

test('Paystack webhook signatures authenticate the exact raw payload', () => {
  const rawBody = '{"event":"charge.success","data":{"reference":"agora_test_12345"}}';
  const secret = 'test-webhook-secret';
  const signature = createHmac('sha512', secret).update(rawBody).digest('hex');

  assert.equal(verifyPaystackWebhookSignature(rawBody, signature, secret), true);
  assert.equal(verifyPaystackWebhookSignature(`${rawBody} `, signature, secret), false);
  assert.equal(verifyPaystackWebhookSignature(rawBody, '0'.repeat(128), secret), false);
  assert.equal(verifyPaystackWebhookSignature(rawBody, null, secret), false);
  assert.equal(verifyPaystackWebhookSignature(rawBody, signature, ''), false);
});

test('Paystack keys must match the explicit deployment mode', () => {
  assert.equal(paystackCredentialsMatchEnvironment('staging', 'test', 'sk_test_secret', 'pk_test_public'), true);
  assert.equal(paystackCredentialsMatchEnvironment('development', 'live', 'sk_live_secret', 'pk_live_public'), false);
  assert.equal(paystackCredentialsMatchEnvironment('production', 'test', 'sk_test_secret', 'pk_test_public'), false);
  assert.equal(paystackCredentialsMatchEnvironment('production', 'live', 'sk_live_secret', 'pk_live_public'), true);
  assert.equal(paystackCredentialsMatchEnvironment('staging', 'test', 'sk_live_secret', 'pk_test_public'), false);
  assert.equal(paystackCredentialsMatchEnvironment(undefined, 'test', 'sk_test_secret', 'pk_test_public'), false);
});

test('Premium seller subscription is charged only from a server-owned GHS plan definition', () => {
  assert.deepEqual(PREMIUM_SELLER_PLAN, {
    id: 'premium',
    amountMinor: 5000,
    currency: 'GHS',
    intervalDays: 30,
  });
});
