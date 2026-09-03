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
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, Plus } from 'lucide-react';

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

    if (!seller) {
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
      <div className="flex h-screen w-full bg-background">
        <DashboardNav mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
        <div className="flex flex-col flex-1 h-screen overflow-x-hidden">
          <DashboardHeader
            title="Seller Center"
            onOpenMobileMenu={() => setMobileNavOpen(true)}
          />
          <div className="relative flex-1 overflow-y-auto">
            <main className="p-4 pb-24 sm:p-6 sm:pb-6 lg:p-8">
              <SidebarInset>{children}</SidebarInset>
            </main>
            {/* Floating Add Product Button (Mobile) */}
            <Link href="/dashboard/add-product" className="fixed bottom-20 right-4 z-20 md:hidden inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all" title="Add product" aria-label="Add product">
              <Plus className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden border-t border-border/70 bg-background/95 backdrop-blur-xl shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.28)]">
        <div className="grid grid-cols-4 gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Link href="/dashboard" className="flex flex-col items-center justify-center rounded-xl py-3 transition-colors hover:bg-muted" title="Overview">
            <LayoutDashboard className={`h-5 w-5 mb-1 ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[11px] font-medium ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`}>Home</span>
          </Link>

          <Link href="/dashboard/products" className="flex flex-col items-center justify-center rounded-xl py-3 transition-colors hover:bg-muted" title="Products">
            <Package className={`h-5 w-5 mb-1 ${isActive('/dashboard/products') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[11px] font-medium ${isActive('/dashboard/products') ? 'text-primary' : 'text-muted-foreground'}`}>Products</span>
          </Link>

          <Link href="/dashboard/orders" className="flex flex-col items-center justify-center rounded-xl py-3 transition-colors hover:bg-muted" title="Orders">
            <ShoppingCart className={`h-5 w-5 mb-1 ${isActive('/dashboard/orders') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[11px] font-medium ${isActive('/dashboard/orders') ? 'text-primary' : 'text-muted-foreground'}`}>Orders</span>
          </Link>

          <Link href="/dashboard/messages" className="flex flex-col items-center justify-center rounded-xl py-3 transition-colors hover:bg-muted" title="Messages">
            <MessageSquare className={`h-5 w-5 mb-1 ${isActive('/dashboard/messages') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[11px] font-medium ${isActive('/dashboard/messages') ? 'text-primary' : 'text-muted-foreground'}`}>Messages</span>
          </Link>
        </div>
      </nav>

      <AppTour />
    </SidebarProvider>
  );
}
