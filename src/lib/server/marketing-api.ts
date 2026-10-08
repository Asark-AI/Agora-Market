import 'server-only';

import { NextResponse } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { requireSellerOwner } from '@/lib/server/authorization';
import { verifyAdminSession, verifyMarketplaceSession, verifySession } from '@/lib/server/admin-auth';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';
import {
  MarketingIntegrationError,
} from '@/lib/server/marketing-integrations';
import {
  RateLimitError,
  enforceActorRateLimit,
} from '@/lib/server/rate-limit';

export async function authorizeMarketingAccess(sellerId: string): Promise<DecodedIdToken> {
  const adminSession = await verifyAdminSession();
  if (adminSession) {
    if (!sellerId || /[\\/\s]/.test(sellerId)) {
      throw new MarketingIntegrationError('Invalid seller ID.');
    }
    return adminSession;
  }
  const identity = await verifySession();
  if (!identity) throw new MarketingIntegrationError('Authentication is required.', 401);
  if (identity.email_verified !== true) {
    throw new MarketingIntegrationError('Verify your email before managing marketing integrations.', 403);
  }
  const marketplaceIdentity = await verifyMarketplaceSession();
  if (!marketplaceIdentity) throw new MarketingIntegrationError('Authentication is required.', 401);
  try {
    await requireSellerOwner(marketplaceIdentity, sellerId);
  } catch {
    throw new MarketingIntegrationError('Seller access is not authorized.', 403);
  }
  return marketplaceIdentity;
}

export function requireSameOrigin(request: Request) {
  const configuredOrigin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
  const requestOrigin = request.headers.get('origin');
  if (!configuredOrigin || !requestOrigin || requestOrigin !== configuredOrigin) {
    throw new MarketingIntegrationError('This request origin is not allowed.', 403);
  }
}

export async function applyMarketingRateLimit(
  actorId: string,
  action: string,
  limit: number,
  windowMs: number,
) {
  try {
    await enforceActorRateLimit({
      scope: `marketing-${action}`,
      actorId,
      limit,
      windowMs,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new MarketingIntegrationError(error.message, 429);
    }
    throw error;
  }
}

export function marketingErrorResponse(error: unknown) {
  if (error instanceof MarketingIntegrationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  return NextResponse.json({ error: 'Unable to complete the marketing integration request.' }, { status: 500 });
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > 8_192) throw new MarketingIntegrationError('Request body is too large.', 413);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new MarketingIntegrationError('Request content type must be application/json.', 415);
  }
  if (!request.body) throw new MarketingIntegrationError('Request body is required.', 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > 8_192) {
      await reader.cancel();
      throw new MarketingIntegrationError('Request body is too large.', 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new SyntaxError('Request body must be valid JSON.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MarketingIntegrationError('Request body must be a JSON object.', 400);
  }
  return body as Record<string, unknown>;
}
