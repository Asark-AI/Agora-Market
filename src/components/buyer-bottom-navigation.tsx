'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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

const matchesRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export function BuyerBottomNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const cartItemCount = useCart((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const accountHref = user ? '/profile' : '/sign-in';
  const isOrdersActive =
    (pathname.startsWith('/profile') && searchParams.get('tab') === 'orders')
    || matchesRoute(pathname, '/track-order');
  const isAccountActive =
    (pathname.startsWith('/profile') && !isOrdersActive)
    || ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'].some((route) =>
      matchesRoute(pathname, route),
    );
  const isExploreActive = [
    '/search',
    '/products',
    '/product',
    '/categories',
    '/store',
    '/stores',
    '/flash-deals',
    '/solutions',
  ].some((route) => matchesRoute(pathname, route));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden">
      <nav
        aria-label="Buyer navigation"
        className="pointer-events-auto mx-auto grid h-[4.25rem] max-w-md grid-cols-5 rounded-full border border-[#34383D] bg-[#1C1F22]/95 p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.48)] backdrop-blur-xl"
      >
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const resolvedHref = label === 'Account' ? accountHref : href;
          const isActive = label === 'Home'
            ? pathname === '/'
            : label === 'Explore'
              ? isExploreActive
              : label === 'Cart'
                ? pathname.startsWith('/cart')
                : label === 'Orders'
                  ? isOrdersActive
                  : isAccountActive;

          return (
            <Link
              key={label}
              href={resolvedHref}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label === 'Cart' && cartItemCount > 0
                ? `Cart, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'}`
                : label}
              className={`relative flex min-w-0 min-h-14 flex-col items-center justify-center gap-0.5 rounded-full px-0.5 text-[10px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1F22] ${
                isActive
                  ? 'bg-[#292D31] text-primary'
                  : 'text-[#B7BCC3] hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <span className="truncate">{label}</span>
              {label === 'Cart' && cartItemCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#1C1F22] bg-primary px-1 text-[9px] font-semibold leading-none text-primary-foreground"
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
