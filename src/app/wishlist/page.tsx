'use client';

import { PublicShell } from '@/components/public-shell';
import { useWishlist } from '@/hooks/use-wishlist';
import { ProductCard } from '@/components/product-card';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-7 sm:py-10">
        <header className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="agora-pill mb-3">Curated for you</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your wishlist</h1>
            <p className="mt-2 text-sm text-muted-foreground">Save products you love and come back when you are ready.</p>
          </div>
          <span className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? 'saved item' : 'saved items'}</span>
        </header>
        {items.length === 0 ? (
          <Card className="agora-card rounded-2xl">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
              <div className="flex size-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                <Heart className="size-6" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">Your wishlist is waiting</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Tap the heart on any product to keep it close. Your saved items will be here whenever you return.</p>
              <Link href="/products" className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Explore products</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.product.id} className="min-w-0"><ProductCard product={item.product as any} /></div>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
