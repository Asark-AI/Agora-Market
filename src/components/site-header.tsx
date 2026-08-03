
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Search, Heart, House, Layers3, Store, UserRound } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLogo } from './app-logo';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: House },
  { href: '/categories', label: 'Categories', icon: Layers3 },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/stores', label: 'Stores', icon: Store },
];

export function SiteHeader() {
  const { items } = useCart();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const itemCount = isClient ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <AppLogo className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              <div>
                <p className="text-base font-semibold">Agora</p>
                <p className="text-xs text-muted-foreground">Premium marketplace</p>
              </div>
            </Link>

            <form action="/search" className="flex-1 lg:max-w-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" placeholder="Search products, stores, brands" className="h-10 rounded-full pl-9" />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <nav className="hidden items-center gap-2 lg:flex">
                {navItems.map(({ href, label }) => {
                  const active = href === '/' ? pathname === '/' || pathname === '/products' : pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link key={href} href={href} className={`rounded-full px-3 py-2 text-sm font-medium transition ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/wishlist" aria-label="Wishlist">
                  <Heart className="size-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="relative">
                <Link href="/cart" aria-label="Cart">
                  <ShoppingCart className="size-5" />
                  {itemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button asChild variant="outline" className="hidden md:inline-flex">
                <Link href="/sign-in" className="gap-2">
                  <UserRound className="size-4" /> Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
