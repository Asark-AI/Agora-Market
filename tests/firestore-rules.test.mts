import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let environment: RulesTestEnvironment;

function userDb(uid: string) {
  return environment.authenticatedContext(uid, {
    email_verified: true,
    superAdmin: false,
    admin: false,
  }).firestore();
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-agora-security-tests',
    firestore: {
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

after(async () => {
  await environment.cleanup();
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'users', 'user-a'), { id: 'user-a', email: 'a@example.test' }),
      setDoc(doc(db, 'users', 'user-b'), { id: 'user-b', email: 'b@example.test' }),
      setDoc(doc(db, 'sellers', 'seller-a'), {
        userId: 'seller-user-a',
        status: 'active',
        isVerifiedArtisan: false,
      }),
      setDoc(doc(db, 'sellers', 'seller-b'), {
        userId: 'seller-user-b',
        status: 'active',
        isVerifiedArtisan: false,
      }),
      setDoc(doc(db, 'sellers', 'seller-a', 'customers', 'customer-a'), {
        name: 'Private customer A',
        email: 'customer-a@example.test',
      }),
      setDoc(doc(db, 'sellers', 'seller-a', 'products', 'product-a'), {
        sellerId: 'seller-a',
        name: 'Product A',
        price: 100,
        stock: 3,
        status: 'active',
      }),
      setDoc(doc(db, 'sellers', 'seller-a', 'orders', 'order-a'), {
        buyerId: 'user-b',
        sellerId: 'seller-a',
        total: 100,
      }),
      setDoc(doc(db, 'orders', 'order-b'), {
        buyerId: 'user-b',
        sellerId: 'seller-b',
        total: 200,
      }),
      setDoc(doc(db, 'payments', 'payment-a'), {
        buyerId: 'user-a',
        status: 'PENDING',
        amountMinor: 1000,
        currency: 'GHS',
        provider: 'paystack',
        verificationStatus: 'UNVERIFIED',
      }),
      setDoc(doc(db, 'payments', 'payment-b'), {
        buyerId: 'user-b',
        status: 'PENDING',
        amountMinor: 2000,
        currency: 'GHS',
        provider: 'paystack',
        verificationStatus: 'UNVERIFIED',
      }),
      setDoc(doc(db, 'chats', 'chat-a'), {
        participants: ['user-a', 'seller-user-a'],
        title: 'Existing private chat',
      }),
      setDoc(doc(db, 'reviews', 'review-b'), {
        buyerId: 'user-b',
        productId: 'product-b',
        rating: 5,
        comment: 'Review from B',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
      setDoc(doc(db, 'notifications', 'notification-b'), {
        userId: 'user-b',
        message: 'Private notification',
      }),
      setDoc(doc(db, 'repairRequests', 'repair-a'), {
        buyerId: 'user-a',
        sellerId: 'seller-a',
        description: 'Private repair request',
      }),
      setDoc(doc(db, 'wishlist', 'user-b', 'items', 'product-b'), { productId: 'product-b' }),
      setDoc(doc(db, 'customers', 'legacy-customer'), {
        userId: 'user-b',
        email: 'private@example.test',
      }),
      setDoc(doc(db, 'aiShoppingToolAudit', 'audit-entry'), { actorId: 'user-b' }),
      setDoc(doc(db, 'apiRateLimits', 'limit-entry'), { scope: 'checkout', count: 1 }),
    ]);
  });
});

test('users cannot read or update another user profile', async () => {
  const db = userDb('user-a');

  await assertFails(getDoc(doc(db, 'users', 'user-b')));
  await assertFails(updateDoc(doc(db, 'users', 'user-b'), { email: 'changed@example.test' }));
});

test('buyers cannot read another buyer order or saved plan data', async () => {
  const db = userDb('user-a');

  await assertFails(getDoc(doc(db, 'orders', 'order-b')));
  await assertFails(getDoc(doc(db, 'wishlist', 'user-b', 'items', 'product-b')));
});

test('buyers can only read their payment records and cannot create or modify payment state', async () => {
  const buyerA = userDb('user-a');
  const buyerB = userDb('user-b');

  await assertSucceeds(getDoc(doc(buyerA, 'payments', 'payment-a')));
  await assertFails(getDoc(doc(buyerA, 'payments', 'payment-b')));
  await assertFails(getDoc(doc(buyerB, 'payments', 'payment-a')));
  await assertFails(updateDoc(doc(buyerA, 'payments', 'payment-a'), { status: 'SUCCESS' }));
  await assertFails(updateDoc(doc(buyerA, 'payments', 'payment-a'), {
    amountMinor: 1,
    currency: 'USD',
    provider: 'other',
    verificationStatus: 'VERIFIED',
  }));
  await assertFails(setDoc(doc(buyerA, 'payments', 'forged-payment'), {
    buyerId: 'user-a',
    status: 'SUCCESS',
    amountMinor: 1,
    currency: 'GHS',
    provider: 'paystack',
    verificationStatus: 'VERIFIED',
  }));

  await assertFails(updateDoc(doc(buyerB, 'orders', 'order-b'), { paymentStatus: 'SUCCESS' }));
  await assertFails(updateDoc(doc(buyerB, 'orders', 'order-b'), { paymentProvider: 'paystack' }));
});

