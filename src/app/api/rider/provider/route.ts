import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/admin-auth';
import { getRiderProviderStatus } from '@/lib/server/rider-provider';

export async function GET() {
  try {
    await requireAuthenticatedUser();
    return NextResponse.json(getRiderProviderStatus());
  } catch {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }
}
