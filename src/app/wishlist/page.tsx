'use client';

import { PublicShell } from '@/components/public-shell';
import { useWishlist } from '@/hooks/use-wishlist';
import { ProductCard } from '@/components/product-card';
import { Card, CardContent } from '@/components/ui/card';

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Wishlist</h1>
        <p className="mt-2 text-muted-foreground">Save products you love for later.</p>
        {items.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-8 text-center text-muted-foreground">Your wishlist is empty.</CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <ProductCard key={item.product.id} product={item.product as any} />
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
