'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Check, Heart, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import type { StorefrontProduct } from '@/lib/storefront';
import { buildProductSlug, getImageUrl } from '@/lib/storefront';

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorite } = useWishlist();
  const favorite = isFavorite(product.id);
  const [isWishlisted, setIsWishlisted] = useState(favorite);
  const [justAdded, setJustAdded] = useState(false);

  const price = product.discountPrice ?? product.price;
  const oldPrice = product.discountPrice ? product.price : null;
  const isVerifiedSeller = Boolean(product.seller?.isVerifiedArtisan || product.seller?.trustScore);
  const soldCount = Math.max(10, Math.round((product.views || 0) / 5));
  const discountPercent = oldPrice ? Math.max(5, Math.round(((oldPrice - price) / oldPrice) * 100)) : 0;

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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-shadow duration-150 hover:shadow-sm active:scale-[0.995]">
      <div className="relative aspect-square overflow-hidden bg-white">
        <Link href={`/product/${buildProductSlug(product)}`} className="block h-full w-full" aria-label={`View ${product.name}`}>
          <NextImage
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw"
            loading="lazy"
            className="object-contain p-2 transition duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="absolute left-2 top-2">
          {oldPrice ? (
            <span className="rounded-md bg-rose-600 px-1.5 py-1 text-[11px] font-bold text-white">-{discountPercent}%</span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlist}
          className={`absolute right-2 top-2 z-10 inline-flex items-center justify-center rounded-full bg-white/90 p-1 text-sm transition ${isWishlisted ? 'text-primary' : 'text-foreground hover:bg-white'}`}
        >
          <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <Link href={`/product/${buildProductSlug(product)}`} className="block min-w-0">
          <h3 className="line-clamp-2 min-h-[36px] text-[13px] font-medium leading-[18px] text-foreground">{product.name}</h3>
        </Link>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <div className="text-[18px] font-bold leading-5 text-foreground">GH₵{price.toFixed(2)}</div>
          {oldPrice ? <div className="text-[11px] text-muted-foreground line-through">GH₵{oldPrice.toFixed(2)}</div> : null}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5"><Star className="size-3 fill-amber-400 text-amber-400" />{(product.ratingAverage ?? 4.5).toFixed(1)}</span>
          <span>·</span>
          <span>{soldCount} sold</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-1 pt-1.5 text-[10px] text-muted-foreground">
          <span className="truncate">{isVerifiedSeller ? '✓ Verified' : product.stock > 0 ? 'Free shipping' : 'Out of stock'}</span>
          <div className="flex-shrink-0">
            <button
              type="button"
              aria-label="Add to cart"
              onClick={handleAddToCart}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-background text-foreground transition ${justAdded ? 'border-emerald-500 bg-emerald-500 text-white' : 'hover:border-primary'}`}
            >
              {justAdded ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
