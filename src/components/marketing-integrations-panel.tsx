'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  BarChart3,
  Check,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import type {
  MarketingProvider,
  PublicIntegration,
} from '@/lib/server/marketing-integrations';

type SellerOption = { id: string; name: string; status: string };

const providerDisplay: Record<MarketingProvider, { mark: string; color: string; summary: string }> = {
  meta_ads: {
    mark: 'f',
    color: 'bg-blue-600 text-white',
    summary: 'Campaign delivery and conversion reporting from your Meta ad account.',
  },
  google_ads: {
    mark: 'G',
    color: 'bg-white text-blue-600 ring-1 ring-border',
    summary: 'Spend, clicks, impressions, and conversion value from Google Ads.',
  },
  tiktok_ads: {
    mark: '♪',
    color: 'bg-slate-950 text-white',
    summary: 'Advertiser delivery and conversion reporting from TikTok Ads.',
  },
  google_analytics: {
    mark: 'A',
    color: 'bg-orange-500 text-white',
    summary: 'Website sessions, conversions, and revenue from a GA4 property.',
  },
};

const statusLabels: Record<PublicIntegration['status'], string> = {
  disconnected: 'Not connected',
  connected: 'Connected',
  expired: 'Authorization expired',
  error: 'Sync needs attention',
  syncing: 'Syncing live data',
};

function formatDate(value: string | null) {
  if (!value) return 'Not synced yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not synced yet' : date.toLocaleString();
}

function formatMetric(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat().format(value);
}

function displayMetric(currencyValue: number | null) {
  if (currencyValue === null) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(currencyValue);
}

