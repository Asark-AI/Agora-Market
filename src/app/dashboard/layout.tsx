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
import { LayoutDashboard, MoreHorizontal, Package, ShoppingCart } from 'lucide-react';

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
            title="Seller Center"
            onOpenMobileMenu={() => setMobileNavOpen(true)}
          />
          <div className="relative flex-1 overflow-y-auto">
            <main className="p-4 pb-24 sm:p-6 sm:pb-6 lg:p-8">
              <SidebarInset>{children}</SidebarInset>
            </main>
          </div>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border/70 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.28)] backdrop-blur-xl md:hidden" aria-label="Seller Center navigation">
        {[
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
          { href: '/dashboard/products', label: 'Products', icon: Package },
          { href: '/dashboard/analytics', label: 'More', icon: MoreHorizontal },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <Icon className="size-4" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <AppTour />
    </SidebarProvider>
  );
}
