import { getActiveProducts, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import { ExploreDiscovery, type ExploreShortcut } from '@/components/explore-discovery';
import { SearchModes } from '@/components/search-modes';
import { getPublicSolutionDefinitions } from '@/lib/server/solutions';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const broadCategories = [
  { id: 'electronics', label: 'Electronics', match: ['electronics'] },
  { id: 'mobile', label: 'Phones & Tablets', match: ['mobile phones & tablets'] },
  { id: 'fashion', label: 'Fashion', match: ['fashion'] },
  { id: 'home', label: 'Home & Living', match: ['home'] },
  { id: 'beauty', label: 'Beauty', match: ['beauty'] },
  { id: 'automotive', label: 'Automotive', match: ['vehicles'] },
  { id: 'groceries', label: 'Groceries', match: ['groceries'] },
  { id: 'tools', label: 'Tools & Hardware', match: ['tools', 'hardware'] },
  { id: 'sports', label: 'Sports', match: ['sports'] },
  { id: 'kids', label: 'Kids', match: ['kids'] },
];

function belongsToBroadCategory(categoryId: string, broadCategory: typeof broadCategories[number], categories: ReturnType<typeof getCategoryOptions>) {
  const category = categories.find((option) => option.id === categoryId);
  const parent = category?.parent?.toLowerCase() || '';
  return broadCategory.match.some((term) => parent.includes(term));
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const [loadedProducts, solutions] = await Promise.all([
    getActiveProducts().catch((error: unknown) => {
      console.error('Unable to load Explore products:', error);
      return [];
    }),
    getPublicSolutionDefinitions().catch((error: unknown) => {
      console.error('Unable to load Explore solution templates:', error);
      return [];
    }),
  ]);
  const products = loadedProducts.filter((product) => {
    const isValid = Boolean(
      product
      && typeof product.id === 'string'
      && typeof product.name === 'string'
      && typeof product.price === 'number'
      && Number.isFinite(product.price)
      && typeof product.stock === 'number'
      && Number.isFinite(product.stock)
      && typeof product.categoryId === 'string'
    );
    if (!isValid) console.warn('Skipping an invalid product record while rendering Explore.');
    return isValid;
  });
  const categories = getCategoryOptions();
  const query = resolvedSearchParams.q?.trim().toLowerCase() || '';
  const selectedCategory = broadCategories.find((category) => category.id === resolvedSearchParams.category);
  const sort = resolvedSearchParams.sort || '';
  const currentPrice = (product: (typeof products)[number]) => product.discountPrice != null && product.discountPrice < product.price ? product.discountPrice : product.price;

  const filteredProducts = products.filter((product) => {
    const matchesQuery = !query || (
      product.name.toLowerCase().includes(query) ||
      product.sellerName?.toLowerCase().includes(query) ||
      product.description?.toString().toLowerCase().includes(query)
    );
    const matchesCategory = !selectedCategory || belongsToBroadCategory(product.categoryId, selectedCategory, categories);
    return matchesQuery && matchesCategory;
  });
  const resultProducts = filteredProducts.slice().sort((left, right) => {
    if (sort === 'new') return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    if (sort === 'price-low') return currentPrice(left) - currentPrice(right);
    if (sort === 'price-high') return currentPrice(right) - currentPrice(left);
    if (sort === 'rating') return (right.ratingAverage ?? 0) - (left.ratingAverage ?? 0) || (right.ratingCount ?? 0) - (left.ratingCount ?? 0);
    return (right.views || 0) - (left.views || 0);
  });
  const sortedProducts = products.slice().sort((left, right) => (right.views || 0) - (left.views || 0));
  const dealProducts = products.filter((product) => product.discountPrice != null && product.discountPrice < product.price).slice(0, 8);
  const newProducts = products.slice().sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || ''))).slice(0, 8);
  const bestProducts = sortedProducts.slice(0, 8);
  const recommendations = products.filter((product) => !dealProducts.some((deal) => deal.id === product.id)).slice(0, 8);
  const isResultsView = Boolean(query || selectedCategory);
  const resultHref = (nextSort: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory.id);
    if (nextSort) params.set('sort', nextSort);
    return `/search?${params.toString()}`;
  };
  const discoveryShortcuts: ExploreShortcut[] = [
    { id: 'new', label: 'New Arrivals', href: '/search?sort=new' },
    { id: 'best', label: 'Best Sellers', href: '/search?sort=best' },
    { id: 'deals', label: 'Daily Deals', href: '/flash-deals' },
    { id: 'electronics', label: 'Electronics', href: '/search?category=electronics' },
    { id: 'fashion', label: 'Fashion', href: '/search?category=fashion' },
    { id: 'power', label: 'Power', href: '/search?category=electronics' },
    { id: 'home', label: 'Home', href: '/search?category=home' },
    { id: 'beauty', label: 'Beauty', href: '/search?category=beauty' },
    { id: 'smart', label: 'Smart & Office', href: '/search?category=electronics' },
    { id: 'more', label: 'More', href: '/categories' },
  ];

  return (
    <PublicShell>
      <SearchModes
        solutions={solutions.map((solution) => ({
          slug: solution.slug,
          name: solution.name,
          category: solution.category,
          metadata: solution.metadata,
          requirements: solution.requirements.map(({ name, keywords }) => ({ name, keywords })),
        }))}
        normalContent={
      <>
        <nav className="-mx-3 mt-3 flex gap-1 overflow-x-auto px-3 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Browse product categories">
          <Link href={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`} aria-current={!selectedCategory ? 'page' : undefined} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${!selectedCategory ? 'bg-[#292D31] text-primary' : 'text-[#B7BCC3] hover:bg-[#171B1F] hover:text-white'}`}>All</Link>
          {broadCategories.map((category) => (
            <Link key={category.id} href={`/search?${new URLSearchParams({ ...(query ? { q: query } : {}), category: category.id })}`} aria-current={selectedCategory?.id === category.id ? 'page' : undefined} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${selectedCategory?.id === category.id ? 'bg-[#292D31] text-primary' : 'text-[#B7BCC3] hover:bg-[#171B1F] hover:text-white'}`}>
              {category.label}
            </Link>
          ))}
        </nav>

        {isResultsView ? (
          <section className="mt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold">{resultProducts.length} {resultProducts.length === 1 ? 'product' : 'products'}</p><Link href="/search" className="text-xs font-medium text-primary hover:underline">Clear</Link></div>
            <nav className="mb-3 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Sort search results">
              {[['Relevant', ''], ['Newest', 'new'], ['Price: low to high', 'price-low'], ['Price: high to low', 'price-high'], ['Top rated', 'rating']].map(([label, value]) => (
                <Link key={value || 'relevant'} href={resultHref(value)} aria-current={sort === value ? 'page' : undefined} className={`shrink-0 border px-2.5 py-1.5 text-[10px] font-medium ${sort === value ? 'border-[#d65a24] bg-[#fff1eb] text-[#bd4a1c]' : 'border-border text-muted-foreground'}`}>{label}</Link>
              ))}
            </nav>
            {resultProducts.length > 0 ? <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{resultProducts.map((product) => <div key={product.id} className="min-w-0"><ProductCard product={product} /></div>)}</div> : <div className="py-12 text-center"><div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Search className="size-4" /></div><h2 className="mt-3 text-base font-semibold">No products found</h2><p className="mt-1 text-xs text-muted-foreground">Try a different search or choose another category.</p><Link href="/search" className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline">Back to Explore</Link></div>}
          </section>
        ) : (
          <div className="mt-5 space-y-6">
            <ExploreDiscovery shortcuts={discoveryShortcuts} />
            {dealProducts.length > 0 && <section aria-labelledby="daily-deals-title"><div className="mb-2 flex items-center justify-between"><h2 id="daily-deals-title" className="text-base font-bold">Daily Deals</h2><Link href="/flash-deals" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See all <ArrowRight className="size-3.5" /></Link></div><div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{dealProducts.map((product) => <div key={product.id} className="w-[148px] shrink-0 sm:w-[176px]"><ProductCard product={product} dealMode /></div>)}</div></section>}
            <section aria-labelledby="trending-products-title"><div className="mb-2 flex items-center justify-between"><h2 id="trending-products-title" className="text-base font-bold">Trending Products</h2><Link href="/search?sort=best" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See all <ArrowRight className="size-3.5" /></Link></div><div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{(sort === 'best' ? bestProducts : sort === 'new' ? newProducts : sortedProducts.slice(0, 8)).map((product) => <div key={product.id} className="min-w-0"><ProductCard product={product} /></div>)}</div></section>
            {newProducts.length > 0 && <section aria-labelledby="new-arrivals-title"><div className="mb-2 flex items-center justify-between"><h2 id="new-arrivals-title" className="text-base font-bold">New Arrivals</h2><Link href="/search?sort=new" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See all <ArrowRight className="size-3.5" /></Link></div><div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{newProducts.slice(0, 8).map((product) => <div key={product.id} className="min-w-0"><ProductCard product={product} /></div>)}</div></section>}
            {recommendations.length > 0 && <section aria-labelledby="recommended-title"><div className="mb-2 flex items-center justify-between"><h2 id="recommended-title" className="text-base font-bold">Recommended For You</h2><Link href="/products" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See all <ArrowRight className="size-3.5" /></Link></div><div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{recommendations.map((product) => <div key={product.id} className="min-w-0"><ProductCard product={product} /></div>)}</div></section>}
          </div>
        )}
        </>
      } />
    </PublicShell>
  );
}
