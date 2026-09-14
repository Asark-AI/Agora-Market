
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { LiquidLoader } from '@/components/liquid-loader';
import { DashboardHeader } from '@/components/dashboard-header';
import { businessConfig } from '@/lib/business-types';

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { seller, loading } = useAuth();
  const router = useRouter();
  const [fallbackTimer, setFallbackTimer] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setFallbackTimer(true), 3000);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!seller || !['approved', 'active'].includes(seller.status)) {
      router.replace('/seller-signup');
    }
  }, [seller, loading, router]);

  if (loading && !fallbackTimer) {
    return <LiquidLoader />;
  }

  if (!seller) {
    return null;
  }
  
  const config = businessConfig[seller.businessType];

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardNav mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
        <div className="flex flex-col flex-1">
            <DashboardHeader title={config.name} onOpenMobileMenu={() => setMobileNavOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <SidebarInset>{children}</SidebarInset>
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
