'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { PageLoader } from '@/components/page-loader';
import { businessConfig } from '@/lib/business-types';

const AppTour = dynamic(() => import('@/components/app-tour'), {
  ssr: false,
  loading: () => null,
});

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, seller, loading, initDashboardListeners, clearListeners } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [fallbackTimer, setFallbackTimer] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setFallbackTimer(true), 3000);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/sign-in');
      return;
    }

    if (!seller) {
      router.replace('/seller-signup');
    }
  }, [user, seller, loading, router]);

  useEffect(() => {
    if (seller) {
      initDashboardListeners();
    }
    
    // When the user navigates away from the dashboard, clean up the data listeners.
    return () => {
      clearListeners();
    };
  }, [seller, initDashboardListeners, clearListeners]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (loading && !fallbackTimer) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  if (!seller) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Preparing your dashboard...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <DashboardNav mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
        <div className="flex flex-col flex-1 h-screen overflow-x-hidden">
          <DashboardHeader
            title={seller ? businessConfig[seller.businessType]?.name || 'Dashboard' : 'Dashboard'}
            onOpenMobileMenu={() => setMobileNavOpen(true)}
          />
          <div className="relative flex-1 overflow-y-auto">
            <main className="p-4 sm:p-6 lg:p-8">
              <SidebarInset>{children}</SidebarInset>
            </main>
          </div>
        </div>
      </div>
      <AppTour />
    </SidebarProvider>
  );
}
