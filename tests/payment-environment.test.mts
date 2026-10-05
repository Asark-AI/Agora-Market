import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateStagingPaymentEnvironment } from '../scripts/check-staging-payment-env.mjs';

const validStagingEnv = {
  AGORA_ENVIRONMENT: 'staging',
  AGORA_APP_URL: 'https://staging.agora.example',
  AGORA_PRODUCTION_APP_URL: 'https://agora.example',
  AGORA_PRODUCTION_FIREBASE_PROJECT_ID: 'agora-production',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'AIza-staging-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'agora-staging.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'agora-staging',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'agora-staging.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:staging',
  FIREBASE_ADMIN_PROJECT_ID: 'agora-staging',
  PAYSTACK_MODE: 'test',
  PAYSTACK_SECRET_KEY: 'sk_test_staging_value',
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: 'pk_test_staging_value',
  RESEND_API_KEY: 're_staging_value',
  EMAIL_FROM: 'Agora <no-reply@staging-agora.test>',
  EMAIL_OTP_HMAC_SECRET: 'staging-only-hmac-secret-with-at-least-32-characters',
};

test('staging preflight accepts isolated Firebase, HTTPS origin, and Paystack test keys', () => {
  assert.deepEqual(validateStagingPaymentEnvironment(validStagingEnv), []);
});

test('staging preflight rejects live Paystack keys and production environment mode', () => {
  const errors = validateStagingPaymentEnvironment({
    ...validStagingEnv,
    PAYSTACK_MODE: 'live',
    PAYSTACK_SECRET_KEY: 'sk_live_not-for-staging',
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: 'pk_live_not-for-staging',
  });
  assert(errors.some((error) => error.includes('PAYSTACK_MODE')));
  assert(errors.some((error) => error.includes('PAYSTACK_SECRET_KEY')));
  assert(errors.some((error) => error.includes('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY')));
});

test('staging preflight rejects shared or insecure application and Firebase projects', () => {
  const errors = validateStagingPaymentEnvironment({
    ...validStagingEnv,
    AGORA_APP_URL: 'http://agora.example/path',
    AGORA_PRODUCTION_APP_URL: 'http://agora.example/path',
    FIREBASE_ADMIN_PROJECT_ID: 'agora-production',
    AGORA_PRODUCTION_FIREBASE_PROJECT_ID: 'agora-staging',
  });
  assert(errors.some((error) => error.includes('AGORA_APP_URL')));
  assert(errors.some((error) => error.includes('differ from the production origin')));
  assert(errors.some((error) => error.includes('project IDs must match')));
  assert(errors.some((error) => error.includes('differ from the production project ID')));
});

test('staging preflight rejects placeholders and any public payment or admin secrets', () => {
  const errors = validateStagingPaymentEnvironment({
    ...validStagingEnv,
    NEXT_PUBLIC_FIREBASE_API_KEY: 'REPLACE_WITH_KEY',
    NEXT_PUBLIC_PAYSTACK_SECRET_KEY: 'sk_test_do-not-expose',
    NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATE_KEY: 'not-a-real-key',
    NEXT_PUBLIC_RESEND_TOKEN: 'not-a-real-token',
  });
  assert(errors.some((error) => error.includes('NEXT_PUBLIC_FIREBASE_API_KEY')));
  assert(errors.some((error) => error.includes('NEXT_PUBLIC_PAYSTACK_SECRET_KEY')));
  assert(errors.some((error) => error.includes('NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATE_KEY')));
  assert(errors.some((error) => error.includes('NEXT_PUBLIC_RESEND_TOKEN')));
});

test('staging preflight requires a strong OTP secret and configured email sender', () => {
  const errors = validateStagingPaymentEnvironment({
    ...validStagingEnv,
    RESEND_API_KEY: '',
    EMAIL_FROM: 'Agora <no-reply@your-domain.com>',
    EMAIL_OTP_HMAC_SECRET: 'short',
  });
  assert(errors.some((error) => error.includes('RESEND_API_KEY')));
  assert(errors.some((error) => error.includes('EMAIL_FROM')));
  assert(errors.some((error) => error.includes('EMAIL_OTP_HMAC_SECRET')));
});
