'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { PageLoader } from '@/components/page-loader';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, MoreHorizontal } from 'lucide-react';

const AppTour = dynamic(() => import('@/components/app-tour').then((mod) => mod.AppTour), {
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

    if (!seller || !['approved', 'active'].includes(seller.status)) {
      router.replace('/seller-signup');
    }
  }, [user, seller, loading, router]);

  useEffect(() => {
    if (seller) {
      initDashboardListeners();
    }
    
    return () => {
      clearListeners();
    };
  }, [seller, initDashboardListeners, clearListeners]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.dataset.sellerCenter = 'true';
    return () => {
      delete document.documentElement.dataset.sellerCenter;
    };
  }, []);

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

  const isActive = (href: string) => pathname === href;
  
  return (
    <SidebarProvider>
      <div className="seller-center-shell flex min-h-[100svh] w-full lg:h-[100dvh]">
        <DashboardNav mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
        <div className="flex min-h-[100svh] flex-1 flex-col overflow-x-hidden lg:h-[100dvh]">
          <DashboardHeader
            title="Seller Center"
            onOpenMobileMenu={() => setMobileNavOpen(true)}
          />
          <div className="relative flex-1 overflow-y-auto">
            <main className="p-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-6 lg:p-8">
              <SidebarInset>{children}</SidebarInset>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Seller Center quick navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-[#101316] md:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Link href="/dashboard" aria-current={isActive('/dashboard') ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center rounded-lg transition-colors hover:bg-accent ${isActive('/dashboard') ? 'bg-accent text-primary' : 'text-muted-foreground'}`} title="Overview">
            <LayoutDashboard className="mb-0.5 h-5 w-5" />
            <span className={`text-[11px] font-medium ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`}>Home</span>
          </Link>

          <Link href="/dashboard/products" aria-current={isActive('/dashboard/products') ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center rounded-lg transition-colors hover:bg-accent ${isActive('/dashboard/products') ? 'bg-accent text-primary' : 'text-muted-foreground'}`} title="Products">
            <Package className="mb-0.5 h-5 w-5" />
            <span className={`text-[11px] font-medium ${isActive('/dashboard/products') ? 'text-primary' : 'text-muted-foreground'}`}>Products</span>
          </Link>

          <Link href="/dashboard/orders" aria-current={isActive('/dashboard/orders') ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center rounded-lg transition-colors hover:bg-accent ${isActive('/dashboard/orders') ? 'bg-accent text-primary' : 'text-muted-foreground'}`} title="Orders">
            <ShoppingCart className="mb-0.5 h-5 w-5" />
            <span className={`text-[11px] font-medium ${isActive('/dashboard/orders') ? 'text-primary' : 'text-muted-foreground'}`}>Orders</span>
          </Link>

          <button type="button" onClick={() => setMobileNavOpen(true)} className="flex min-h-12 flex-col items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary" aria-label="Open more Seller Center navigation">
            <MoreHorizontal className="mb-0.5 h-5 w-5" />
            <span className="text-[11px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <AppTour />
    </SidebarProvider>
  );
}
