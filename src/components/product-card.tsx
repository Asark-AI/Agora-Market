'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { BadgeCheck, Check, Heart, ShoppingCart, Star, Truck } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import type { StorefrontProduct } from '@/lib/storefront';
import { buildProductSlug, getImageUrl } from '@/lib/storefront';
import { animateProductToFloatingCart } from '@/lib/cart-fly-animation';

const priceFormatter = new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const countFormatter = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 0 });

export function ProductCard({ product, dealMode = false, priority = false }: { product: StorefrontProduct; dealMode?: boolean; priority?: boolean }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorite } = useWishlist();
  const favorite = isFavorite(product.id);
  const [isWishlisted, setIsWishlisted] = useState(favorite);
  const [justAdded, setJustAdded] = useState(false);

  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;
  const price = hasDiscount ? product.discountPrice ?? product.price : product.price;
  const oldPrice = hasDiscount ? product.price : null;
  const isVerifiedSeller = Boolean(product.seller?.isVerifiedArtisan);
  const discountPercent = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const rating = product.ratingAverage;
  const ratingCount = product.ratingCount;
  const hasReviews = (ratingCount ?? 0) > 0;
  const hasRating = rating !== undefined && hasReviews;
  const soldCount = Number(product.soldCount);
  const hasSoldCount = Number.isFinite(soldCount) && soldCount > 0;
  const deliveryLabel = product.seller?.deliveryOptions?.includes('seller-delivery')
    ? 'Delivery available'
    : product.seller?.deliveryOptions?.includes('buyer-pickup')
      ? 'Pickup available'
      : null;
  const stockLabel = product.stock <= 0 ? 'Out of stock' : product.stock <= 5 ? `${product.stock} left` : null;
  const formatPrice = (amount: number) => `GH₵${priceFormatter.format(amount)}`;

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
    const sourceImage = event.currentTarget.closest('article')?.querySelector('img') ?? null;
    addToCart(product as any);
    animateProductToFloatingCart(sourceImage);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 700);
  };

  return (
    <article className="group relative flex min-w-0 h-full flex-col overflow-hidden rounded-[var(--radius)] border border-[#e7edf3] bg-white/95 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.32)] ring-1 ring-black/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c4d2de] hover:shadow-[0_20px_38px_-24px_rgba(15,23,42,0.38)] active:scale-[0.995]">
      <div className="relative aspect-square overflow-hidden rounded-t-[var(--radius)] bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Link href={`/product/${buildProductSlug(product)}`} className="block h-full w-full" aria-label={`View ${product.name}`}>
          <NextImage
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        </Link>

        <div className="absolute left-2 top-2">
          {oldPrice ? (
            <span className="bg-[#b42318] px-1.5 py-1 text-[10px] font-bold text-white">-{discountPercent}%</span>
          ) : null}
        </div>

        {dealMode && oldPrice ? <span className="absolute bottom-2 left-2 bg-[#fff4f2] px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#b42318]">Flash deal</span> : null}

        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
          className={`absolute right-2 top-2 z-10 inline-flex size-9 items-center justify-center rounded-full border border-[#e0e5e9] bg-white/95 shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769aa] ${isWishlisted ? 'text-[#b42318]' : 'text-[#526170] hover:text-[#1769aa]'}`}
        >
          <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <Link href={`/product/${buildProductSlug(product)}`} className="block min-w-0">
          <h3 className="line-clamp-2 min-h-9 text-[13px] font-semibold leading-[18px] text-[#26384a]">{product.name}</h3>
        </Link>
        <div className="mt-1 flex h-4 min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[10px] text-[#74808d]">
          {hasRating ? <span className="inline-flex shrink-0 items-center gap-0.5"><Star className="size-3 fill-[#d19b2d] text-[#d19b2d]" />{rating.toFixed(1)}</span> : hasReviews ? <span className="shrink-0">{countFormatter.format(ratingCount ?? 0)} reviews</span> : <span className="shrink-0">No reviews yet</span>}
          {hasReviews && hasRating && <span className="shrink-0">· {countFormatter.format(ratingCount ?? 0)} reviews</span>}
          {hasSoldCount && <span className="shrink-0">· {countFormatter.format(soldCount)} sold</span>}
          {isVerifiedSeller && <span className="shrink-0" aria-label="Verified seller" title="Verified seller"><BadgeCheck className="size-3.5 text-[#1769aa]" aria-hidden="true" /></span>}
        </div>
        <div className="mt-1.5 min-w-0">
          <div className="truncate text-base font-bold leading-5 text-[#1c2633] sm:text-[17px]">{formatPrice(price)}</div>
          <div className="mt-0.5 flex h-4 items-center gap-1.5 text-[10px]">
            {oldPrice ? <><span className="truncate text-[#87929d] line-through">{formatPrice(oldPrice)}</span><span className="shrink-0 font-semibold text-[#b42318]">-{discountPercent}%</span></> : <span className="invisible">&nbsp;</span>}
          </div>
        </div>
        <div className="mt-auto flex min-h-10 items-center justify-between gap-2 pt-1.5">
          <div className="flex min-w-0 flex-col text-[10px] leading-4">
            {deliveryLabel && <span className="inline-flex min-w-0 items-center gap-1 truncate text-[#526170]"><Truck className="size-3 shrink-0 text-[#21744a]" />{deliveryLabel}</span>}
            {stockLabel && <span className={`truncate ${product.stock <= 0 ? 'font-medium text-[#b42318]' : 'text-[#74808d]'}`}>{stockLabel}</span>}
          </div>
          <button
            type="button"
            aria-label={justAdded ? 'Product added to cart' : 'Add product to cart'}
            title={justAdded ? 'Added to cart' : 'Add to cart'}
            onClick={handleAddToCart}
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769aa] ${justAdded ? 'border-[#21744a] bg-[#21744a] text-white' : 'border-[#cfd8e1] bg-white text-[#1769aa] hover:border-[#1769aa]'} ${product.stock <= 0 ? 'cursor-not-allowed opacity-40' : ''}`}
            disabled={product.stock <= 0}
          >
            {justAdded ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
