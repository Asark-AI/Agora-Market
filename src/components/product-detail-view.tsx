'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Heart, ShoppingCart, Star, Truck, ShieldCheck, RotateCcw, Share2, Store, BadgeCheck, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import type { StorefrontProduct } from '@/lib/storefront';
import { buildProductSlug, buildSellerSlug, getCategoryLabel, getImageUrl } from '@/lib/storefront';

export function ProductDetailView({ product, relatedProducts }: { product: StorefrontProduct; relatedProducts: StorefrontProduct[] }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorite } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const favorite = isFavorite(product.id);

  const price = useMemo(() => product.discountPrice ?? product.price, [product]);
  const oldPrice = useMemo(() => (product.discountPrice ? product.price : null), [product]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingAverage, setRatingAverage] = useState(product.ratingAverage ?? 0);
  const [ratingCount, setRatingCount] = useState(product.ratingCount ?? 0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const router = useRouter();
  const { user, rateProduct } = useAuth();

  const descriptionText = useMemo(() => {
    if (typeof product.description === 'string') {
      return product.description;
    }

    if (product.description && typeof product.description === 'object') {
      return product.description.english || product.description.french || product.description.spanish || '';
    }

    return '';
  }, [product.description]);

  const displayRating = ratingCount > 0 ? ratingAverage : 4.8;
  const displayReviewText = ratingCount > 0 ? `${ratingCount} review${ratingCount === 1 ? '' : 's'}` : 'No reviews yet';

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
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-[24px] border bg-muted">
            <Image src={getImageUrl(selectedImage)} alt={product.name} fill className="object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(product.images || []).slice(0, 4).map((image, index) => (
              <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(image)} className={`relative aspect-square overflow-hidden rounded-xl border ${selectedImage === image ? 'ring-2 ring-primary' : ''}`}>
                <Image src={getImageUrl(image)} alt={`${product.name} view ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">{getCategoryLabel(product.categoryId)}</div>
            <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="size-4 fill-current" />
                <span className="font-semibold text-foreground">{displayRating.toFixed(1)}</span>
              </div>
              <span>• {displayReviewText}</span>
              <span>• {product.stock > 0 ? 'In stock' : 'Out of stock'}</span>
            </div>
          </div>

          <div className="rounded-[24px] border bg-muted/40 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-3xl font-semibold">GH₵{price.toFixed(2)}</span>
              {oldPrice && <span className="text-lg text-muted-foreground line-through">GH₵{oldPrice.toFixed(2)}</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Free shipping on orders above GH₵200 • Express delivery available</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center rounded-full border px-3 py-2 text-sm">
              <span className="mr-2 font-medium">Qty</span>
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-7 w-7 rounded-full bg-muted">−</button>
              <span className="mx-3 min-w-6 text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-7 w-7 rounded-full bg-muted">+</button>
            </div>
            <Button size="lg" onClick={() => addToCart(product as any)}>
              <ShoppingCart className="mr-2 size-4" /> Add to cart
            </Button>
            <Button size="lg" variant="outline" onClick={() => toggleWishlist(product)}>
              <Heart className={`mr-2 size-4 ${favorite ? 'fill-current text-primary' : ''}`} /> Wishlist
            </Button>
            <Button size="icon" variant="outline" aria-label="Share product">
              <Share2 className="size-4" />
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Estimated delivery 2–4 business days</div>
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Secure checkout with buyer protection</div>
              <div className="flex items-center gap-2"><RotateCcw className="size-4 text-primary" /> Easy return policy within 7 days</div>
            </CardContent>
          </Card>

          <div className="rounded-[24px] border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Sold by</p>
                <Link href={`/store/${buildSellerSlug({ id: product.sellerId, name: product.sellerName || 'Seller' })}`} className="text-primary hover:underline">
                  {product.sellerName || 'Verified Seller'}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><BadgeCheck className="size-4 text-primary" /> 4.9 seller rating</div>
                <div className="mt-1 flex items-center gap-1"><Store className="size-4" /> 1.2k followers</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/store/${buildSellerSlug({ id: product.sellerId, name: product.sellerName || 'Seller' })}`}><Store className="mr-2 size-4" /> Visit store</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/sign-in"><MessageCircle className="mr-2 size-4" /> Message seller</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
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
          <Card>
            <CardHeader>
              <CardTitle>Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border bg-muted/30 p-3">Premium quality with reliable local delivery.</div>
              <div className="rounded-2xl border bg-muted/30 p-3">Fast response from seller and transparent shipping.</div>
              <div className="rounded-2xl border bg-muted/30 p-3">Highly rated and frequently restocked.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate this product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Share a star rating and optional buyer review to help others choose wisely.</p>
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
                <span className="text-sm text-muted-foreground">{ratingSubmitted ? 'Thanks for rating this product!' : 'You can rate once per product.'}</span>
                <Button onClick={handleSubmitRating} disabled={submittingRating || selectedRating === 0}>
                  {submittingRating ? 'Submitting...' : 'Submit rating'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Related products</h2>
            <Link href="/search" className="text-sm text-primary hover:underline">Browse all</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedProducts.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <Link href={`/product/${buildProductSlug(item)}`}>
                  <div className="relative aspect-square">
                    <Image src={getImageUrl(item.images?.[0])} alt={item.name} fill className="object-cover" />
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/product/${buildProductSlug(item)}`} className="font-medium hover:text-primary">{item.name}</Link>
                  <div className="mt-2 text-sm font-semibold">GH₵{(item.discountPrice ?? item.price).toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
