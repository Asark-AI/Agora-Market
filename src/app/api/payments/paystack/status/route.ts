import { NextResponse } from 'next/server';
import { verifyMarketplaceSession } from '@/lib/server/admin-auth';
import { isPaystackConfigured } from '@/lib/server/paystack';

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
    if (!await verifyMarketplaceSession()) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY && !isPlaceholderValue(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY));

    return NextResponse.json({
      configured: isPaystackConfigured(),
      publicKeyAvailable: hasPublicKey,
      currency: 'GHS',
    });
  } catch {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }
}
