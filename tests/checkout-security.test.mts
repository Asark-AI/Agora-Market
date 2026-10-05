import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertSubmittedSubtotalMatches,
  checkoutSubtotal,
  checkoutSubtotalMinor,
  CheckoutValidationError,
  currentProductUnitPrice,
  parseCheckoutLines,
} from '../src/lib/server/checkout-pricing.ts';

test('checkout accepts bounded unique IDs and integer quantities', () => {
  assert.deepEqual(parseCheckoutLines([
    { sellerId: 'seller-a', productId: 'product-a', quantity: 2 },
  ]), [{ sellerId: 'seller-a', productId: 'product-a', quantity: 2 }]);
});

test('checkout rejects missing, malformed, path-like and oversized document IDs', () => {
  for (const line of [
    null,
    { sellerId: 'seller/a', productId: 'product-a', quantity: 1 },
    { sellerId: '..', productId: 'product-a', quantity: 1 },
    { sellerId: 'seller-a', productId: 'x'.repeat(129), quantity: 1 },
    { sellerId: 'seller-a', productId: 'product-a', quantity: '1' },
  ]) {
    assert.throws(() => parseCheckoutLines([line]), CheckoutValidationError);
  }
});

test('checkout rejects duplicate products and out-of-range quantities', () => {
  assert.throws(() => parseCheckoutLines([
    { sellerId: 'seller-a', productId: 'product-a', quantity: 1 },
    { sellerId: 'seller-a', productId: 'product-a', quantity: 2 },
  ]), CheckoutValidationError);
  for (const quantity of [-1, 0, 1.2, 100, Number.MAX_SAFE_INTEGER, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => parseCheckoutLines([
      { sellerId: 'seller-a', productId: 'product-a', quantity },
    ]), CheckoutValidationError);
  }
});

test('checkout rejects negative, non-finite, excessive-precision and unsafe prices', () => {
  for (const price of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY, 1.001, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => currentProductUnitPrice({ price }), CheckoutValidationError);
  }
});

test('checkout uses only a valid discount below the authoritative regular price', () => {
  assert.equal(currentProductUnitPrice({ price: 200, discountPrice: 150 }), 150);
  assert.equal(currentProductUnitPrice({ price: 200, discountPrice: 0 }), 200);
  assert.throws(() => currentProductUnitPrice({ price: 200, discountPrice: 250 }), CheckoutValidationError);
  assert.throws(() => currentProductUnitPrice({ price: 200, discountPrice: -1 }), CheckoutValidationError);
});

test('checkout totals use safe integer minor units and reject overflow', () => {
  assert.equal(checkoutSubtotal([{ unitPrice: 19.99, quantity: 3 }]), 59.97);
  assert.equal(checkoutSubtotalMinor([{ unitPrice: 19.99, quantity: 3 }]), 5997);
  assert.throws(
    () => checkoutSubtotal([{ unitPrice: Number.MAX_SAFE_INTEGER / 100, quantity: 2 }]),
    CheckoutValidationError
  );
});

test('submitted totals cannot override current server totals or currency', () => {
  assert.doesNotThrow(() => assertSubmittedSubtotalMatches({ amount: 100 }, 100));
  assert.throws(() => assertSubmittedSubtotalMatches({ amountMajor: 'NaN' }, 100), CheckoutValidationError);
  assert.throws(() => assertSubmittedSubtotalMatches({ amount: -1 }, 100), CheckoutValidationError);
  assert.throws(() => assertSubmittedSubtotalMatches({ amountMajor: 99.99 }, 100), CheckoutValidationError);
  assert.throws(() => assertSubmittedSubtotalMatches({ currency: 'USD' }, 100), CheckoutValidationError);
  for (const field of ['shippingFee', 'deliveryFee', 'discount', 'discountAmount', 'finalTotal', 'total']) {
    assert.throws(() => assertSubmittedSubtotalMatches({ [field]: 0 }, 100), CheckoutValidationError);
  }
});
