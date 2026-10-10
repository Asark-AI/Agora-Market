'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, CheckCircle2, Filter, Search, Truck, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { ProductCardSkeleton } from '@/components/loading-skeletons';
import { getCategoryLabel, type StorefrontProduct } from '@/lib/storefront';
import type { Seller } from '@/lib/types';

type MarketplaceProductsBrowserProps = {
  initialProducts: StorefrontProduct[];
  categories: Array<{ id: string; name: string }>;
  sellers: Seller[];
  initialQuery: string;
};

const BATCH_SIZE = 10;

type SortValue = 'popular' | 'price-low' | 'price-high' | 'discount';
type ConditionOption = 'new' | 'used' | '';
type DeliveryOption = 'fast' | 'free' | '';
type RatingFilterOption = '4+' | '3+' | '2+' | '';

export function MarketplaceProductsBrowser({ initialProducts, categories, sellers, initialQuery }: MarketplaceProductsBrowserProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('');
  const [sortBy, setSortBy] = useState<SortValue>('popular');
  const [maxPrice, setMaxPrice] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'flash' | 'trending' | 'best' | 'new' | 'popular' | 'rated' | 'shipping' | 'discount'>('all');
  const [condition, setCondition] = useState<ConditionOption>('');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilterOption>('');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  const categoryChips = useMemo(() => [{ id: '', name: 'All' }, ...categories.slice(0, 8)], [categories]);
  const suggestionChips = ['Smartphones', 'Audio', 'Gaming', 'Accessories', 'Home essentials', 'Fashion'];
  const filterChips = useMemo(
    () => [
      { id: 'all', label: 'All' },
      { id: 'flash', label: 'Flash Deals' },
      { id: 'trending', label: 'Trending' },
      { id: 'best', label: 'Best Sellers' },
      { id: 'new', label: 'New Arrivals' },
      { id: 'popular', label: 'Most Popular' },
      { id: 'rated', label: 'Top Rated' },
      { id: 'shipping', label: 'Free Shipping' },
      { id: 'discount', label: 'Discounted' },
    ],
    []
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const max = Number(maxPrice);

    return initialProducts
      .filter((product) => {
        const seller = sellers.find((entry) => entry.id === product.sellerId);
        const price = product.discountPrice ?? product.price;
        const matchesSearch =
          !query ||
          [product.name, product.sellerName, product.description, getCategoryLabel(product.categoryId)]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query);
        const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
        const matchesSeller = !selectedSeller || product.sellerId === selectedSeller;
        const matchesPrice = !maxPrice || Number.isNaN(max) || price <= max;
        const matchesVerified = !verifiedOnly || seller?.isVerifiedArtisan;
        const matchesRating = !ratingFilter || Number(product.ratingAverage ?? 0) >= Number(ratingFilter[0]);
        const productRecord = product as StorefrontProduct & { condition?: ConditionOption; shippingPolicy?: string; deliveryOption?: DeliveryOption };
        const matchesCondition = !condition || productRecord.condition === condition;
        const matchesDelivery = !deliveryOption || productRecord.deliveryOption === deliveryOption || productRecord.shippingPolicy?.toLowerCase().includes(deliveryOption === 'free' ? 'free' : 'fast');
        const matchesFilter = (() => {
          switch (selectedFilter) {
            case 'flash':
              return !!product.discountPrice && product.discountPrice < product.price;
            case 'trending':
              return (product.views || 0) > 40;
            case 'best':
              return (product.views || 0) > 120;
            case 'new':
              return (product.views || 0) < 80;
            case 'popular':
              return (product.views || 0) > 80;
            case 'rated':
              return Boolean((product.ratingAverage ?? 0) >= 4 || seller?.trustScore);
            case 'shipping':
              return true;
            case 'discount':
              return Boolean(product.discountPrice && product.discountPrice < product.price);
            case 'all':
            default:
              return true;
          }
        })();

        return (
          matchesSearch &&
          matchesCategory &&
          matchesSeller &&
          matchesPrice &&
          matchesVerified &&
          matchesRating &&
          matchesCondition &&
          matchesDelivery &&
          matchesFilter
        );
      })
      .sort((a, b) => {
        const aPrice = a.discountPrice ?? a.price;
        const bPrice = b.discountPrice ?? b.price;
        const aDiscount = a.price > 0 ? ((a.price - aPrice) / a.price) * 100 : 0;
        const bDiscount = b.price > 0 ? ((b.price - bPrice) / b.price) * 100 : 0;

        switch (sortBy) {
          case 'price-low':
            return aPrice - bPrice;
          case 'price-high':
            return bPrice - aPrice;
          case 'discount':
            return bDiscount - aDiscount;
          case 'popular':
          default:
            return (b.views || 0) - (a.views || 0);
        }
      });
  }, [
    initialProducts,
    maxPrice,
    searchTerm,
    selectedCategory,
    selectedSeller,
    sellers,
    selectedFilter,
    sortBy,
    verifiedOnly,
    ratingFilter,
    condition,
    deliveryOption,
  ]);

  useEffect(() => {
    setVisibleCount(Math.min(BATCH_SIZE, filteredProducts.length));
  }, [filteredProducts.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore && visibleCount < filteredProducts.length) {
          setIsLoadingMore(true);
          window.setTimeout(() => {
            setVisibleCount((current) => Math.min(current + BATCH_SIZE, filteredProducts.length));
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredProducts.length, isLoadingMore, visibleCount]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const resetFilters = () => {
    router.replace('/products', { scroll: false });
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSeller('');
    setMaxPrice('');
    setVerifiedOnly(false);
    setSelectedFilter('all');
    setSortBy('popular');
    setCondition('');
    setDeliveryOption('');
    setRatingFilter('4+');
  };

  const cycleSort = () => {
    setSortBy((current) => {
      if (current === 'popular') return 'price-low';
      if (current === 'price-low') return 'price-high';
      if (current === 'price-high') return 'discount';
      return 'popular';
    });
  };

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden bg-gradient-to-r from-[#17191B] via-[#111315] to-[#0B0D0F] px-4 py-7 sm:px-6 sm:py-9">
        <div className="relative mx-auto max-w-7xl">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[11px]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(212,167,44,0.65)]" />
            Agora marketplace
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">Shop the collection</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Explore everyday essentials, standout finds, and more.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="py-3 sm:py-4">
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Try:</span>
            {suggestionChips.map((term) => (
              <Link
                key={term}
                href={`/products?q=${encodeURIComponent(term)}`}
                className="border-b border-transparent py-1 transition hover:border-primary hover:text-primary"
              >
                {term}
              </Link>
            ))}
          </div>
        </section>

        <section className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryChips.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id || 'all'}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_18px_rgba(212,167,44,0.16)]' : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary'}`}
              >
                {category.name}
              </button>
            );
          })}
        </section>

        <section className="py-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="col-span-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground sm:col-span-1">
              <span>All Products</span>
              <span className="text-xs font-normal text-muted-foreground">{filteredProducts.length} items</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
              onClick={cycleSort}
            >
              Sort <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="pt-1">
          {visibleProducts.length === 0 ? (
            <div className="agora-card rounded-2xl border-dashed p-8 text-center text-muted-foreground">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">No matching products yet</h2>
              <p className="mt-2 text-sm">Try broadening your search or clearing filters to reveal fresh items.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex items-center justify-center rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reset filters
              </button>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <div key={product.id} className="min-w-0"><ProductCard product={product} /></div>
              ))}
            </div>
          )}

          {isLoadingMore && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)}
            </div>
          )}

          {hasMore && (
            <div ref={sentinelRef} className="mt-5 flex justify-center py-5 text-sm text-muted-foreground">
              Scroll to load more products
            </div>
          )}
        </section>
      </main>

      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-[32px] px-5 pb-6 pt-8">
          <SheetHeader>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <SheetTitle>Refine results</SheetTitle>
                <p className="mt-1 text-sm text-muted-foreground">Tap filters to shape the feed fast.</p>
              </div>
              <button type="button" onClick={resetFilters} className="text-sm font-semibold text-primary">Reset</button>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 8).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`rounded-full border px-4 py-3 text-sm transition ${selectedCategory === category.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 bg-background text-foreground hover:border-primary/80 hover:text-primary'}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Sellers</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {sellers.slice(0, 6).map((seller) => (
                  <button
                    key={seller.id}
                    type="button"
                    onClick={() => setSelectedSeller((current) => (current === seller.id ? '' : seller.id))}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm ${selectedSeller === seller.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 bg-background text-foreground hover:border-primary/80'}`}
                  >
                    <div className="font-semibold">{seller.name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{seller.isVerifiedArtisan ? 'Verified artisan' : 'Trusted partner'}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Price</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl border border-border/70 bg-background p-3 text-sm">
                  <span className="block text-xs text-muted-foreground">Max price</span>
                  <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="GH₵ 0"
                    className="mt-2 w-full rounded-2xl border border-border/70 bg-muted/10 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <div className="rounded-2xl border border-border/70 bg-background p-3 text-sm">
                  <span className="block text-xs text-muted-foreground">Price cap</span>
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    value={Number(maxPrice) || 1000}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    className="mt-3 w-full"
                  />
                  <div className="mt-3 text-sm text-foreground">Up to GH₵{Number(maxPrice) || 1000}</div>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Product condition</p>
              <div className="flex flex-wrap gap-2">
                {(['new', 'used'] as ConditionOption[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCondition((current) => (current === option ? '' : option))}
                    className={`rounded-full border px-4 py-2 text-sm ${condition === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 bg-background text-foreground hover:border-primary/80 hover:text-primary'}`}
                  >
                    {option === 'new' ? 'New' : 'Used'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Delivery</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDeliveryOption((current) => (current === 'fast' ? '' : 'fast'))}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm ${deliveryOption === 'fast' ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 bg-background text-foreground hover:border-primary/80'}`}
                >
                  <div className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> Fast delivery</div>
                  <p className="mt-1 text-xs text-muted-foreground">24–48 hrs where available.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryOption((current) => (current === 'free' ? '' : 'free'))}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm ${deliveryOption === 'free' ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 bg-background text-foreground hover:border-primary/80'}`}
                >
                  <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> Free shipping</div>
                  <p className="mt-1 text-xs text-muted-foreground">No delivery fees.</p>
                </button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Rating</p>
              <div className="flex flex-wrap gap-2">
                {(['4+', '3+', '2+'] as RatingFilterOption[]).map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setRatingFilter((current) => (current === rating ? '' : rating))}
                    className={`rounded-full border px-4 py-2 text-sm ${ratingFilter === rating ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 bg-background text-foreground hover:border-primary/80 hover:text-primary'}`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Apply Filters
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
