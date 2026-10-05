import { createHmac, timingSafeEqual } from 'node:crypto';

export type VerifiedPaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
};

export type PaymentMismatch = 'reference' | 'status' | 'amount' | 'currency';

export function paystackPaymentMismatch(
  reference: string,
  expectedAmountMinor: number,
  expectedCurrency: string,
  transaction: VerifiedPaystackTransaction
): PaymentMismatch | null {
  if (transaction.reference !== reference) return 'reference';
  if (transaction.status !== 'success') return 'status';
  if (!Number.isSafeInteger(expectedAmountMinor) || expectedAmountMinor <= 0 || transaction.amount !== expectedAmountMinor) return 'amount';
  if (transaction.currency.toUpperCase() !== expectedCurrency.toUpperCase()) return 'currency';
  return null;
}

export function isPaystackReference(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 8
    && value.length <= 100
    && /^[A-Za-z0-9_-]+$/.test(value);
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!rawBody || !signature || !secret) return false;

  try {
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function paystackCredentialsMatchEnvironment(
  environment: string | undefined,
  mode: string | undefined,
  secret: string,
  publicKey: string
): boolean {
  if (mode !== 'test' && mode !== 'live') return false;
  if (!['development', 'staging', 'production'].includes(environment || '')) return false;
  if ((environment === 'staging' || environment === 'development') && mode !== 'test') return false;
  if (environment === 'production' && mode !== 'live') return false;
  const prefix = mode === 'test' ? 'test' : 'live';
  return secret.startsWith(`sk_${prefix}_`) && publicKey.startsWith(`pk_${prefix}_`);
}

export const PREMIUM_SELLER_PLAN = {
  id: 'premium',
  amountMinor: 5000,
  currency: 'GHS',
  intervalDays: 30,
} as const;
