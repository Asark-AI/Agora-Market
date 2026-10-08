import 'server-only';

import {
  createHash,
  randomBytes,
  randomUUID,
} from 'node:crypto';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireSellerOwner } from '@/lib/server/authorization';
import { isSuperAdminIdentity } from '@/lib/server/admin-auth';
import { decryptMarketingSecret, encryptMarketingSecret } from '@/lib/marketing-crypto';
import { trustedAppOrigin } from '@/lib/server/trusted-app-origin';

export const MARKETING_PROVIDERS = [
  'meta_ads',
  'google_ads',
  'tiktok_ads',
  'google_analytics',
] as const;

export type MarketingProvider = (typeof MARKETING_PROVIDERS)[number];
export type MarketingStatus = 'disconnected' | 'connected' | 'expired' | 'error' | 'syncing';

type ProviderDefinition = {
  name: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  resourcePattern: RegExp;
  resourceLabel: string;
};

const providers: Record<MarketingProvider, ProviderDefinition> = {
  meta_ads: {
    name: 'Meta Ads',
    clientIdEnv: 'META_ADS_CLIENT_ID',
    clientSecretEnv: 'META_ADS_CLIENT_SECRET',
    authorizeUrl: 'https://www.facebook.com/v22.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v22.0/oauth/access_token',
    scopes: ['ads_read'],
    resourcePattern: /^act_[0-9]{1,30}$/,
    resourceLabel: 'Ad account ID (act_…)',
  },
  google_ads: {
    name: 'Google Ads',
    clientIdEnv: 'GOOGLE_ADS_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_ADS_CLIENT_SECRET',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/adwords'],
    resourcePattern: /^[0-9]{10}$/,
    resourceLabel: 'Customer ID (10 digits, no dashes)',
  },
  tiktok_ads: {
    name: 'TikTok Ads',
    clientIdEnv: 'TIKTOK_ADS_CLIENT_ID',
    clientSecretEnv: 'TIKTOK_ADS_CLIENT_SECRET',
    authorizeUrl: 'https://business-api.tiktok.com/portal/auth',
    tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
    scopes: ['advertiser.read', 'campaign.read'],
    resourcePattern: /^[0-9]{1,30}$/,
    resourceLabel: 'Advertiser ID',
  },
  google_analytics: {
    name: 'Google Analytics',
    clientIdEnv: 'GOOGLE_ANALYTICS_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_ANALYTICS_CLIENT_SECRET',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    resourcePattern: /^[0-9]{1,30}$/,
    resourceLabel: 'GA4 property ID',
  },
};

type StoredCredentials = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  resourceId?: string;
};

type MarketingDocument = {
  status?: MarketingStatus;
  encryptedCredentials?: string;
  lastSyncedAt?: Timestamp | Date | string;
  lastError?: string | null;
  metrics?: LiveMetrics | null;
  syncLease?: { id: string; expiresAt: Timestamp };
};

export type LiveMetrics = {
  source: MarketingProvider;
  fetchedAt: string;
  window: 'last_30_days';
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  revenue: number | null;
  sessions: number | null;
};

export type PublicIntegration = {
  provider: MarketingProvider;
  name: string;
  configured: boolean;
  status: MarketingStatus;
  resourceId: string | null;
  resourceLabel: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  metrics: LiveMetrics | null;
};

export class MarketingIntegrationError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
    this.name = 'MarketingIntegrationError';
  }
}

class MarketingAuthorizationExpiredError extends MarketingIntegrationError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'MarketingAuthorizationExpiredError';
  }
}

function metaApiVersion(): string | null {
  const version = process.env.META_GRAPH_API_VERSION || 'v25.0';
  return /^v[0-9]{1,2}\.[0-9]$/.test(version) ? version : null;
}

function getProvider(provider: string): MarketingProvider {
  if ((MARKETING_PROVIDERS as readonly string[]).includes(provider)) {
    return provider as MarketingProvider;
  }
  throw new MarketingIntegrationError('Unsupported marketing provider.');
}

