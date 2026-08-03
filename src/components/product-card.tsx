'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import type { StorefrontProduct } from '@/lib/storefront';
import { buildProductSlug, getImageUrl, getCategoryLabel } from '@/lib/storefront';

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorite } = useWishlist();
  const favorite = isFavorite(product.id);
  const price = product.discountPrice ?? product.price;
  const oldPrice = product.discountPrice ? product.price : null;
  const isVerifiedSeller = Boolean(product.seller?.isVerifiedArtisan || product.seller?.trustScore);
  const soldCount = Math.max(10, Math.round((product.views || 0) / 5));

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border/60 bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/product/${buildProductSlug(product)}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image src={getImageUrl(product.images?.[0])} alt={product.name} fill className="object-cover transition duration-300 group-hover:scale-105" />
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">{getCategoryLabel(product.categoryId)}</span>
          <button type="button" onClick={() => toggleWishlist(product)} className={`rounded-full p-1.5 ${favorite ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
            <Heart className={`size-4 ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        <Link href={`/product/${buildProductSlug(product)}`} className="mt-3 block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5">{product.name}</h3>
        </Link>
        <div className="mt-2 flex items-center gap-1 text-amber-500">
          <Star className="size-4 fill-current" />
          <span className="text-sm font-medium text-foreground">4.8</span>
          <span className="text-xs text-muted-foreground">(120)</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-semibold">GH₵{price.toFixed(2)}</span>
          {oldPrice && <span className="text-sm text-muted-foreground line-through">GH₵{oldPrice.toFixed(2)}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {isVerifiedSeller && <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">Verified seller</span>}
          <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-600">Free shipping</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{soldCount}+ sold</span>
          {oldPrice && <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-600">-{Math.round(((oldPrice - price) / oldPrice) * 100)}%</span>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">By {product.sellerName || 'Verified Seller'}</p>
      </CardContent>
      <CardFooter className="mt-auto flex gap-2 p-4 pt-0">
        <Button size="sm" className="flex-1" onClick={() => addToCart(product as any)}>
          <ShoppingCart className="mr-2 size-4" /> Add
        </Button>
        <Button size="sm" variant="outline" asChild className="flex-1">
          <Link href={`/product/${buildProductSlug(product)}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
