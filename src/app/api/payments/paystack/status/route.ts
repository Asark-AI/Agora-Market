import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/admin-auth';

export async function GET() {
  try {
    await requireAuthenticatedUser();
    return NextResponse.json({
      configured: Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
      publicKeyAvailable: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
      currency: 'GHS',
    });
  } catch {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }
}