function appOrigin(): string {
  const origin = trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production');
  if (!origin) throw new MarketingIntegrationError('The application URL is not configured securely.', 503);
  return origin;
}

function encryptionKey(): Buffer {
  const value = process.env.MARKETING_TOKEN_ENCRYPTION_KEY;
  if (!value) throw new MarketingIntegrationError('Marketing integrations are not configured on the server.', 503);
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32 || key.toString('base64') !== value) {
    throw new MarketingIntegrationError('The marketing token encryption key is invalid.', 503);
  }
  return key;
}

function hasValidEncryptionKey(): boolean {
  const value = process.env.MARKETING_TOKEN_ENCRYPTION_KEY;
  if (!value) return false;
  const key = Buffer.from(value, 'base64');
  return key.length === 32 && key.toString('base64') === value;
}

export function isProviderConfigured(provider: MarketingProvider): boolean {
  const definition = providers[provider];
  return Boolean(
    process.env[definition.clientIdEnv] &&
    process.env[definition.clientSecretEnv] &&
    hasValidEncryptionKey() &&
    (provider !== 'google_ads' || process.env.GOOGLE_ADS_DEVELOPER_TOKEN) &&
    (provider !== 'meta_ads' || Boolean(metaApiVersion())) &&
    trustedAppOrigin(process.env.AGORA_APP_URL, process.env.NODE_ENV === 'production'),
  );
}

function encryptCredentials(credentials: StoredCredentials): string {
  return encryptMarketingSecret(JSON.stringify(credentials), encryptionKey());
}

function decryptCredentials(value: string): StoredCredentials {
  try {
    const plaintext = decryptMarketingSecret(value, encryptionKey());
    const parsed: unknown = JSON.parse(plaintext);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as StoredCredentials).accessToken !== 'string'
    ) {
      throw new Error('Invalid credential payload.');
    }
    return parsed as StoredCredentials;
  } catch {
    throw new MarketingIntegrationError('Stored marketing credentials could not be decrypted.', 500);
  }
}

function sellerCollection(sellerId: string) {
  if (!sellerId || /[\\/\s]/.test(sellerId)) {
    throw new MarketingIntegrationError('Invalid seller ID.');
  }
  return getAdminDb().collection('sellers').doc(sellerId).collection('marketingIntegrations');
}

function stateCollection() {
  return getAdminDb().collection('marketingOAuthStates');
}

function parseTimestamp(value: MarketingDocument['lastSyncedAt']): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function publicStatus(
  provider: MarketingProvider,
  document: MarketingDocument | undefined,
): PublicIntegration {
  const credentials = document?.encryptedCredentials
    ? decryptCredentials(document.encryptedCredentials)
    : null;
  const leaseActive = Boolean(
    document?.syncLease?.expiresAt && document.syncLease.expiresAt.toMillis() > Date.now(),
  );
  let status = document?.status || 'disconnected';
  if (leaseActive) status = 'syncing';
  if (credentials?.expiresAt && credentials.expiresAt <= Date.now() && status === 'connected') {
    status = 'expired';
  }
  return {
    provider,
    name: providers[provider].name,
    configured: isProviderConfigured(provider),
    status,
    resourceId: credentials?.resourceId || null,
    resourceLabel: providers[provider].resourceLabel,
    lastSyncedAt: parseTimestamp(document?.lastSyncedAt),
    lastError: document?.lastError || null,
    metrics: document?.metrics || null,
  };
}

export async function getMarketingIntegrations(sellerId: string): Promise<PublicIntegration[]> {
  const collection = sellerCollection(sellerId);
  const snapshots = await Promise.all(
    MARKETING_PROVIDERS.map((provider) => collection.doc(provider).get()),
  );
  return MARKETING_PROVIDERS.map((provider, index) => {
    const data = snapshots[index].data() as MarketingDocument | undefined;
    return publicStatus(provider, data);
  });
}

