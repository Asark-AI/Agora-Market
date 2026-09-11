 'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { House, Search as SearchIcon, ShoppingCart, Package, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';

const mobileNavItems = [
  { href: '/', label: 'Home', icon: House },
  { href: '/search', label: 'Explore', icon: SearchIcon },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/profile?tab=orders', label: 'Orders', icon: Package },
  { href: '/profile', label: 'Account', icon: UserRound },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items } = useCart();
  const accountHref = user ? '/profile' : '/sign-in';

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main className="pb-24 sm:pb-16 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {mobileNavItems.map(({ href, label, icon: Icon }, index) => {
            const resolvedHref = label === 'Account' ? accountHref : href;
            const isActive = label === 'Home' ? pathname === '/' : label === 'Cart' ? pathname.startsWith('/cart') : label === 'Orders' ? pathname.startsWith('/profile') && searchParams.get('tab') === 'orders' : label === 'Account' ? pathname.startsWith('/profile') && searchParams.get('tab') !== 'orders' : pathname.startsWith('/search');

            return (
            <Link key={`${label}-${index}`} href={resolvedHref} className={`relative flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium transition hover:text-foreground ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              <Icon className="size-4" />
              <span>{label}</span>
              {label === 'Cart' && items.length > 0 && <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>}
            </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
