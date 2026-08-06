'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Check, Heart, Plus, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import type { StorefrontProduct } from '@/lib/storefront';
import { buildProductSlug, getImageUrl, getCategoryLabel } from '@/lib/storefront';

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorite } = useWishlist();
  const favorite = isFavorite(product.id);
  const [isWishlisted, setIsWishlisted] = useState(favorite);
  const [justAdded, setJustAdded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const price = product.discountPrice ?? product.price;
  const oldPrice = product.discountPrice ? product.price : null;
  const isVerifiedSeller = Boolean(product.seller?.isVerifiedArtisan || product.seller?.trustScore);
  const soldCount = Math.max(10, Math.round((product.views || 0) / 5));
  const discountPercent = oldPrice ? Math.max(5, Math.round(((oldPrice - price) / oldPrice) * 100)) : 0;
  const categoryLabel = getCategoryLabel(product.categoryId);

  useEffect(() => {
    setIsWishlisted(favorite);
  }, [favorite]);

  const handleWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product);
    setIsWishlisted((current) => !current);
  };

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product as any);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 700);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-border/70 bg-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.32)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_48px_-24px_rgba(15,23,42,0.36)] active:scale-[0.99]">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/70">
        <Link href={`/product/${buildProductSlug(product)}`} className="block h-full w-full" aria-label={`View ${product.name}`}>
          <NextImage
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {isVerifiedSeller ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
              Verified
            </span>
          ) : null}
          {oldPrice ? (
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground shadow-sm">
              -{discountPercent}%
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlist}
          className={`absolute right-3 top-3 rounded-full border border-white/90 bg-white/90 p-2 shadow-sm transition-all ${isWishlisted ? 'text-primary' : 'text-foreground hover:bg-white'}`}
        >
          <Heart className={`size-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded-full bg-muted/20 px-2 py-1">{categoryLabel}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">{product.stock > 0 ? 'In stock' : 'Out of stock'}</span>
        </div>

        <Link href={`/product/${buildProductSlug(product)}`} className="block">
          <h3 className="line-clamp-2 text-base font-semibold leading-6 text-foreground">{product.name}</h3>
        </Link>

        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span>GH₵{price.toFixed(2)}</span>
            {oldPrice ? <span className="text-sm text-muted-foreground line-through">GH₵{oldPrice.toFixed(2)}</span> : null}
          </div>
          {oldPrice ? (
            <span className="text-sm text-amber-600">Save {discountPercent}%</span>
          ) : null}
        </div>

        <div className="grid gap-2 rounded-3xl border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">{product.sellerName || 'Verified seller'}</span>
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4" />
              <span>{(product.ratingAverage ?? 4.5).toFixed(1)}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{product.ratingCount ? `${product.ratingCount} reviews` : 'New arrival'}</span>
            <span>{product.regionId || 'Accra'}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>🚚 Delivery tomorrow</span>
            <span>{product.stock > 0 ? 'Fast dispatch' : 'Restocking'}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Add to cart"
            onClick={handleAddToCart}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${justAdded ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border/70 bg-background text-foreground hover:border-primary hover:text-primary'}`}
          >
            {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />} Add
          </button>
          <span className="rounded-full bg-muted/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{product.stock} left</span>
        </div>
      </div>
    </article>
  );
}