export async function createOAuthAuthorization(
  sellerId: string,
  providerValue: string,
  identity: DecodedIdToken,
  returnTo: string,
): Promise<string> {
  const provider = getProvider(providerValue);
  const definition = providers[provider];
  if (!isProviderConfigured(provider)) {
    throw new MarketingIntegrationError(`${definition.name} connection is not configured yet.`, 503);
  }
  if (identity.email_verified !== true) {
    throw new MarketingIntegrationError('Verify your email before connecting an account.', 403);
  }
  if (!['/dashboard/marketing', '/super/app/dashboard/marketing'].includes(returnTo)) {
    throw new MarketingIntegrationError('Invalid return location.');
  }

  const state = randomBytes(32).toString('base64url');
  const codeVerifier = randomBytes(32).toString('base64url');
  const redirectUri = `${appOrigin()}/api/marketing/oauth/callback/${provider}`;
  await stateCollection().doc(state).create({
    uid: identity.uid,
    sellerId,
    provider,
    returnTo,
    redirectUri,
    ...(provider === 'google_ads' || provider === 'google_analytics'
      ? { encryptedCodeVerifier: encryptMarketingSecret(codeVerifier, encryptionKey()) }
      : {}),
    expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
    createdAt: FieldValue.serverTimestamp(),
  });

  const authorizationUrl = new URL(definition.authorizeUrl);
  authorizationUrl.searchParams.set('client_id', process.env[definition.clientIdEnv]!);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', definition.scopes.join(' '));
  authorizationUrl.searchParams.set('state', state);
  if (provider === 'google_ads' || provider === 'google_analytics') {
    authorizationUrl.searchParams.set('access_type', 'offline');
    authorizationUrl.searchParams.set('prompt', 'consent');
    authorizationUrl.searchParams.set(
      'code_challenge',
      createHash('sha256').update(codeVerifier).digest('base64url'),
    );
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');
  }
  if (provider === 'meta_ads') authorizationUrl.searchParams.set('auth_type', 'rerequest');
  if (provider === 'tiktok_ads') {
    authorizationUrl.searchParams.set('app_id', process.env.TIKTOK_ADS_CLIENT_ID!);
    authorizationUrl.searchParams.delete('client_id');
    authorizationUrl.searchParams.delete('response_type');
    authorizationUrl.searchParams.delete('scope');
  }
  return authorizationUrl.toString();
}

type OAuthState = {
  uid: string;
  sellerId: string;
  provider: MarketingProvider;
  returnTo: string;
  redirectUri: string;
  encryptedCodeVerifier?: string;
  expiresAt: Timestamp;
};

async function consumeOAuthState(state: string, expectedUid: string): Promise<OAuthState | null> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(state)) return null;
  const reference = stateCollection().doc(state);
  return getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return null;
    const data = snapshot.data() as OAuthState;
    if (data.uid !== expectedUid || data.expiresAt.toMillis() <= Date.now()) return null;
    transaction.delete(reference);
    return data;
  });
}

