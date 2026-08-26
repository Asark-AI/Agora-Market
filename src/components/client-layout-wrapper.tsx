
'use client';

import { useAuthStore } from '@/hooks/use-auth';
import { usePageLoaderStore } from '@/hooks/use-page-loader';
import { useEffect, Suspense } from 'react';
import { PageLoader } from '@/components/page-loader';
import { NavigationEvents } from '@/components/navigation-events';
import { NetworkStatus } from '@/components/network-status';
import { OfflineSync } from '@/components/offline-sync';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const init = useAuthStore(state => state.init);
    const initialized = useAuthStore(state => state.initialized);
    const { isLoading } = usePageLoaderStore();
    const authState = useAuthStore(state => state.user);

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
                console.warn('Offline cache could not be enabled:', error);
            });
        }
    }, []);

    if (!initialized && !authState) {
        return <>{children}</>;
    }

    return (
        <>
            {isLoading && <PageLoader overlay />}
            <NetworkStatus />
            <OfflineSync />
            <Suspense fallback={null}>
                <NavigationEvents />
            </Suspense>
            {children}
        </>
    );
}
