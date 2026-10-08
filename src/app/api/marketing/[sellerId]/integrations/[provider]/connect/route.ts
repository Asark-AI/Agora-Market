import { NextResponse } from 'next/server';
import {
  applyMarketingRateLimit,
  authorizeMarketingAccess,
  marketingErrorResponse,
  parseJsonBody,
  requireSameOrigin,
} from '@/lib/server/marketing-api';
import { createOAuthAuthorization } from '@/lib/server/marketing-integrations';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sellerId: string; provider: string }> },
) {
  try {
    requireSameOrigin(request);
    const { sellerId, provider } = await params;
    const identity = await authorizeMarketingAccess(sellerId);
    await applyMarketingRateLimit(identity.uid, 'oauth-start', 8, 10 * 60_000);
    const body = await parseJsonBody(request);
    if (typeof body.returnTo !== 'string') {
      return NextResponse.json({ error: 'Invalid return location.' }, { status: 400 });
    }
    const authorizationUrl = await createOAuthAuthorization(
      sellerId,
      provider,
      identity,
      body.returnTo,
    );
    return NextResponse.json({ authorizationUrl });
  } catch (error) {
    return marketingErrorResponse(error);
  }
}
