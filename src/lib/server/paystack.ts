import 'server-only';

const PAYSTACK_API_BASE = 'https://api.paystack.co';

export class PaystackError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'PaystackError';
  }
}

function getSecretKey(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new PaystackError('Paystack is not configured.');
  return secret;
}

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null) as { status?: boolean; message?: string; data?: T } | null;
  if (!response.ok || payload?.status === false) {
    throw new PaystackError(payload?.message || 'Paystack request failed.', response.status);
  }
  return payload?.data as T;
}

export type PaystackInitializeResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackVerifyResult = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  paid_at?: string;
  customer?: { email?: string };
};

export async function initializePaystackTransaction(input: {
  email: string;
  amountMinor: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeResult> {
  return paystackRequest<PaystackInitializeResult>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: 'GHS',
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  if (!reference || /[\s/]/.test(reference)) throw new PaystackError('Invalid payment reference.');
  return paystackRequest<PaystackVerifyResult>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });
}

export async function refundPaystackTransaction(input: { transactionId: number; amountMinor?: number; currency?: 'GHS' }): Promise<Record<string, unknown>> {
  return paystackRequest<Record<string, unknown>>('/refund', {
    method: 'POST',
    body: JSON.stringify({
      transaction: input.transactionId,
      ...(input.amountMinor !== undefined ? { amount: input.amountMinor } : {}),
      currency: input.currency || 'GHS',
    }),
  });
}
