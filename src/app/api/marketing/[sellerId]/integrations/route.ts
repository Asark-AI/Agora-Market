import { NextResponse } from 'next/server';
import { authorizeMarketingAccess, marketingErrorResponse } from '@/lib/server/marketing-api';
import { getMarketingIntegrations } from '@/lib/server/marketing-integrations';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sellerId: string }> },
) {
  try {
    const { sellerId } = await params;
    await authorizeMarketingAccess(sellerId);
    return NextResponse.json(
      { integrations: await getMarketingIntegrations(sellerId) },
      { headers: { 'Cache-Control': 'no-store, private' } },
    );
  } catch (error) {
    return marketingErrorResponse(error);
  }
}
