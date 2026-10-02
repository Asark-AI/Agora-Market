'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorEmitter } from '@/firebase/error-emitter';

const checkInternetReachability = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    await fetch(new URL('/favicon.ico', window.location.origin).toString(), {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
};

export function NetworkStatus() {
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    let recoveryTimer: number | undefined;

    const syncStatus = async () => {
      const isReachable = await checkInternetReachability();
      setOffline(!isReachable);
      if (isReachable) {
        setRecovered(true);
        window.clearTimeout(recoveryTimer);
        recoveryTimer = window.setTimeout(() => setRecovered(false), 2600);
      } else {
        setRecovered(false);
      }
    };

    const markOffline = async () => {
      setRecovered(false);
      setOffline(true);
      const isReachable = await checkInternetReachability();
      if (isReachable) {
        setOffline(false);
        setRecovered(true);
        window.clearTimeout(recoveryTimer);
        recoveryTimer = window.setTimeout(() => setRecovered(false), 2600);
      }
    };

    const markOnline = () => {
      setOffline(false);
      setRecovered(true);
      window.clearTimeout(recoveryTimer);
      recoveryTimer = window.setTimeout(() => setRecovered(false), 2600);
    };

    const handleNetworkError = async () => {
      await markOffline();
    };

    void syncStatus();
    window.addEventListener('offline', markOffline);
    window.addEventListener('online', markOnline);
    errorEmitter.on('network-error', handleNetworkError);

    return () => {
      window.clearTimeout(recoveryTimer);
      window.removeEventListener('offline', markOffline);
      window.removeEventListener('online', markOnline);
      errorEmitter.off('network-error', handleNetworkError);
    };
  }, []);

  const retryConnection = async () => {
    setChecking(true);
    try {
      const isReachable = await checkInternetReachability();
      if (isReachable) {
        window.dispatchEvent(new Event('online'));
      } else {
        setOffline(true);
      }
    } catch {
      setOffline(true);
    } finally {
      setChecking(false);
    }
  };

  if (recovered) {
    return <div className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg"><CheckCircle2 className="size-5 shrink-0" /><span>Connection restored. Agora is back in sync.</span></div>;
  }

  if (!offline) return null;

  return (
    <div className="fixed inset-x-3 bottom-4 z-[100] mx-auto max-w-md rounded-2xl border border-amber-200 bg-background p-4 shadow-2xl sm:bottom-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"><WifiOff className="size-5" /></div>
        <div className="min-w-0 flex-1"><p className="font-semibold">You&apos;re offline</p><p className="mt-1 text-sm text-muted-foreground">Your Agora data is safe. Reconnect to continue shopping, checking orders, or managing your store.</p></div>
        <AlertCircle className="size-4 shrink-0 text-amber-600" />
      </div>
      <Button type="button" variant="outline" className="mt-4 w-full" onClick={retryConnection} disabled={checking}><RefreshCw className={`mr-2 size-4 ${checking ? 'animate-spin' : ''}`} />{checking ? 'Checking connection...' : 'Try again'}</Button>
    </div>
  );
}
