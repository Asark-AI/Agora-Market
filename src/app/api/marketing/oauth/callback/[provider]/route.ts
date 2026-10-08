import { NextResponse } from 'next/server';
import { verifyAdminSession, verifyMarketplaceSession, verifySession, verifySuperAdminSession } from '@/lib/server/admin-auth';
import {
  cancelOAuthAuthorization,
  completeOAuthAuthorization,
  marketingCallbackRedirect,
  MarketingIntegrationError,
} from '@/lib/server/marketing-integrations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get('state') || '';
  const providerError = requestUrl.searchParams.get('error');
  const adminSessionIdentity = await verifyAdminSession();
  const identity = adminSessionIdentity || await verifySession();
  const superAdminIdentity = adminSessionIdentity ? await verifySuperAdminSession() : null;

  if (!identity || identity.email_verified !== true) {
    return NextResponse.json({ error: 'Authentication is required to complete this connection.' }, { status: 401 });
  }

  try {
    const authorized = superAdminIdentity ? adminSessionIdentity : await verifyMarketplaceSession();
    if (!authorized) throw new MarketingIntegrationError('Authentication is required.', 401);
    if (providerError) {
      const cancelled = await cancelOAuthAuthorization(state, identity);
      return NextResponse.redirect(marketingCallbackRedirect(cancelled.returnTo, provider, 'cancelled'));
    }
    const code = requestUrl.searchParams.get('code') || requestUrl.searchParams.get('auth_code');
    if (!code || code.length > 4_096) {
      throw new MarketingIntegrationError('The provider did not return a valid authorization code.', 400);
    }
    const completed = await completeOAuthAuthorization({
      provider,
      state,
      code,
      identity: authorized,
    });
    return NextResponse.redirect(marketingCallbackRedirect(completed.returnTo, provider, 'connected'));
  } catch (error) {
    const outcome = error instanceof MarketingIntegrationError && error.status === 401
      ? 'authentication_required'
      : 'error';
    const returnTo = superAdminIdentity
      ? '/super/app/dashboard/marketing'
      : '/dashboard/marketing';
    const target = marketingCallbackRedirect(returnTo, provider, outcome);
    return NextResponse.redirect(target);
  }
}
