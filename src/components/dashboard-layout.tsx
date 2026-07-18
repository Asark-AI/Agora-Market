
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (!loading && !seller) {
      router.push('/seller-signup');
    }
  }, [seller, loading, router]);

  if (loading || !seller) {
    return <LiquidLoader />;
  }
  
  const config = businessConfig[seller.businessType];

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardNav />
        <div className="flex flex-col flex-1">
            <DashboardHeader title={config.name} />
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <SidebarInset>{children}</SidebarInset>
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
