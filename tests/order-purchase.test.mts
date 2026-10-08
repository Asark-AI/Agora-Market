import assert from 'node:assert/strict';
import test from 'node:test';
import { orderContainsProduct } from '../src/lib/order-purchase.ts';

test('matches a buyer product in seller-scoped checkout orders', () => {
  assert.equal(orderContainsProduct({
    buyerId: 'buyer-a',
    items: [{ sellerId: 'seller-a', productId: 'product-a', quantity: 1 }],
  }, 'seller-a', 'product-a', 'seller-a'), true);
});

test('preserves purchase matching for legacy top-level orders', () => {
  assert.equal(orderContainsProduct({
    sellerId: 'seller-a',
    items: [{ productId: 'product-a', quantity: 1 }],
  }, 'seller-a', 'product-a'), true);
});

test('does not match a different seller, product, or malformed order lines', () => {
  const order = { items: [{ productId: 'product-a' }] };
  assert.equal(orderContainsProduct(order, 'seller-b', 'product-a', 'seller-a'), false);
  assert.equal(orderContainsProduct(order, 'seller-a', 'product-b', 'seller-a'), false);
  assert.equal(orderContainsProduct({ items: [null, 'product-a'] }, 'seller-a', 'product-a', 'seller-a'), false);
});