async function exchangeAuthorizationCode(
  provider: MarketingProvider,
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<StoredCredentials> {
  const definition = providers[provider];
  const clientId = process.env[definition.clientIdEnv]!;
  const clientSecret = process.env[definition.clientSecretEnv]!;
  let response: Response;

  if (provider === 'tiktok_ads') {
    response = await fetch(definition.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        app_id: clientId,
        secret: clientSecret,
        auth_code: code,
        grant_type: 'authorized_code',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } else if (provider === 'meta_ads') {
    const url = new URL(definition.tokenUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('client_secret', clientSecret);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('code', code);
    response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } else {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    });
    if (codeVerifier && (provider === 'google_ads' || provider === 'google_analytics')) {
      body.set('code_verifier', codeVerifier);
    }
    response = await fetch(definition.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  }

  if (!response.ok) throw new MarketingIntegrationError('The provider rejected the authorization. Please retry.', 502);
  const body: unknown = await response.json();
  let data: Record<string, unknown> | undefined;
  if (provider === 'tiktok_ads') {
    const outer = body as { code?: unknown; data?: unknown };
    if (outer.code !== 0 || !outer.data || typeof outer.data !== 'object') {
      throw new MarketingIntegrationError('The provider rejected the authorization. Please retry.', 502);
    }
    data = outer.data as Record<string, unknown>;
  } else if (body && typeof body === 'object') {
    data = body as Record<string, unknown>;
  }
  const accessToken = data?.access_token;
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new MarketingIntegrationError('The provider returned an invalid authorization response.', 502);
  }
  const expiry = Number(data?.expires_in);
  const refreshToken = data?.refresh_token;
  return {
    accessToken,
    ...(typeof refreshToken === 'string' ? { refreshToken } : {}),
    ...(Number.isFinite(expiry) && expiry > 0 ? { expiresAt: Date.now() + expiry * 1000 } : {}),
  };
}

export async function completeOAuthAuthorization(input: {
  provider: string;
  state: string;
  code: string;
  identity: DecodedIdToken;
}): Promise<{ sellerId: string; returnTo: string }> {
  const provider = getProvider(input.provider);
  const state = await consumeOAuthState(input.state, input.identity.uid);
  if (!state || state.uid !== input.identity.uid || state.provider !== provider) {
    throw new MarketingIntegrationError('This authorization request expired or is invalid.', 400);
  }
  if (!isSuperAdminIdentity(input.identity)) {
    try {
      await requireSellerOwner(input.identity, state.sellerId);
    } catch {
      throw new MarketingIntegrationError('Seller access is no longer authorized.', 403);
    }
  }
  const codeVerifier = state.encryptedCodeVerifier
    ? decryptMarketingSecret(state.encryptedCodeVerifier, encryptionKey())
    : undefined;
  const credentials = await exchangeAuthorizationCode(provider, input.code, state.redirectUri, codeVerifier);
  await sellerCollection(state.sellerId).doc(provider).set({
    status: 'connected',
    encryptedCredentials: encryptCredentials(credentials),
    connectedAt: FieldValue.serverTimestamp(),
    lastError: null,
    syncLease: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { sellerId: state.sellerId, returnTo: state.returnTo };
}

export async function cancelOAuthAuthorization(stateValue: string, identity: DecodedIdToken) {
  const state = await consumeOAuthState(stateValue, identity.uid);
  if (!state) {
    throw new MarketingIntegrationError('This authorization request expired or is invalid.', 400);
  }
  return { sellerId: state.sellerId, provider: state.provider, returnTo: state.returnTo };
}

export async function updateMarketingResource(
  sellerId: string,
  providerValue: string,
  resourceIdValue: unknown,
): Promise<PublicIntegration> {
  const provider = getProvider(providerValue);
  if (typeof resourceIdValue !== 'string') {
    throw new MarketingIntegrationError('Enter a valid account or property ID.');
  }
  const resourceId = resourceIdValue.trim();
  if (!providers[provider].resourcePattern.test(resourceId)) {
    throw new MarketingIntegrationError(`Enter a valid ${providers[provider].resourceLabel}.`);
  }
  const reference = sellerCollection(sellerId).doc(provider);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const document = snapshot.data() as MarketingDocument | undefined;
    if (!document?.encryptedCredentials) {
      throw new MarketingIntegrationError('Connect this provider before adding an account ID.', 409);
    }
    if (document.syncLease?.expiresAt && document.syncLease.expiresAt.toMillis() > Date.now()) {
      throw new MarketingIntegrationError('Wait for the current sync to finish before changing the account ID.', 409);
    }
    const credentials = decryptCredentials(document.encryptedCredentials);
    credentials.resourceId = resourceId;
    transaction.update(reference, {
      encryptedCredentials: encryptCredentials(credentials),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return publicStatus(provider, (await reference.get()).data() as MarketingDocument);
}

export async function disconnectMarketingProvider(sellerId: string, providerValue: string) {
  const provider = getProvider(providerValue);
  const reference = sellerCollection(sellerId).doc(provider);
  const snapshot = await reference.get();
  const encryptedCredentials = snapshot.data()?.encryptedCredentials;
  let providerRevoked = false;
  if (typeof encryptedCredentials === 'string') {
    const credentials = decryptCredentials(encryptedCredentials);
    const definition = providers[provider];
    try {
      if (provider === 'google_ads' || provider === 'google_analytics') {
        const response = await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: credentials.accessToken }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });
        providerRevoked = response.ok;
      } else if (provider === 'meta_ads') {
        const version = metaApiVersion();
        if (!version) throw new Error('Meta Graph API version is invalid.');
        const response = await fetch(`https://graph.facebook.com/${version}/me/permissions`, {
          method: 'DELETE',
          headers: { authorization: `Bearer ${credentials.accessToken}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });
        providerRevoked = response.ok;
      } else if (isProviderConfigured(provider)) {
        const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/revoke_token/', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            app_id: process.env[definition.clientIdEnv],
            secret: process.env[definition.clientSecretEnv],
            access_token: credentials.accessToken,
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });
        providerRevoked = response.ok;
      }
    } catch {
      providerRevoked = false;
    }
  }
  await reference.delete();
  return { providerRevoked };
}

async function refreshAccessToken(
  provider: MarketingProvider,
  credentials: StoredCredentials,
): Promise<StoredCredentials> {
  if (!credentials.refreshToken) {
    throw new MarketingAuthorizationExpiredError('The provider authorization expired. Reconnect this account.');
  }
  const definition = providers[provider];
  const clientId = process.env[definition.clientIdEnv]!;
  const clientSecret = process.env[definition.clientSecretEnv]!;
  let response: Response;
  if (provider === 'tiktok_ads') {
    response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        app_id: clientId,
        secret: clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: 'refresh_token',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } else if (provider === 'google_ads' || provider === 'google_analytics') {
    response = await fetch(definition.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: 'refresh_token',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } else {
    throw new MarketingAuthorizationExpiredError('The provider authorization expired. Reconnect this account.');
  }
  if (!response.ok) throw new MarketingAuthorizationExpiredError('The provider authorization expired. Reconnect this account.');
  const body: unknown = await response.json();
  const data = provider === 'tiktok_ads'
    ? (body as { code?: unknown; data?: Record<string, unknown> })
    : { data: body as Record<string, unknown> };
  if (provider === 'tiktok_ads' && data.code !== 0) {
    throw new MarketingAuthorizationExpiredError('The provider authorization expired. Reconnect this account.');
  }
  const tokenBody = data.data;
  const accessToken = tokenBody?.access_token;
  if (typeof accessToken !== 'string') {
    throw new MarketingIntegrationError('The provider returned an invalid refresh response.', 502);
  }
  const expiry = Number(tokenBody?.expires_in);
  const refreshedToken = tokenBody?.refresh_token;
  return {
    ...credentials,
    accessToken,
    ...(typeof refreshedToken === 'string' ? { refreshToken: refreshedToken } : {}),
    ...(Number.isFinite(expiry) && expiry > 0 ? { expiresAt: Date.now() + expiry * 1000 } : {}),
  };
}

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sumRows(rows: unknown[], field: string): number | null {
  const values = rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
    .map((row) => numeric(row[field]))
    .filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function normalizeActions(actions: unknown, actionType: string): number | null {
  if (!Array.isArray(actions)) return null;
  const selected = actions.find(
    (action): action is Record<string, unknown> =>
      Boolean(action && typeof action === 'object' && (action as Record<string, unknown>).action_type === actionType),
  );
  return numeric(selected?.value);
}

async function fetchLiveMetrics(
  provider: MarketingProvider,
  credentials: StoredCredentials,
): Promise<LiveMetrics> {
  if (!credentials.resourceId || !providers[provider].resourcePattern.test(credentials.resourceId)) {
    throw new MarketingIntegrationError(`Add a valid ${providers[provider].resourceLabel} before syncing.`, 409);
  }
  const accessToken = credentials.accessToken;
  let response: Response;
  let metrics: Omit<LiveMetrics, 'source' | 'fetchedAt' | 'window'> = {
    spend: null, impressions: null, clicks: null, conversions: null, revenue: null, sessions: null,
  };

  if (provider === 'meta_ads') {
    const graphVersion = metaApiVersion();
    if (!graphVersion) throw new MarketingIntegrationError('Meta API version is invalid.', 503);
    const url = new URL(`https://graph.facebook.com/${graphVersion}/${credentials.resourceId}/insights`);
    url.searchParams.set('fields', 'spend,impressions,clicks,actions,action_values');
    url.searchParams.set('date_preset', 'last_30d');
    url.searchParams.set('level', 'account');
    response = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return providerFailure(response.status);
    const data = await response.json() as { data?: Array<Record<string, unknown>> };
    const row = data.data?.[0];
    if (!row) throw new MarketingIntegrationError('Meta returned no performance data for this period.', 502);
    metrics = {
      spend: numeric(row.spend),
      impressions: numeric(row.impressions),
      clicks: numeric(row.clicks),
      conversions: normalizeActions(row.actions, 'purchase'),
      revenue: normalizeActions(row.action_values, 'purchase'),
      sessions: null,
    };
  } else if (provider === 'google_ads') {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) throw new MarketingIntegrationError('Google Ads reporting is not configured on the server.', 503);
    const version = process.env.GOOGLE_ADS_API_VERSION || 'v25';
    if (!/^v[0-9]{1,3}$/.test(version)) {
      throw new MarketingIntegrationError('Google Ads API version is invalid.', 503);
    }
    response = await fetch(
      `https://googleads.googleapis.com/${version}/customers/${credentials.resourceId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'developer-token': developerToken,
          ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
            ? { 'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID }
            : {}),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: 'SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM customer WHERE segments.date DURING LAST_30_DAYS',
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!response.ok) return providerFailure(response.status);
    const batches = await response.json() as Array<{ results?: Array<{ metrics?: Record<string, unknown> }> }>;
    const rows = batches.flatMap((batch) => batch.results || []).map((row) => row.metrics || {});
    metrics = {
      spend: sumRows(rows, 'costMicros') === null ? null : (sumRows(rows, 'costMicros') as number) / 1_000_000,
      impressions: sumRows(rows, 'impressions'),
      clicks: sumRows(rows, 'clicks'),
      conversions: sumRows(rows, 'conversions'),
      revenue: sumRows(rows, 'conversionsValue'),
      sessions: null,
    };
  } else if (provider === 'google_analytics') {
    response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${credentials.resourceId}:runReport`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'totalRevenue' }],
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!response.ok) return providerFailure(response.status);
    const data = await response.json() as { rows?: Array<{ metricValues?: Array<{ value?: string }> }> };
    const values = data.rows?.[0]?.metricValues || [];
    metrics = {
      spend: null,
      impressions: null,
      clicks: null,
      conversions: numeric(values[1]?.value),
      revenue: numeric(values[2]?.value),
      sessions: numeric(values[0]?.value),
    };
  } else {
    response = await fetch('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/', {
      method: 'POST',
      headers: { 'Access-Token': accessToken, 'content-type': 'application/json' },
      body: JSON.stringify({
        advertiser_id: credentials.resourceId,
        report_type: 'BASIC',
        data_level: 'AUCTION_ADVERTISER',
        dimensions: ['advertiser_id'],
        metrics: ['spend', 'impressions', 'clicks', 'conversion', 'total_purchase_value'],
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        end_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return providerFailure(response.status);
    const body = await response.json() as {
      code?: unknown;
      data?: { list?: Array<{ metrics?: Record<string, unknown> }> };
    };
    if (body.code !== 0) throw new MarketingIntegrationError('TikTok Ads could not return performance data.', 502);
    const row = body.data?.list?.[0]?.metrics;
    if (!row) throw new MarketingIntegrationError('TikTok Ads returned no performance data for this period.', 502);
    metrics = {
      spend: numeric(row.spend),
      impressions: numeric(row.impressions),
      clicks: numeric(row.clicks),
      conversions: numeric(row.conversion),
      revenue: numeric(row.total_purchase_value),
      sessions: null,
    };
  }

  return {
    source: provider,
    fetchedAt: new Date().toISOString(),
    window: 'last_30_days',
    ...metrics,
  };
}

function providerFailure(status: number): never {
  if (status === 401 || status === 403) {
    throw new MarketingAuthorizationExpiredError('The provider authorization expired or lacks permission. Reconnect the account.');
  }
  throw new MarketingIntegrationError('The provider could not return live performance data. Try again later.', 502);
}

export async function syncMarketingProvider(
  sellerId: string,
  providerValue: string,
): Promise<PublicIntegration> {
  const provider = getProvider(providerValue);
  const reference = sellerCollection(sellerId).doc(provider);
  const leaseId = randomUUID();
  const leaseRef = reference;
  const acquired = await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(leaseRef);
    if (!snapshot.exists || !snapshot.data()?.encryptedCredentials) {
      throw new MarketingIntegrationError('Connect this provider before syncing.', 409);
    }
    const oldLease = snapshot.data()?.syncLease as MarketingDocument['syncLease'];
    if (oldLease?.expiresAt && oldLease.expiresAt.toMillis() > Date.now()) {
      throw new MarketingIntegrationError('A sync is already running for this account.', 409);
    }
    const credentials = decryptCredentials(snapshot.data()!.encryptedCredentials);
    transaction.update(leaseRef, {
      status: 'syncing',
      syncLease: { id: leaseId, expiresAt: Timestamp.fromMillis(Date.now() + 90_000) },
      lastError: null,
    });
    return credentials;
  });

  try {
    const validCredentials = acquired.expiresAt && acquired.expiresAt <= Date.now()
      ? await refreshAccessToken(provider, acquired)
      : acquired;
    const metrics = await fetchLiveMetrics(provider, validCredentials);
    await getAdminDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (snapshot.data()?.syncLease?.id !== leaseId) {
        throw new MarketingIntegrationError('The sync lease expired. Retry the sync.', 409);
      }
      transaction.update(reference, {
        status: 'connected',
        encryptedCredentials: encryptCredentials(validCredentials),
        metrics,
        lastSyncedAt: FieldValue.serverTimestamp(),
        lastError: null,
        syncLease: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    const message = error instanceof MarketingIntegrationError
      ? error.message
      : 'The provider sync failed. Try again later.';
    const expired = error instanceof MarketingAuthorizationExpiredError;
    await getAdminDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists || snapshot.data()?.syncLease?.id !== leaseId) return;
      transaction.update(reference, {
        status: expired ? 'expired' : 'error',
        lastError: message,
        syncLease: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    throw error instanceof MarketingIntegrationError
      ? error
      : new MarketingIntegrationError(message, 502);
  }

  return publicStatus(provider, (await reference.get()).data() as MarketingDocument);
}

export function marketingCallbackRedirect(returnTo: string, provider: string, outcome: string): string {
  const safeReturn = ['/dashboard/marketing', '/super/app/dashboard/marketing'].includes(returnTo)
    ? returnTo
    : '/dashboard/marketing';
  const target = new URL(safeReturn, appOrigin());
  target.searchParams.set('provider', provider);
  target.searchParams.set('connection', outcome);
  return target.toString();
}
