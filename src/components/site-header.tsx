
'use client';
import Link from 'next/link';
import { ShoppingCart, Search, Layers, Heart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { AppLogo } from './app-logo';
import { useEffect, useState } from 'react';

export function SiteHeader() {
  const { items } = useCart();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const itemCount = isClient ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="w-8 h-8 text-primary" />
            <div>
              <p className="text-base font-semibold">Agora</p>
              <p className="text-xs text-muted-foreground">Marketplace for local sellers</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <nav className="hidden gap-3 md:flex">
              <Link href="/" className="text-sm font-medium text-foreground hover:text-primary">Home</Link>
              <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground">Search</Link>
              <Link href="/categories" className="text-sm font-medium text-muted-foreground hover:text-foreground">Categories</Link>
              <Link href="/wishlist" className="text-sm font-medium text-muted-foreground hover:text-foreground">Wishlist</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden md:inline-flex">
                <Link href="/search"><Search className="size-5" /></Link>
              </Button>
              <Button asChild variant="ghost" className="hidden md:inline-flex">
                <Link href="/categories"><Layers className="size-5" /></Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/wishlist" aria-label="Wishlist"><Heart className="size-5" /></Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/cart" className="relative" aria-label="Cart">
                  <ShoppingCart className="size-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
