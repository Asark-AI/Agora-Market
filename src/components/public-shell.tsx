 'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = items.reduce((sum, item) => {
    const product = item.product as { price: number; discountPrice?: number };
    return sum + (product.discountPrice ?? product.price) * item.quantity;
  }, 0);
  const [cartPosition, setCartPosition] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    const handleResize = () => setCartPosition((position) => ({
      x: Math.min(position.x, Math.max(0, window.innerWidth - 190)),
      y: Math.min(position.y, Math.max(0, window.innerHeight - 72)),
    }));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCartPointerDown = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: cartPosition.x, originY: cartPosition.y };
  };

  const handleCartPointerMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setCartPosition({
      x: Math.max(0, Math.min(window.innerWidth - 190, drag.originX + event.clientX - drag.startX)),
      y: Math.max(0, Math.min(window.innerHeight - 72, drag.originY + event.clientY - drag.startY)),
    });
  };

  const handleCartPointerUp = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (dragState.current?.pointerId === event.pointerId) dragState.current = null;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main className="pb-24 sm:pb-16 md:pb-10">{children}</main>
      {cartItemCount > 0 && !pathname.startsWith('/cart') && !pathname.startsWith('/checkout') && (
        <Link
          href="/cart"
          onPointerDown={handleCartPointerDown}
          onPointerMove={handleCartPointerMove}
          onPointerUp={handleCartPointerUp}
          onPointerCancel={handleCartPointerUp}
          style={{ transform: `translate3d(${cartPosition.x}px, ${cartPosition.y}px, 0)` }}
          className="fixed bottom-[4.75rem] right-4 z-40 flex cursor-grab touch-none select-none items-center gap-3 rounded-full border border-border bg-foreground px-3 py-2.5 text-background shadow-lg transition-shadow hover:shadow-xl active:cursor-grabbing md:bottom-5 md:right-5"
          aria-label={`View cart with ${cartItemCount} items totaling GH₵${cartSubtotal.toFixed(2)}`}
        >
          <span className="relative flex size-8 items-center justify-center bg-background/15"><ShoppingCart className="size-4" /><span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{cartItemCount}</span></span>
          <span className="flex flex-col leading-tight"><span className="text-[11px] text-background/70">Cart</span><span className="text-sm font-semibold">GH₵{cartSubtotal.toFixed(2)}</span></span>
        </Link>
      )}
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