test('sellers cannot read buyer payment records or other sellers financial data', async () => {
  const sellerA = userDb('seller-user-a');
  await assertFails(getDoc(doc(sellerA, 'payments', 'payment-a')));
  await assertFails(getDoc(doc(sellerA, 'financialTransactions', 'paystack_payment-a')));
  await assertFails(getDoc(doc(sellerA, 'sellerSubscriptionLocks', 'seller-b')));
  await assertFails(updateDoc(doc(sellerA, 'sellers', 'seller-a', 'orders', 'order-a'), {
    paymentStatus: 'SUCCESS',
    paymentAmountMinor: 1,
    paymentProvider: 'paystack',
  }));
});

test('chat participants cannot add users to an existing conversation', async () => {
  const db = userDb('user-a');

  await assertFails(updateDoc(doc(db, 'chats', 'chat-a'), {
    participants: ['user-a', 'seller-user-a', 'user-b'],
  }));
  await assertSucceeds(updateDoc(doc(db, 'chats', 'chat-a'), { title: 'Updated by participant' }));
});

test('review owners cannot reassign reviews to another product', async () => {
  const db = userDb('user-b');

  await assertFails(updateDoc(doc(db, 'reviews', 'review-b'), { productId: 'product-a' }));
  await assertSucceeds(updateDoc(doc(db, 'reviews', 'review-b'), { rating: 4, comment: 'Edited by owner' }));
  await assertFails(setDoc(doc(db, 'reviews', 'review-forged'), {
    buyerId: 'user-a',
    productId: 'product-a',
    rating: 6,
    comment: 'Invalid rating',
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
});

test('notification ownership and repair-request parties cannot be reassigned', async () => {
  const buyerA = userDb('user-a');
  const buyerB = userDb('user-b');

  await assertFails(getDoc(doc(buyerA, 'notifications', 'notification-b')));
  await assertFails(updateDoc(doc(buyerB, 'notifications', 'notification-b'), { userId: 'user-a' }));
  await assertFails(updateDoc(doc(buyerA, 'repairRequests', 'repair-a'), { sellerId: 'seller-b' }));
});

test('seller customer records are isolated to their owning seller', async () => {
  const sellerA = userDb('seller-user-a');
  const sellerB = userDb('seller-user-b');

  await assertSucceeds(getDoc(doc(sellerA, 'sellers', 'seller-a', 'customers', 'customer-a')));
  await assertFails(getDoc(doc(sellerB, 'sellers', 'seller-a', 'customers', 'customer-a')));
});

test('legacy shared customer directory is unavailable to clients', async () => {
  const db = userDb('user-a');

  await assertFails(getDoc(doc(db, 'customers', 'legacy-customer')));
  await assertFails(setDoc(doc(db, 'customers', 'new-customer'), { userId: 'user-a' }));
});

test('sellers cannot modify another seller listing or self-approve verification', async () => {
  const sellerA = userDb('seller-user-a');
  const sellerB = userDb('seller-user-b');

  await assertFails(updateDoc(doc(sellerB, 'sellers', 'seller-a', 'products', 'product-a'), { price: 1 }));
  await assertFails(updateDoc(doc(sellerA, 'sellers', 'seller-a'), { isVerifiedArtisan: true }));
  await assertFails(updateDoc(doc(sellerA, 'sellers', 'seller-a'), {
    customization: { paymentGateway: { secretKey: 'private-key' } },
  }));
  await assertFails(setDoc(doc(sellerA, 'sellers', 'seller-c'), {
    userId: 'seller-user-a',
    status: 'pending',
    customization: { paymentGateway: { secretKey: 'private-key' } },
  }));
});

test('sellers cannot grant themselves Premium or write subscription payment state', async () => {
  const seller = userDb('seller-user-a');
  const sellerProfile = doc(seller, 'sellers', 'seller-a');

  await assertFails(updateDoc(sellerProfile, { subscriptionPlan: 'premium' }));
  await assertFails(updateDoc(sellerProfile, {
    subscriptionPlan: 'basic',
    lastPaymentDate: '2026-10-05T00:00:00.000Z',
    nextPaymentDate: '2026-11-04T00:00:00.000Z',
  }));
  await assertFails(setDoc(doc(seller, 'sellers', 'seller-c'), {
    userId: 'seller-user-a',
    status: 'pending',
    subscriptionPlan: 'premium',
  }));
  await assertFails(getDoc(doc(seller, 'sellerSubscriptionLocks', 'seller-a')));
});

test('AI audit documents are inaccessible to client identities', async () => {
  const db = userDb('user-a');

  await assertFails(getDoc(doc(db, 'aiShoppingToolAudit', 'audit-entry')));
  await assertFails(setDoc(doc(db, 'aiShoppingToolAudit', 'forged-entry'), { actorId: 'user-a' }));
  await assertFails(getDoc(doc(db, 'apiRateLimits', 'limit-entry')));
  await assertFails(setDoc(doc(db, 'apiRateLimits', 'forged-limit'), { count: 100 }));
});