export function MarketingIntegrationsPanel({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { seller } = useAuth();
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [integrations, setIntegrations] = useState<PublicIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [working, setWorking] = useState<Record<string, string>>({});
  const [resourceInputs, setResourceInputs] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const loadSequence = useRef(0);
  const sellerId = isSuperAdmin ? selectedSellerId : seller?.id || '';
  const returnTo = isSuperAdmin ? '/super/app/dashboard/marketing' : '/dashboard/marketing';

  const loadIntegrations = useCallback(async () => {
    const sequence = ++loadSequence.current;
    if (!sellerId) {
      setIntegrations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setPageError('');
    setIntegrations([]);
    try {
      const response = await fetch(`/api/marketing/${encodeURIComponent(sellerId)}/integrations`, {
        cache: 'no-store',
      });
      const body = await response.json() as { integrations?: PublicIntegration[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to load marketing connections.');
      if (sequence !== loadSequence.current) return;
      const nextIntegrations = body.integrations || [];
      setIntegrations(nextIntegrations);
      setResourceInputs((current) => ({
        ...current,
        ...Object.fromEntries(nextIntegrations.map((item) => [item.provider, item.resourceId || ''])),
      }));
    } catch (error) {
      if (sequence === loadSequence.current) {
        setPageError(error instanceof Error ? error.message : 'Unable to load marketing connections.');
      }
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    fetch('/api/marketing/sellers', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json() as { sellers?: SellerOption[]; error?: string };
        if (!response.ok) throw new Error(body.error || 'Unable to load seller accounts.');
        if (!cancelled) {
          setSellers(body.sellers || []);
          setSelectedSellerId((selected) => selected || body.sellers?.[0]?.id || '');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setPageError(error instanceof Error ? error.message : 'Unable to load seller accounts.');
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const outcome = query.get('connection');
    const provider = query.get('provider');
    if (outcome) {
      if (provider && outcome === 'connected') {
        setMessages((current) => ({ ...current, [provider]: 'Account connected. Sync to fetch current performance data.' }));
      } else if (provider && outcome === 'cancelled') {
        setMessages((current) => ({ ...current, [provider]: 'Connection was cancelled. No account was connected.' }));
      } else if (provider) {
        setMessages((current) => ({ ...current, [provider]: 'Connection could not be completed. Check the provider configuration and try again.' }));
      }
      query.delete('connection');
      query.delete('provider');
      const queryString = query.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${queryString ? `?${queryString}` : ''}`);
      void loadIntegrations();
    }
  }, [loadIntegrations]);

  const runAction = async (
    provider: MarketingProvider,
    action: string,
    endpoint: string,
    init: RequestInit,
  ) => {
    setWorking((current) => ({ ...current, [provider]: action }));
    setMessages((current) => ({ ...current, [provider]: '' }));
    try {
      const response = await fetch(endpoint, { ...init, cache: 'no-store' });
      const body = await response.json() as {
        error?: string;
        authorizationUrl?: string;
        integration?: PublicIntegration;
        message?: string;
        providerRevoked?: boolean;
      };
      if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
      if (action === 'connect' && body.authorizationUrl) {
        window.location.assign(body.authorizationUrl);
        return;
      }
      if (action === 'disconnect') {
        setMessages((current) => ({ ...current, [provider]: body.message || 'Account disconnected.' }));
      } else if (action === 'save') {
        setMessages((current) => ({ ...current, [provider]: 'Account ID saved.' }));
      }
      if (body.integration) {
        setIntegrations((current) => current.map((item) => item.provider === provider ? body.integration! : item));
      } else {
        await loadIntegrations();
      }
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [provider]: error instanceof Error ? error.message : 'The request could not be completed.',
      }));
      if (action === 'sync') await loadIntegrations();
    } finally {
      setWorking((current) => {
        const next = { ...current };
        delete next[provider];
        return next;
      });
    }
  };

  const connect = (integration: PublicIntegration) => {
    if (!sellerId) return;
    void runAction(
      integration.provider,
      'connect',
      `/api/marketing/${encodeURIComponent(sellerId)}/integrations/${integration.provider}/connect`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnTo }),
      },
    );
  };

  const updateResource = (integration: PublicIntegration) => {
    if (!sellerId) return;
    void runAction(
      integration.provider,
      'save',
      `/api/marketing/${encodeURIComponent(sellerId)}/integrations/${integration.provider}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resourceId: resourceInputs[integration.provider] || '' }),
      },
    );
  };

  const synchronize = (integration: PublicIntegration) => {
    if (!sellerId) return;
    void runAction(
      integration.provider,
      'sync',
      `/api/marketing/${encodeURIComponent(sellerId)}/integrations/${integration.provider}/sync`,
      { method: 'POST' },
    );
  };

  const disconnect = (integration: PublicIntegration) => {
    if (!sellerId) return;
    void runAction(
      integration.provider,
      'disconnect',
      `/api/marketing/${encodeURIComponent(sellerId)}/integrations/${integration.provider}`,
      { method: 'DELETE' },
    );
  };

  const connectedCount = useMemo(
    () => integrations.filter((item) => item.status === 'connected').length,
    [integrations],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="flex flex-col gap-5 border-b pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            Live integrations only
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Marketing integrations</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Connect advertising and analytics accounts to securely sync verified performance data.
            No campaign or spend figures are shown until a provider returns live data.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadIntegrations()} disabled={loading || !sellerId}>
          {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh status
        </Button>
      </header>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Seller account</CardTitle>
            <CardDescription>Integrations and performance data are isolated to the selected seller.</CardDescription>
          </CardHeader>
          <CardContent>
            <label htmlFor="marketing-seller" className="mb-2 block text-sm font-medium">Choose a seller</label>
            <select
              id="marketing-seller"
              value={selectedSellerId}
              onChange={(event) => {
                setIntegrations([]);
                setLoading(true);
                setSelectedSellerId(event.target.value);
              }}
              className="h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 text-sm"
              disabled={!sellers.length}
            >
              {sellers.map((option) => (
                <option key={option.id} value={option.id}>{option.name} · {option.status}</option>
              ))}
            </select>
            {!sellers.length && !pageError && (
              <p className="mt-2 text-sm text-muted-foreground">No active seller accounts are available.</p>
            )}
          </CardContent>
        </Card>
      )}

      {pageError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>{pageError}</span>
        </div>
      )}

      {!loading && sellerId && integrations.length === 0 && !pageError && (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">Connect your first marketing platform</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Your dashboard is ready to report campaign and website performance as soon as you authorize a live account.
          </p>
        </div>
      )}

      {!sellerId && !isSuperAdmin && !loading && !pageError && (
        <div className="rounded-xl border p-5 text-sm text-muted-foreground">
          An active seller account is required to manage marketing connections.
        </div>
      )}

      <section aria-label="Available marketing platforms" className="grid gap-5 lg:grid-cols-2">
        {loading ? (
          [0, 1, 2, 3].map((index) => (
            <Card key={index} aria-label="Loading integration">
              <CardContent className="flex h-52 items-center justify-center">
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))
        ) : (
          integrations.map((integration) => {
            const branding = providerDisplay[integration.provider];
            const isWorking = Boolean(working[integration.provider]);
            const connected = integration.status !== 'disconnected';
            const active = integration.status === 'connected';
            const isAnalytics = integration.provider === 'google_analytics';
            const metrics = integration.metrics;
            return (
              <Card key={integration.provider} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${branding.color}`} aria-hidden="true">
                        {branding.mark}
                      </div>
                      <div className="min-w-0">
                        <CardTitle>{integration.name}</CardTitle>
                        <CardDescription className="mt-1 leading-5">{branding.summary}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={active ? 'default' : integration.status === 'error' || integration.status === 'expired' ? 'destructive' : 'outline'} className="shrink-0">
                      {integration.status === 'syncing' && <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />}
                      {statusLabels[integration.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {connected && (
                    <div className="space-y-3 rounded-xl bg-muted/50 p-4">
                      <label htmlFor={`resource-${integration.provider}`} className="block text-sm font-medium">
                        {isAnalytics ? 'GA4 property ID' : 'Advertising account ID'}
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id={`resource-${integration.provider}`}
                          value={resourceInputs[integration.provider] ?? integration.resourceId ?? ''}
                          onChange={(event) => setResourceInputs((current) => ({
                            ...current,
                            [integration.provider]: event.target.value,
                          }))}
                          placeholder={integration.resourceLabel}
                          autoComplete="off"
                          maxLength={40}
                          disabled={isWorking}
                        />
                        <Button
                          variant="outline"
                          onClick={() => updateResource(integration)}
                          disabled={isWorking || !(resourceInputs[integration.provider] || '').trim()}
                        >
                          {working[integration.provider] === 'save' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Save ID'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The ID is stored with this seller’s connection and is never used as an arbitrary URL.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      Last sync: {formatDate(integration.lastSyncedAt)}
                    </span>
                    {integration.status === 'connected' && <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Provider authorized</span>}
                  </div>

                  {integration.lastError && (
                    <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                      {integration.lastError}
                    </div>
                  )}
                  {messages[integration.provider] && (
                    <p role="status" className="text-sm text-muted-foreground">{messages[integration.provider]}</p>
                  )}

                  {metrics && (
                    <div className="space-y-2 border-t pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verified provider data · last 30 days</div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {!isAnalytics && <Metric label="Spend" value={displayMetric(metrics.spend)} />}
                        {!isAnalytics && <Metric label="Impressions" value={formatMetric(metrics.impressions)} />}
                        {!isAnalytics && <Metric label="Clicks" value={formatMetric(metrics.clicks)} />}
                        <Metric label="Conversions" value={formatMetric(metrics.conversions)} />
                        <Metric label="Revenue" value={displayMetric(metrics.revenue)} />
                        {metrics.spend !== null && metrics.spend > 0 && metrics.revenue !== null && (
                          <Metric label="ROAS" value={`${(metrics.revenue / metrics.spend).toFixed(2)}×`} />
                        )}
                        {isAnalytics && <Metric label="Sessions" value={formatMetric(metrics.sessions)} />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Data received {formatDate(metrics.fetchedAt)}. Values are reported in the provider’s account currency where applicable.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    {connected && (
                      <Button onClick={() => synchronize(integration)} disabled={isWorking || !integration.resourceId || !integration.configured}>
                        {working[integration.provider] === 'sync' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Sync live data
                      </Button>
                    )}
                    <Button
                      variant={connected ? 'outline' : 'default'}
                      onClick={() => connect(integration)}
                      disabled={isWorking || !integration.configured || !sellerId}
                    >
                      {working[integration.provider] === 'connect' && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      {connected ? 'Reconnect / reauthorize' : `Connect ${integration.name}`}
                    </Button>
                    {connected && (
                      <Button variant="ghost" onClick={() => disconnect(integration)} disabled={isWorking}>
                        {working[integration.provider] === 'disconnect' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                        Disconnect
                      </Button>
                    )}
                    {!integration.configured && (
                      <p className="basis-full text-xs text-muted-foreground">
                        Connection is not configured by the server yet. Ask an administrator to add this provider’s OAuth settings and the token-encryption key.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {!loading && connectedCount === 0 && sellerId && integrations.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No platform is connected yet. Connect one above to begin syncing live data.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold tabular-nums">{value}</div>
    </div>
  );
}
