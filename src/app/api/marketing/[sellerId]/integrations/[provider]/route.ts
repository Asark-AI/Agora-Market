import { NextResponse } from 'next/server';
import {
  applyMarketingRateLimit,
  authorizeMarketingAccess,
  marketingErrorResponse,
  parseJsonBody,
  requireSameOrigin,
} from '@/lib/server/marketing-api';
import {
  disconnectMarketingProvider,
  updateMarketingResource,
} from '@/lib/server/marketing-integrations';

type RouteContext = { params: Promise<{ sellerId: string; provider: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    requireSameOrigin(request);
    const { sellerId, provider } = await params;
    const identity = await authorizeMarketingAccess(sellerId);
    await applyMarketingRateLimit(identity.uid, 'resource-update', 10, 60_000);
    const body = await parseJsonBody(request);
    const integration = await updateMarketingResource(sellerId, provider, body.resourceId);
    return NextResponse.json({ integration });
  } catch (error) {
    return marketingErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    requireSameOrigin(request);
    const { sellerId, provider } = await params;
    const identity = await authorizeMarketingAccess(sellerId);
    await applyMarketingRateLimit(identity.uid, 'disconnect', 10, 60 * 60_000);
    const result = await disconnectMarketingProvider(sellerId, provider);
    return NextResponse.json({
      disconnected: true,
      providerRevoked: result.providerRevoked,
      message: result.providerRevoked
        ? 'Agora disconnected this account and revoked its provider access.'
        : 'Agora removed its saved credentials. Revoke Agora access in your provider settings if needed.',
    });
  } catch (error) {
    return marketingErrorResponse(error);
  }
}
