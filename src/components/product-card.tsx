'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-border/70 bg-background shadow-[0_18px_45px_-28px_rgba(15,23,42,0.28)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_54px_-24px_rgba(15,23,42,0.38)] active:scale-[0.98]"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/70">
        <Link href={`/product/${buildProductSlug(product)}`} className="block h-full w-full" aria-label={`View ${product.name}`}>
          <Image
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="absolute inset-x-0 bottom-0 z-10 flex translate-y-full flex-col gap-2 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 py-3 text-white transition-transform duration-200 group-hover:translate-y-0">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-white/80">
            <span>Quick peek</span>
            <span className="rounded-full bg-white/15 px-2 py-1 backdrop-blur">{categoryLabel}</span>
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-5">{product.name}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[12px] text-white/90">
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star className="size-3 fill-current" />
                <span className="font-semibold text-white">4.8</span>
              </div>
              <span className="text-white/70">· 1.2k reviews</span>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
              Tap to view
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">GH₵{price.toFixed(2)}</span>
            {oldPrice ? <span className="text-xs text-white/80 line-through">GH₵{oldPrice.toFixed(2)}</span> : null}
          </div>
        </div>

        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {isVerifiedSeller ? (
            <span className="rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
              Verified
            </span>
          ) : null}
          {oldPrice ? (
            <span className="rounded-full bg-amber-500 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
              -{discountPercent}%
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlist}
          className={`absolute right-2 top-2 rounded-full border border-white/80 p-2 shadow-sm transition-all ${isWishlisted ? 'bg-primary text-primary-foreground' : 'bg-white/90 text-foreground hover:bg-white'}`}
        >
          <Heart className={`size-4 transition ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{categoryLabel}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">Free shipping</span>
        </div>

        <Link href={`/product/${buildProductSlug(product)}`} className="mt-2 block">
          <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-5 text-foreground">{product.name}</h3>
        </Link>

        <div className="mt-2 flex items-center gap-1 text-amber-500">
          <Star className="size-3.5 fill-current" />
          <span className="text-sm font-semibold text-foreground">4.8</span>
          <span className="text-xs text-muted-foreground">· {soldCount}+ sold</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">GH₵{price.toFixed(2)}</span>
          {oldPrice ? <span className="text-xs text-muted-foreground line-through">GH₵{oldPrice.toFixed(2)}</span> : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          {oldPrice ? <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-600">Save more</span> : null}
          {isVerifiedSeller ? <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">Trusted seller</span> : null}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">By {product.sellerName || 'Verified seller'}</p>
          <button
            type="button"
            aria-label="Add to cart"
            onClick={handleAddToCart}
            className={`transform rounded-full border p-2.5 transition-all duration-200 ${justAdded ? 'translate-y-0 border-emerald-500 bg-emerald-500 text-white' : 'translate-y-0 border-border/70 bg-background text-foreground hover:-translate-y-0.5 hover:border-primary hover:text-primary'}`}
          >
            {justAdded ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
