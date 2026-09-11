 'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { ArrowRight, Instagram, Facebook, MessageCircle, House, Search as SearchIcon, ShoppingCart, Package, UserRound } from 'lucide-react';
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
      <footer className="border-t bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">Agora Marketplace</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Discover curated products from trusted local and regional sellers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Quick Links</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/categories" className="hover:text-foreground">Categories</Link>
                <Link href="/products" className="hover:text-foreground">Products</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Stay Connected</h3>
              <div className="mt-3 flex gap-3">
                <Button size="icon" variant="outline" asChild>
                  <Link href="/" aria-label="Facebook"><Facebook className="size-4" /></Link>
                </Button>
                <Button size="icon" variant="outline" asChild>
                  <Link href="/" aria-label="Instagram"><Instagram className="size-4" /></Link>
                </Button>
                <Button size="icon" variant="outline" asChild>
                  <Link href="/" aria-label="WhatsApp"><MessageCircle className="size-4" /></Link>
                </Button>
              </div>
              <Button variant="link" className="mt-3 px-0" asChild>
                <Link href="/sign-up">
                  Join as a seller <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
