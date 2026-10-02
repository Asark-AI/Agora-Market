
'use client';

import { useAuthStore } from '@/hooks/use-auth';
import { usePageLoaderStore } from '@/hooks/use-page-loader';
import { useEffect, Suspense } from 'react';
import { PageLoader } from '@/components/page-loader';
import { NavigationEvents } from '@/components/navigation-events';
import { NetworkStatus } from '@/components/network-status';
import { OfflineSync } from '@/components/offline-sync';
import { Toaster } from '@/components/ui/toaster';
import { usePathname, useRouter } from 'next/navigation';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const init = useAuthStore(state => state.init);
    const initialized = useAuthStore(state => state.initialized);
    const { isLoading } = usePageLoaderStore();
    const authState = useAuthStore(state => state.user);
    const firebaseUser = useAuthStore(state => state.firebaseUser);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        let active = true;
        if (!firebaseUser || !authState || pathname.startsWith('/admin')) return;

        void firebaseUser.getIdTokenResult().then((token) => {
            if (active && token.claims.superAdmin === true) router.replace('/admin');
        }).catch((error) => {
            console.warn('Unable to check super-admin route access:', error);
        });

        return () => { active = false; };
    }, [authState, firebaseUser, pathname, router]);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            if (process.env.NODE_ENV !== 'production') {
                void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
                    const hasController = Boolean(navigator.serviceWorker.controller);
                    await Promise.all(registrations.map((registration) => registration.unregister()));
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.filter((name) => name.startsWith('agora-shell-')).map((name) => caches.delete(name)));
                    if (hasController) window.location.reload();
                });
                return;
            }
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
            <Toaster />
            <Suspense fallback={null}>
                <NavigationEvents />
            </Suspense>
            {children}
        </>
    );
}
