'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { PageLoader } from '@/components/page-loader';
import { StorefrontEditorProvider } from '@/hooks/use-storefront-editor';
import { AppTour } from '@/components/app-tour';

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, seller, loading, initDashboardListeners, clearListeners } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    } else if (!loading && user && !seller) {
      router.push('/seller-signup');
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

  if (loading || !seller) {
    return <PageLoader />;
  }
  
  return (
    <StorefrontEditorProvider>
        <div className="flex h-screen w-full bg-background">
          <DashboardNav />
          <div className="flex flex-col flex-1 h-screen overflow-y-hidden">
            <div className="relative flex-1 overflow-y-auto">
                <main className="p-4 sm:p-6 lg:p-8">
                    <SidebarInset>{children}</SidebarInset>
                </main>
            </div>
          </div>
        </div>
        <AppTour />
    </StorefrontEditorProvider>
  );
}
