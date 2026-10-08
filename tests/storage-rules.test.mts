import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

let environment: RulesTestEnvironment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-agora-storage-security-tests',
    firestore: {
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
    storage: {
      rules: await readFile(new URL('../storage.rules', import.meta.url), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });
});

after(async () => {
  await environment.cleanup();
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'sellers', 'seller-a'), {
      userId: 'seller-user-a',
      status: 'active',
    });
  });
});

test('seller owners can upload allowed media only to their own seller prefix', async () => {
  const storage = environment.authenticatedContext('seller-user-a', { email_verified: true }).storage();
  await assertSucceeds(uploadBytes(ref(storage, 'sellers/seller-a/products/photo.png'), new Blob(['image'], { type: 'image/png' })));
  await assertFails(uploadBytes(ref(storage, 'sellers/seller-b/products/photo.png'), new Blob(['image'], { type: 'image/png' })));
  await assertFails(uploadBytes(ref(storage, 'sellers/seller-a/products/invalid.exe'), new Blob(['file'], { type: 'application/octet-stream' })));
});

test('Super Admin role tokens cannot write seller media, regardless of MFA claim', async () => {
  const adminStorage = environment.authenticatedContext('seller-user-a', {
    email_verified: true,
    role: 'super_admin',
    firebase: { sign_in_second_factor: 'totp' },
  }).storage();
  await assertFails(uploadBytes(ref(adminStorage, 'sellers/seller-a/products/photo.png'), new Blob(['image'], { type: 'image/png' })));
});

test('legacy Super Admin claims cannot write seller media', async () => {
  const legacyAdminStorage = environment.authenticatedContext('seller-user-a', {
    email_verified: true,
    superAdmin: true,
  }).storage();
  await assertFails(uploadBytes(ref(legacyAdminStorage, 'sellers/seller-a/products/photo.png'), new Blob(['image'], { type: 'image/png' })));
});
