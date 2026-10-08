import { NextResponse } from 'next/server';
import {
  applyMarketingRateLimit,
  authorizeMarketingAccess,
  marketingErrorResponse,
  requireSameOrigin,
} from '@/lib/server/marketing-api';
import { syncMarketingProvider } from '@/lib/server/marketing-integrations';

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sellerId: string; provider: string }> },
) {
  try {
    requireSameOrigin(request);
    const { sellerId, provider } = await params;
    const identity = await authorizeMarketingAccess(sellerId);
    await applyMarketingRateLimit(identity.uid, 'sync', 10, 10 * 60_000);
    const integration = await syncMarketingProvider(sellerId, provider);
    return NextResponse.json({ integration });
  } catch (error) {
    return marketingErrorResponse(error);
  }
}
