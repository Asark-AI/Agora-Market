'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Filter, ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import type { StorefrontProduct } from '@/lib/storefront';

type FlashDealsBrowserProps = {
  products: StorefrontProduct[];
  categories: Array<{ id: string; name: string }>;
};

type DealFilter = 'all' | 'half-off' | 'under-100' | 'electronics';
type SortOption = 'featured' | 'price-low' | 'discount';

export function FlashDealsBrowser({ products, categories }: FlashDealsBrowserProps) {
  const { items } = useCart();
  const [filter, setFilter] = useState<DealFilter>('all');
  const [sort, setSort] = useState<SortOption>('featured');
  const [query, setQuery] = useState('');
  const filterRowRef = useRef<HTMLDivElement>(null);

  const dealProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products
      .filter((product) => product.discountPrice !== undefined && product.discountPrice < product.price)
      .filter((product) => {
        const price = product.discountPrice ?? product.price;
        const discount = product.price > 0 ? ((product.price - price) / product.price) * 100 : 0;
        const matchesQuery = !search || product.name.toLowerCase().includes(search);
        const matchesFilter = filter === 'all'
          || (filter === 'half-off' && discount >= 50)
          || (filter === 'under-100' && price < 100)
          || (filter === 'electronics' && categories.some((category) => category.id === product.categoryId && category.name.toLowerCase().includes('elect')));
        return matchesQuery && matchesFilter;
      })
      .sort((left, right) => {
        const leftPrice = left.discountPrice ?? left.price;
        const rightPrice = right.discountPrice ?? right.price;
        if (sort === 'price-low') return leftPrice - rightPrice;
        if (sort === 'discount') return ((right.price - (right.discountPrice ?? right.price)) / right.price) - ((left.price - leftPrice) / left.price);
        return (right.views ?? 0) - (left.views ?? 0);
      });
  }, [categories, filter, products, query, sort]);

  const filterOptions: Array<{ id: DealFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'half-off', label: '50%+ Off' },
    { id: 'under-100', label: 'Under GH₵100' },
    { id: 'electronics', label: 'Electronics' },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 md:pb-12">
      <header className="flex h-16 items-center justify-between border-b border-border/70">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground"><ArrowLeft className="size-4" /> Back</Link>
        <h1 className="text-base font-semibold">Flash Deals</h1>
        <Link href="/cart" className="relative inline-flex size-9 items-center justify-center" aria-label={`Cart with ${items.length} items`}><ShoppingCart className="size-5" />{items.length > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{items.length}</span>}</Link>
      </header>

      <section className="border-b border-border/70 py-5">
        <h2 className="text-2xl font-semibold tracking-tight">⚡ Flash Deals</h2>
        <p className="mt-1 text-sm text-muted-foreground">Limited-time prices while stock lasts.</p>
        <div className="mt-4 max-w-md"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search deals" className="h-10" /></div>
      </section>

      <div ref={filterRowRef} className="-mx-4 flex gap-2 overflow-x-auto border-b border-border/70 px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Deal filters">
        {filterOptions.map((option) => <button key={option.id} type="button" onClick={() => setFilter(option.id)} className={`shrink-0 border px-3 py-1.5 text-xs font-medium transition ${filter === option.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary'}`}>{option.label}</button>)}
      </div>

      <div className="flex h-14 items-center justify-between border-b border-border/70">
        <p className="text-sm text-muted-foreground">{dealProducts.length} {dealProducts.length === 1 ? 'deal' : 'deals'}</p>
        <div className="flex items-center gap-2"><button type="button" onClick={() => setSort((current) => current === 'featured' ? 'price-low' : current === 'price-low' ? 'discount' : 'featured')} className="inline-flex items-center gap-1 text-sm font-medium">Sort: {sort === 'featured' ? 'Featured' : sort === 'price-low' ? 'Price' : 'Discount'} <ChevronDown className="size-4" /></button><button type="button" onClick={() => filterRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })} className="inline-flex items-center gap-1 border-l border-border pl-3 text-sm font-medium"><Filter className="size-4" /> Filter</button></div>
      </div>

      {dealProducts.length > 0 ? <div className="grid grid-cols-2 gap-2.5 pt-4 sm:grid-cols-3 lg:grid-cols-4">{dealProducts.map((product) => <ProductCard key={product.id} product={product} dealMode />)}</div> : <div className="border-b border-border py-20 text-center"><p className="text-base font-semibold">⚡ No Flash Deals right now</p><p className="mt-2 text-sm text-muted-foreground">Check back soon for limited-time offers.</p><Link href="/products" className="mt-5 inline-flex text-sm font-semibold text-primary">Continue shopping</Link></div>}
    </main>
  );
}