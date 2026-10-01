'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowLeft, BadgeCheck, Check, ChevronLeft, ChevronRight, Heart, Share2, ShieldCheck, ShoppingCart, Star, Store, Truck, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import type { StorefrontProduct } from '@/lib/storefront';
import { getCategoryLabel, getImageUrl } from '@/lib/storefront';
import { animateProductToFloatingCart } from '@/lib/cart-fly-animation';
import { ProductCard } from '@/components/product-card';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function ProductDetailView({ product, relatedProducts }: { product: StorefrontProduct; relatedProducts: StorefrontProduct[] }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorite } = useWishlist();
  const images = product.images?.filter(Boolean) || [];
  const displayImages = images.length > 0 ? images : [getImageUrl()];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImage = displayImages[selectedImageIndex] || displayImages[0];
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isGalleryZoomed, setIsGalleryZoomed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartActionPending, setCartActionPending] = useState(false);
  const [cartActionComplete, setCartActionComplete] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const galleryDialogRef = useRef<HTMLDivElement>(null);
  const galleryCloseButtonRef = useRef<HTMLButtonElement>(null);
  const favorite = isFavorite(product.id);

  const price = useMemo(() => product.discountPrice != null && product.discountPrice < product.price ? product.discountPrice : product.price, [product]);
  const oldPrice = useMemo(() => product.discountPrice != null && product.discountPrice < product.price ? product.price : null, [product]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingAverage, setRatingAverage] = useState(product.ratingAverage ?? 0);
  const [ratingCount, setRatingCount] = useState(product.ratingCount ?? 0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const router = useRouter();
  const { user, rateProduct } = useAuth();
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user || !db) {
      setHasPurchased(false);
      return () => { active = false; };
    }

    setCheckingPurchase(true);
    const ordersQuery = query(collection(db, 'orders'), where('buyerId', '==', user.id));
    void getDocs(ordersQuery)
      .then((snapshot) => {
        if (!active) return;
        setHasPurchased(snapshot.docs.some((orderDoc) => {
          const order = orderDoc.data() as { sellerId?: string; items?: Array<{ productId?: string }> };
          return order.sellerId === product.sellerId && order.items?.some((item) => item.productId === product.id);
        }));
      })
      .catch(() => {
        if (active) setHasPurchased(false);
      })
      .finally(() => {
        if (active) setCheckingPurchase(false);
      });

    return () => { active = false; };
  }, [product.id, product.sellerId, user]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
  }, [product.id]);

  useEffect(() => {
    if (!isImageViewerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => galleryCloseButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImageViewerOpen(false);
      if (event.key === 'ArrowRight') setSelectedImageIndex((index) => (index + 1) % displayImages.length);
      if (event.key === 'ArrowLeft') setSelectedImageIndex((index) => (index - 1 + displayImages.length) % displayImages.length);
      if (event.key === 'Tab') {
        const buttons = galleryDialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
        if (!buttons?.length) return;
        const firstButton = buttons[0];
        const lastButton = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === firstButton) {
          event.preventDefault();
          lastButton.focus();
        } else if (!event.shiftKey && document.activeElement === lastButton) {
          event.preventDefault();
          firstButton.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [displayImages.length, isImageViewerOpen]);

  useEffect(() => {
    setIsGalleryZoomed(false);
  }, [selectedImageIndex]);

  const descriptionText = useMemo(() => {
    if (typeof product.description === 'string') {
      return product.description;
    }

    if (product.description && typeof product.description === 'object') {
      return product.description.english || product.description.french || product.description.spanish || '';
    }

    return '';
  }, [product.description]);

  const hasRatings = ratingCount > 0 && product.ratingAverage !== undefined;
  const discountPercent = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const shippingPolicy = product.seller?.customization?.policies?.shippingPolicy;
  const returnPolicy = product.seller?.customization?.policies?.returnPolicy;
  const isVerifiedSeller = Boolean(product.seller?.isVerifiedArtisan);
  const canDeliver = product.seller?.deliveryOptions?.includes('seller-delivery') ?? false;
  const canPickup = product.seller?.deliveryOptions?.includes('buyer-pickup') ?? false;
  const soldCountValue = Number(product.soldCount);
  const hasSoldCount = Number.isFinite(soldCountValue) && soldCountValue > 0;

  const showPreviousImage = () => setSelectedImageIndex((index) => (index - 1 + displayImages.length) % displayImages.length);
  const showNextImage = () => setSelectedImageIndex((index) => (index + 1) % displayImages.length);
  const handleGalleryTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const handleGalleryTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 45 || displayImages.length < 2) return;
    if (deltaX < 0) showNextImage();
    else showPreviousImage();
  };
  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) void navigator.share({ title: product.name, url: shareUrl });
    else void navigator.clipboard?.writeText(shareUrl);
  };
  const handleAddToCart = (source?: Element | null) => {
    if (cartActionPending || product.stock <= 0) return;
    setCartActionPending(true);
    addToCart(product as any, quantity);
    animateProductToFloatingCart(source ?? document.querySelector('[data-cart-image-source]'));
    setCartActionComplete(true);
    window.setTimeout(() => {
      setCartActionPending(false);
      setCartActionComplete(false);
    }, 700);
  };
  const handleBuyNow = () => {
    if (cartActionPending || product.stock <= 0) return;
    setCartActionPending(true);
    addToCart(product as any, quantity);
    router.push('/checkout');
  };

  const handleSubmitRating = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    if (selectedRating < 1) {
      return;
    }

    setSubmittingRating(true);

    try {
      const result = await rateProduct(product.sellerId, product.id, selectedRating, reviewText);
      setRatingAverage(result.ratingAverage);
      setRatingCount(result.ratingCount);
      setRatingSubmitted(true);
      setSelectedRating(0);
      setReviewText('');
    } catch (error: any) {
      console.error(error);
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <section className="-mx-3 sm:-mx-4 lg:mx-0" aria-label="Product image gallery">
          <div
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
            className="group relative aspect-square w-full touch-pan-y overflow-hidden bg-[#f3f4f4]"
          >
            <button type="button" data-cart-image-source className="absolute inset-0 size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1769aa]" onClick={() => setIsImageViewerOpen(true)} aria-label={`Open image gallery for ${product.name}, image ${selectedImageIndex + 1} of ${displayImages.length}`}>
              <NextImage src={getImageUrl(selectedImage)} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.015]" />
            </button>
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
              <button type="button" onClick={(event) => { event.stopPropagation(); router.back(); }} className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm" aria-label="Go back"><ArrowLeft className="size-5" /></button>
              <button type="button" onClick={(event) => { event.stopPropagation(); handleShare(); }} className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm" aria-label="Share product"><Share2 className="size-4" /></button>
            </div>
            <span className="absolute bottom-3 right-3 bg-black/65 px-2.5 py-1 text-xs font-medium tabular-nums text-white">{selectedImageIndex + 1}/{displayImages.length}</span>
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-black/55 px-2 py-1 text-[10px] font-medium text-white"><ZoomIn className="size-3" /> Tap to view</span>
          </div>

          {displayImages.length > 1 && <div className="flex gap-2 overflow-x-auto px-3 py-2 sm:px-4 lg:px-0">
            {displayImages.map((image, index) => (
              <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImageIndex(index)} aria-label={`Show image ${index + 1}`} aria-current={selectedImageIndex === index ? 'true' : undefined} className={`relative size-14 shrink-0 overflow-hidden border bg-white ${selectedImageIndex === index ? 'border-[#d65a24] ring-1 ring-[#d65a24]' : 'border-border'}`}>
                <NextImage src={getImageUrl(image)} alt={`${product.name}, image ${index + 1}`} fill sizes="56px" loading="lazy" className="object-contain p-0.5" />
              </button>
            ))}
          </div>}
          <div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 border-y border-border px-3 py-2 text-[11px] sm:px-4 lg:px-0">
            {canDeliver && <span className="inline-flex items-center gap-1.5 font-medium text-[#21744a]"><Truck className="size-3.5" />Seller delivery available</span>}
            {canPickup && <span className="inline-flex items-center gap-1.5 font-medium text-[#21744a]"><Check className="size-3.5" />Pickup available</span>}
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="size-3.5 text-[#21744a]" />Buyer protection</span>
            {!canDeliver && !canPickup && <span className="text-muted-foreground">Delivery options confirmed by seller after checkout</span>}
          </div>
        </section>

        <section className="space-y-3" aria-label="Product purchase information">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <span>{getCategoryLabel(product.categoryId)}</span>
              {oldPrice && <span className="bg-[#fff1eb] px-2 py-1 text-[#bd4a1c]">-{discountPercent}% · SALE</span>}
            </div>
            <h1 className="mt-1 text-lg font-semibold leading-6 text-foreground sm:text-xl">{product.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {hasRatings ? <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-[#d19b2d] text-[#d19b2d]" /><strong className="text-foreground">{ratingAverage.toFixed(1)}</strong><span>· {ratingCount.toLocaleString()} {ratingCount === 1 ? 'review' : 'reviews'}</span></span> : <span>No reviews yet</span>}
              {hasSoldCount && <span>{soldCountValue.toLocaleString()} sold</span>}
              {product.stock > 0 && product.stock <= 5 && <span className="font-semibold text-[#b42318]">Only {product.stock} left</span>}
              {product.stock <= 0 && <span className="font-semibold text-[#b42318]">Out of stock</span>}
            </div>
          </div>

          <div className="border-y border-border py-2.5">
            <div className="text-2xl font-bold leading-8 text-foreground">GH₵{price.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            {oldPrice && <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
              <span className="text-muted-foreground line-through">GH₵{oldPrice.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="font-semibold text-[#bd4a1c]">-{discountPercent}%</span>
              <span className="text-muted-foreground">Discounted price</span>
            </div>}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex h-9 items-center border px-2 text-sm">
              <span className="mr-1.5 text-[11px] text-muted-foreground">Qty</span>
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="size-7" aria-label="Decrease quantity">−</button>
              <span className="min-w-7 text-center text-xs font-semibold">{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => Math.min(Math.max(product.stock, 1), value + 1))} className="size-7" aria-label="Increase quantity" disabled={quantity >= product.stock}>+</button>
            </div>
            <p className="text-right text-[10px] text-muted-foreground">{product.stock > 0 ? `${product.stock} available` : 'Currently unavailable'}</p>
          </div>
        </section>
      </div>

      <section className="border-y border-border py-3" aria-label="Seller and delivery policies">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={`/store/${product.sellerId}`} className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold hover:text-primary">
            <Store className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Sold by {product.sellerName || 'Agora seller'}</span>
          </Link>
          {isVerifiedSeller && <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-700"><BadgeCheck className="size-4" /> Verified seller</span>}
          {product.seller?.followerCount ? <span className="text-[11px] text-muted-foreground">{product.seller.followerCount.toLocaleString()} followers</span> : null}
        </div>
        {(shippingPolicy || returnPolicy) && <div className="mt-2 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
          {shippingPolicy && <p><strong className="font-semibold text-foreground">Shipping: </strong>{shippingPolicy}</p>}
          {returnPolicy && <p><strong className="font-semibold text-foreground">Returns: </strong>{returnPolicy}</p>}
        </div>}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr] lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{descriptionText}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {(product.specifications || []).map((spec) => (
                <div key={spec.name} className="rounded-xl border bg-muted/30 p-3">
                  <div className="font-medium text-foreground">{spec.name}</div>
                  <div>{spec.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {hasPurchased && !checkingPurchase ? <Card>
            <CardHeader>
              <CardTitle>Rate this product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Share your experience with other buyers.</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedRating(value)}
                    className={`rounded-full p-2 transition ${value <= selectedRating ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  >
                    <Star className="size-5" />
                  </button>
                ))}
              </div>
              <Textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Tell other buyers what you liked..."
                className="min-h-[120px]"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground">{ratingSubmitted ? 'Thanks for rating this product!' : 'Purchase this product to leave a review.'}</span>
                <Button onClick={handleSubmitRating} disabled={submittingRating || selectedRating === 0}>
                  {submittingRating ? 'Submitting...' : 'Submit rating'}
                </Button>
              </div>
            </CardContent>
          </Card> : null}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Related products</h2>
            <Link href="/search" className="text-sm text-primary hover:underline">Browse all</Link>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <div key={item.id} className="min-w-0"><ProductCard product={item} /></div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-white/95 px-3 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:bottom-0 md:py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-xs font-medium text-muted-foreground">{product.name}</p>
            <p className="text-sm font-bold">GH₵{price.toFixed(2)}</p>
          </div>
          <button type="button" onClick={() => toggleWishlist(product)} className="inline-flex size-10 shrink-0 items-center justify-center border border-border text-foreground" aria-label={favorite ? 'Remove from wishlist' : 'Add to wishlist'} title={favorite ? 'Remove from wishlist' : 'Add to wishlist'}>
            <Heart className={`size-4 ${favorite ? 'fill-current text-[#b42318]' : ''}`} />
          </button>
          <button type="button" onClick={() => handleAddToCart()} disabled={product.stock <= 0 || cartActionPending} aria-live="polite" className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-[#bd4a1c] px-3 text-xs font-semibold text-[#bd4a1c] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-5">
            {cartActionComplete ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
            {cartActionComplete ? 'Added' : 'Add to cart'}
          </button>
          <button type="button" onClick={handleBuyNow} disabled={product.stock <= 0 || cartActionPending} className="inline-flex h-10 flex-1 items-center justify-center bg-[#d65a24] px-3 text-xs font-semibold text-white hover:bg-[#bd4a1c] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-6">
            {cartActionPending && !cartActionComplete ? 'Adding…' : 'Buy now'}
          </button>
        </div>
      </div>

      {isImageViewerOpen && <div ref={galleryDialogRef} className="fixed inset-0 z-[100] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label={`${product.name} image gallery`}>
        <div className="flex h-14 shrink-0 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
          <button ref={galleryCloseButtonRef} type="button" onClick={() => setIsImageViewerOpen(false)} className="inline-flex size-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10" aria-label="Close image gallery"><X className="size-5" /></button>
          <span className="text-xs font-medium tabular-nums text-white/85">{selectedImageIndex + 1}/{displayImages.length}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setIsGalleryZoomed((zoomed) => !zoomed)} className="inline-flex size-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10" aria-label={isGalleryZoomed ? 'Zoom out' : 'Zoom image'}>{isGalleryZoomed ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}</button>
            <button type="button" onClick={handleShare} className="inline-flex size-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10" aria-label="Share product"><Share2 className="size-4" /></button>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden touch-pan-y" onTouchStart={handleGalleryTouchStart} onTouchEnd={handleGalleryTouchEnd} onDoubleClick={() => setIsGalleryZoomed((zoomed) => !zoomed)}>
          <NextImage src={getImageUrl(selectedImage)} alt={product.name} fill priority={selectedImageIndex === 0} sizes="100vw" className={`object-contain p-1 transition-transform duration-200 ${isGalleryZoomed ? 'scale-[1.75]' : 'scale-100'}`} />
          {displayImages.length > 1 && <>
            <button type="button" onClick={showPreviousImage} className="absolute left-2 inline-flex size-10 items-center justify-center rounded-full bg-black/35 text-white/80" aria-label="Previous image"><ChevronLeft className="size-6" /></button>
            <button type="button" onClick={showNextImage} className="absolute right-2 inline-flex size-10 items-center justify-center rounded-full bg-black/35 text-white/80" aria-label="Next image"><ChevronRight className="size-6" /></button>
          </>}
        </div>
        <div className="shrink-0 border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 truncate text-center text-xs text-white/70">{product.name}</p>
          <button type="button" onClick={() => { handleAddToCart(galleryDialogRef.current?.querySelector('img')); setIsImageViewerOpen(false); }} disabled={product.stock <= 0 || cartActionPending} aria-label={product.stock <= 0 ? 'Product is out of stock' : 'Add product to cart'} className="mx-auto flex h-12 w-full max-w-2xl items-center justify-center gap-2 bg-[#d65a24] px-4 text-sm font-semibold text-white transition hover:bg-[#bd4a1c] disabled:cursor-not-allowed disabled:opacity-50" aria-live="polite">
            {cartActionComplete ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
            {product.stock <= 0 ? 'Out of stock' : cartActionComplete ? 'Added to cart' : 'Add to cart'}
          </button>
        </div>
      </div>}
    </div>
  );
}
