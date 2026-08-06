'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CheckCircle2, Filter, Mic, Search, ShieldCheck, ShoppingCart, Sparkles, Star, Truck, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { useCart } from '@/hooks/use-cart';
import { getCategoryLabel, type StorefrontProduct } from '@/lib/storefront';
import type { Seller } from '@/lib/types';

type MarketplaceProductsBrowserProps = {
  initialProducts: StorefrontProduct[];
  categories: Array<{ id: string; name: string }>;
  sellers: Seller[];
};

const BATCH_SIZE = 10;

type SortValue = 'popular' | 'price-low' | 'price-high' | 'discount';
type ConditionOption = 'new' | 'used' | '';
type DeliveryOption = 'fast' | 'free' | '';
type RatingFilterOption = '4+' | '3+' | '2+' | '';

type TrustChip = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function MarketplaceProductsBrowser({ initialProducts, categories, sellers }: MarketplaceProductsBrowserProps) {
  const { items: cartItems } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('');
  const [sortBy, setSortBy] = useState<SortValue>('popular');
  const [maxPrice, setMaxPrice] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'flash' | 'trending' | 'best' | 'new' | 'popular' | 'rated' | 'shipping' | 'discount'>('all');
  const [condition, setCondition] = useState<ConditionOption>('');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilterOption>('4+');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  const trustChips: TrustChip[] = [
    {
      label: 'Verified Sellers',
      active: verifiedOnly,
      onClick: () => setVerifiedOnly((current) => !current),
    },
    {
      label: 'Free Shipping',
      active: selectedFilter === 'shipping',
      onClick: () => setSelectedFilter((current) => (current === 'shipping' ? 'all' : 'shipping')),
    },
    {
      label: 'Flash Deals',
      active: selectedFilter === 'flash',
      onClick: () => setSelectedFilter((current) => (current === 'flash' ? 'all' : 'flash')),
    },
    {
      label: '4+ Rating',
      active: selectedFilter === 'rated',
      onClick: () => setSelectedFilter((current) => (current === 'rated' ? 'all' : 'rated')),
    },
  ];

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
    <div className="space-y-6 pb-28 md:pb-12">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 px-4 py-4 backdrop-blur-sm shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">A</div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Agora</p>
              <p className="text-lg font-semibold">Marketplace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative inline-flex items-center rounded-2xl border border-border/80 bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/80 hover:text-primary">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart
              <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{cartItems.length}</span>
            </Link>
            <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-background text-muted-foreground sm:flex">
              <span className="text-lg">👤</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="rounded-[28px] border border-border/70 bg-muted/40 p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products, brands, categories..."
              className="h-12 rounded-full border border-border/70 bg-background/95 pl-12 pr-14 text-sm"
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 p-2 text-primary transition hover:bg-primary/20">
              <Mic className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Popular:</span>
            {suggestionChips.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setSearchTerm(term)}
                className="rounded-full border border-border/70 bg-background px-3 py-2 text-sm transition hover:border-primary/80 hover:text-primary"
              >
                {term}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {categoryChips.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id || 'all'}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`min-w-[92px] rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border/70 bg-background text-foreground hover:border-primary/80 hover:text-primary'}`}
              >
                {category.name}
              </button>
            );
          })}
        </section>

        <section className="sticky top-[5.5rem] z-20 mt-4 bg-background/95 px-0 py-3 backdrop-blur-sm sm:top-[6.25rem]">
          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border/70 bg-background/90 px-3 py-3 shadow-sm sm:grid-cols-[1fr_auto_auto]">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>All Products</span>
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{filteredProducts.length} items</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/80 hover:text-primary"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/80 hover:text-primary"
              onClick={cycleSort}
            >
              Sort <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="mt-4 flex flex-wrap gap-2">
          {trustChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.onClick}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${chip.active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border/70 bg-background text-foreground hover:border-primary/80 hover:text-primary'}`}
            >
              {chip.label}
            </button>
          ))}
        </section>

        <section className="mt-4">
          {visibleProducts.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-border/70 bg-background p-8 text-center text-muted-foreground">
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {isLoadingMore && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-sm">
                  <div className="aspect-[4/5] animate-pulse bg-muted/70" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted/70" />
                    <div className="h-5 w-full animate-pulse rounded-full bg-muted/70" />
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted/70" />
                    <div className="h-8 w-20 animate-pulse rounded-full bg-muted/70" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div ref={sentinelRef} className="mt-5 flex justify-center py-5 text-sm text-muted-foreground">
              Scroll to load more products
            </div>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 py-3 shadow-[0_-14px_32px_-24px_rgba(15,23,42,0.35)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            className="flex-1 rounded-full border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/80 hover:text-primary"
            onClick={() => setIsFilterOpen(true)}
          >
            Filter
          </button>
          <button
            type="button"
            className="flex-1 rounded-full border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/80 hover:text-primary"
            onClick={cycleSort}
          >
            Sort
          </button>
        </div>
      </div>

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
