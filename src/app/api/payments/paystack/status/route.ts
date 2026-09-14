import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/admin-auth';

function isPlaceholderValue(value?: string): boolean {
  if (!value) return true;
  const normalized = value.trim();
  return normalized.length === 0
    || normalized.toUpperCase().startsWith('REPLACE_WITH_')
    || normalized.toUpperCase().includes('PLACEHOLDER')
    || normalized.toUpperCase().includes('YOUR_PAYSTACK')
    || normalized.includes('abc123')
    || normalized.includes('def456')
    || normalized.includes('changeme');
}

export async function GET() {
  try {
    await requireAuthenticatedUser();
    const hasSecret = Boolean(process.env.PAYSTACK_SECRET_KEY && !isPlaceholderValue(process.env.PAYSTACK_SECRET_KEY));
    const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY && !isPlaceholderValue(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY));
    const hasWebhookSecret = Boolean(process.env.PAYSTACK_WEBHOOK_SECRET && !isPlaceholderValue(process.env.PAYSTACK_WEBHOOK_SECRET));

    return NextResponse.json({
      configured: hasSecret && hasPublicKey,
      publicKeyAvailable: hasPublicKey,
      webhookSecretConfigured: hasWebhookSecret || hasSecret,
      currency: 'GHS',
    });
  } catch {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }
}
