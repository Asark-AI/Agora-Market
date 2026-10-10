'use client';

import { SiteHeader } from '@/components/site-header';
import { BuyerBottomNavigation } from '@/components/buyer-bottom-navigation';
import { FloatingCart } from '@/components/floating-cart';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main className="pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-10">{children}</main>
      <FloatingCart />
      <BuyerBottomNavigation />
    </div>
  );
}
