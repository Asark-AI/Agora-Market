'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Check, Heart, ShoppingCart, Star, Store } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import type { StorefrontProduct } from '@/lib/storefront';
import { buildProductSlug, getImageUrl } from '@/lib/storefront';

export function ProductCard({ product, dealMode = false, priority = false }: { product: StorefrontProduct; dealMode?: boolean; priority?: boolean }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorite } = useWishlist();
  const favorite = isFavorite(product.id);
  const [isWishlisted, setIsWishlisted] = useState(favorite);
  const [justAdded, setJustAdded] = useState(false);

  const price = product.discountPrice ?? product.price;
  const oldPrice = product.discountPrice ? product.price : null;
  const isVerifiedSeller = Boolean(product.seller?.isVerifiedArtisan || product.seller?.trustScore);
  const discountPercent = oldPrice ? Math.max(5, Math.round(((oldPrice - price) / oldPrice) * 100)) : 0;
  const rating = product.ratingAverage;
  const ratingCount = product.ratingCount;
  const stockLabel = product.stock <= 0 ? 'Out of stock' : product.stock <= 5 ? `${product.stock} left` : 'In stock';

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
    <article className="group relative flex min-w-0 h-full flex-col overflow-hidden border border-[#e3e7eb] bg-white transition-[border-color,box-shadow] duration-200 hover:border-[#b9c8d5] hover:shadow-[0_10px_28px_rgba(25,55,80,0.1)] active:scale-[0.995]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f1f4f6]">
        <Link href={`/product/${buildProductSlug(product)}`} className="block h-full w-full" aria-label={`View ${product.name}`}>
          <NextImage
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="absolute left-2 top-2">
          {oldPrice ? (
            <span className="bg-[#b42318] px-1.5 py-1 text-[11px] font-bold text-white">-{discountPercent}%</span>
          ) : null}
        </div>

        {dealMode && oldPrice ? <span className="absolute bottom-2 left-2 bg-[#fff4f2] px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#b42318]">Flash deal</span> : null}

        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlist}
            className={`absolute right-2 top-2 z-10 inline-flex size-9 items-center justify-center rounded-full border border-[#e0e5e9] bg-white/95 text-sm transition ${isWishlisted ? 'text-[#b42318]' : 'text-[#526170] hover:text-[#1769aa]'}`}
        >
          <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/product/${buildProductSlug(product)}`} className="block min-w-0">
          <h3 className="line-clamp-2 min-h-[38px] text-[13px] font-medium leading-[19px] text-[#26384a]">{product.name}</h3>
        </Link>
        <div className="mt-2 flex min-w-0 items-center gap-1 text-[11px] text-[#74808d]">
          <Store className="size-3 shrink-0 text-[#9a772b]" />
          <span className="truncate">{product.seller?.name || product.sellerName || 'Agora seller'}</span>
          {isVerifiedSeller && <span className="shrink-0 text-[#1769aa]" title="Verified seller">✓</span>}
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <div className="text-[18px] font-bold leading-5 text-[#1c2633]">GH₵{price.toFixed(2)}</div>
          {oldPrice ? <div className="text-[11px] text-[#87929d] line-through">GH₵{oldPrice.toFixed(2)}</div> : null}
        </div>
        {rating !== undefined || !dealMode ? <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#74808d]">
          {rating !== undefined ? <span className="inline-flex items-center gap-0.5"><Star className="size-3 fill-[#d19b2d] text-[#d19b2d]" />{rating.toFixed(1)}{ratingCount ? <span>({ratingCount})</span> : null}</span> : <span>No reviews yet</span>}
        </div> : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[10px] text-[#74808d]">
          <span className={product.stock > 0 && product.stock <= 5 ? 'font-medium text-[#b42318]' : 'truncate'}>{stockLabel}</span>
          <div className="flex-shrink-0">
            <button
              type="button"
              aria-label="Add to cart"
              onClick={handleAddToCart}
              className={`inline-flex h-8 w-8 items-center justify-center border border-[#cfd8e1] bg-white text-[#1769aa] transition ${justAdded ? 'border-[#21744a] bg-[#21744a] text-white' : 'hover:border-[#1769aa]'} ${product.stock <= 0 ? 'cursor-not-allowed opacity-40' : ''}`}
              disabled={product.stock <= 0}
            >
              {justAdded ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
