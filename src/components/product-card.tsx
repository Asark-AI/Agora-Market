'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Check, Heart, Plus, ShoppingCart, Star, Eye } from 'lucide-react';
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
  const [hoverSwap, setHoverSwap] = useState(false);

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

  const secondaryImage = product.images?.[1];

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-border/50 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.995] lg:h-[420px]"
      onMouseEnter={() => setHoverSwap(true)}
      onMouseLeave={() => setHoverSwap(false)}
    >
      <div className="relative overflow-hidden bg-muted/70 rounded-t-sm aspect-square">
        <Link href={`/product/${buildProductSlug(product)}`} className="block h-full w-full" aria-label={`View ${product.name}`}>
          <NextImage
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw"
            loading="lazy"
            className={`transition duration-300 ${hoverSwap && secondaryImage ? 'group-hover:scale-105 scale-105' : 'group-hover:scale-105'}`}
            // object-fit chosen by category for better clarity on mobile
            style={{ objectFit: categoryLabel?.toLowerCase?.()?.includes('elect') ? 'contain' : 'cover' }}
          />
        </Link>

        {/* Badges (compact) */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {oldPrice ? (
            <span className="rounded-md bg-rose-50 text-rose-600 px-2 py-1 text-[11px] font-semibold">-{discountPercent}%</span>
          ) : null}
          {isVerifiedSeller ? (
            <span className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-foreground">✓ Verified</span>
          ) : null}
        </div>

        {/* Floating wishlist */}
        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlist}
          className={`absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full bg-white/90 p-1.5 text-sm shadow-sm transition ${isWishlisted ? 'text-primary' : 'text-foreground hover:bg-white'}`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick-view button - desktop only, appears on hover */}
        <button
          type="button"
          aria-label="Quick view"
          onClick={() => setShowPreview(true)}
          className="hidden md:group-hover:flex absolute left-1/2 bottom-3 z-20 -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-sm font-medium shadow-sm"
        >
          <Eye className="h-4 w-4" />
          <span>Quick view</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link href={`/product/${buildProductSlug(product)}`} className="block">
              <h3 className="line-clamp-2 text-sm font-medium leading-5 text-foreground min-h-[44px]">{product.name}</h3>
            </Link>

            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" />{(product.ratingAverage ?? 4.5).toFixed(1)}</span>
              <span>·</span>
              <span>{product.ratingCount ? `${product.ratingCount} reviews` : `${soldCount} sold`}</span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="text-lg font-bold text-foreground">GH₵{price.toFixed(2)}</div>
              {oldPrice ? <div className="text-sm text-muted-foreground line-through">GH₵{oldPrice.toFixed(2)}</div> : null}
              {oldPrice ? <div className="text-xs text-amber-600">-{discountPercent}%</div> : null}
            </div>

            <div className="mt-1 text-xs text-muted-foreground">{product.stock > 0 ? 'Free shipping' : 'Out of stock'}</div>
          </div>

          <div className="ml-2 flex-shrink-0 flex flex-col items-end gap-2">
            {/* Mobile: single compact add-to-cart button */}
            <button
              type="button"
              aria-label="Add to cart"
              onClick={handleAddToCart}
              className={`inline-flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background text-foreground transition ${justAdded ? 'border-emerald-500 bg-emerald-500 text-white' : 'hover:border-primary'}`}
            >
              {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </button>

            {/* Desktop: single quick-add button (label + icon) */}
            <button
              type="button"
              aria-label="Quick add"
              onClick={handleAddToCart}
              className={`hidden md:inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-sm font-semibold text-primary transition ${justAdded ? 'border-emerald-500 bg-emerald-500 text-white' : 'group-hover:flex hover:border-primary'}`}
            >
              {justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span className="hidden md:inline">Add</span>
            </button>
          </div>
        </div>
      </div>
      {showPreview ? (
        // lazy render quick view modal to avoid SSR issues
        <div role="dialog" aria-modal="true" aria-labelledby={`quick-view-title-${product.id}`}>
          <div id={`quick-view-${product.id}`} className="fixed inset-0 z-50 flex items-center justify-center" onKeyDown={(event) => { if (event.key === 'Escape') setShowPreview(false); }}>
            <button type="button" aria-label="Close quick view" className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(false)} />
            <div className="relative z-10 w-[min(900px,95%)] rounded-lg bg-white p-4">
              <div className="flex gap-4">
                <div className="relative h-64 w-64 flex-shrink-0 bg-muted/70">
                  <NextImage src={getImageUrl(product.images?.[0])} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <h3 id={`quick-view-title-${product.id}`} className="text-lg font-semibold">{product.name}</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold">GH₵{price.toFixed(2)}</div>
                    {oldPrice ? <div className="text-sm text-muted-foreground line-through">GH₵{oldPrice.toFixed(2)}</div> : null}
                    {oldPrice ? <div className="text-sm text-amber-600">Save {discountPercent}%</div> : null}
                  </div>
                  <div className="text-sm text-muted-foreground">{product.description ?? product.name}</div>
                  <div className="mt-auto flex items-center gap-2">
                    <button type="button" onClick={handleAddToCart} className="rounded-full bg-emerald-500 px-4 py-2 text-white">Add to cart</button>
                    <button type="button" onClick={() => { handleWishlist(new MouseEvent('click') as any); }} className="rounded-full border px-3 py-2">{isWishlisted ? 'Wishlisted' : 'Wishlist'}</button>
                    <button type="button" onClick={() => setShowPreview(false)} className="ml-auto text-sm text-muted-foreground">Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
