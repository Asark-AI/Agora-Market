'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Filter, RefreshCw, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { getCategoryLabel, getImageUrl, type StorefrontProduct } from '@/lib/storefront';
import type { Seller } from '@/lib/types';

type MarketplaceProductsBrowserProps = {
  initialProducts: StorefrontProduct[];
  categories: Array<{ id: string; name: string }>;
  sellers: Seller[];
};

const BATCH_SIZE = 8;

type SortValue = 'popular' | 'price-low' | 'price-high' | 'discount';

export function MarketplaceProductsBrowser({ initialProducts, categories, sellers }: MarketplaceProductsBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortValue>('popular');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const max = Number(maxPrice);

    return initialProducts
      .filter((product) => {
        const seller = sellers.find((entry) => entry.id === product.sellerId);
        const price = product.discountPrice ?? product.price;
        const matchesSearch = !query || [product.name, product.sellerName, product.description, getCategoryLabel(product.categoryId)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
        const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
        const matchesSeller = !selectedSeller || product.sellerId === selectedSeller;
        const matchesPrice = !maxPrice || Number.isNaN(max) || price <= max;
        const matchesVerified = !verifiedOnly || seller?.isVerifiedArtisan;

        return matchesSearch && matchesCategory && matchesSeller && matchesPrice && matchesVerified;
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
  }, [initialProducts, maxPrice, searchTerm, selectedCategory, selectedSeller, sellers, sortBy, verifiedOnly]);

  useEffect(() => {
    setVisibleCount(Math.min(BATCH_SIZE, filteredProducts.length));
  }, [filteredProducts.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + BATCH_SIZE, filteredProducts.length));
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredProducts.length]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSeller('');
    setMaxPrice('');
    setVerifiedOnly(false);
    setSortBy('popular');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border bg-muted/30 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Marketplace</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">Browse products your way</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Filter by category, seller, price and trust signals, then keep scrolling for more curated picks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={resetFilters}>
              <RefreshCw className="mr-2 size-4" /> Reset
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products or sellers" className="h-11 rounded-full pl-9" />
          </div>
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="h-11 rounded-full border border-input bg-background px-3 text-sm">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select value={selectedSeller} onChange={(event) => setSelectedSeller(event.target.value)} className="h-11 rounded-full border border-input bg-background px-3 text-sm">
            <option value="">All sellers</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>{seller.name}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortValue)} className="h-11 rounded-full border border-input bg-background px-3 text-sm">
            <option value="popular">Popular</option>
            <option value="price-low">Lowest price</option>
            <option value="price-high">Highest price</option>
            <option value="discount">Biggest discount</option>
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm">
              <span>Max price</span>
              <Input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="GH₵" className="h-8 w-20 rounded-full border-none bg-transparent px-0 shadow-none" />
            </label>
            <label className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm">
              <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              Verified sellers
            </label>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Filter className="size-4 text-primary" /> {filteredProducts.length} matching products
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" /> Quick filters
              </div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border bg-muted/40 p-3">
                  <div className="font-medium text-foreground">Curated discovery</div>
                  <p className="mt-1">Search faster, filter cleaner, and keep shopping without friction.</p>
                </div>
                <div className="rounded-2xl border bg-muted/40 p-3">
                  <div className="font-medium text-foreground">Trusted sellers</div>
                  <p className="mt-1">Prioritize verified merchants for a more secure experience.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          {visibleProducts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center text-muted-foreground">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <SlidersHorizontal className="size-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-foreground">No products match that filter yet</h2>
                <p className="mt-2">Try widening your price range or clearing a filter to see more listings.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  <div className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground">Loading more products…</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
