import { getActiveProducts, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import { ExploreDiscovery, type ExploreShortcut } from '@/components/explore-discovery';
import { Input } from '@/components/ui/input';
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

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; category?: string; sort?: string } }) {
  const products = await getActiveProducts();
  const categories = getCategoryOptions();
  const query = searchParams.q?.trim().toLowerCase() || '';
  const selectedCategory = broadCategories.find((category) => category.id === searchParams.category);
  const sort = searchParams.sort || '';

  const filteredProducts = products.filter((product) => {
    const matchesQuery = !query || (
      product.name.toLowerCase().includes(query) ||
      product.sellerName?.toLowerCase().includes(query) ||
      product.description?.toString().toLowerCase().includes(query)
    );
    const matchesCategory = !selectedCategory || belongsToBroadCategory(product.categoryId, selectedCategory, categories);
    return matchesQuery && matchesCategory;
  });
  const sortedProducts = products.slice().sort((left, right) => (right.views || 0) - (left.views || 0));
  const dealProducts = products.filter((product) => product.discountPrice != null && product.discountPrice < product.price).slice(0, 8);
  const newProducts = products.slice().sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || ''))).slice(0, 8);
  const bestProducts = sortedProducts.slice(0, 8);
  const recommendations = products.filter((product) => !dealProducts.some((deal) => deal.id === product.id)).slice(0, 8);
  const isResultsView = Boolean(query || selectedCategory);
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
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="max-w-3xl">
          <form action="/search" className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input defaultValue={searchParams.q || ''} name="q" placeholder="Search products or categories" aria-label="Search products or categories" className="h-12 rounded-full border-border/80 bg-background pl-12" />
          </form>
        </div>

        {isResultsView ? (
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-4"><div><p className="text-sm font-semibold">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</p><p className="mt-1 text-sm text-muted-foreground">Refine your search or browse another category.</p></div><Link href="/search" className="text-sm font-medium text-primary hover:underline">Clear</Link></div>
            {filteredProducts.length > 0 ? <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="border-y border-border py-20 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Search className="size-5" /></div><h2 className="mt-4 text-lg font-semibold">No products found</h2><p className="mt-2 text-sm text-muted-foreground">Try a different search or choose another category.</p><Link href="/search" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">Back to Explore</Link></div>}
          </section>
        ) : (
          <div className="mt-10 space-y-10">
            <ExploreDiscovery shortcuts={discoveryShortcuts} />
            {dealProducts.length > 0 && <section aria-labelledby="daily-deals-title"><div className="mb-4 flex items-center justify-between"><h2 id="daily-deals-title" className="text-xl font-semibold">Daily Deals</h2><Link href="/flash-deals" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div><div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{dealProducts.map((product) => <div key={product.id} className="w-[164px] shrink-0 sm:w-[190px]"><ProductCard product={product} dealMode /></div>)}</div></section>}
            <section aria-labelledby="trending-products-title"><div className="mb-4 flex items-center justify-between"><h2 id="trending-products-title" className="text-xl font-semibold">Trending Products</h2><Link href="/search?sort=best" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{(sort === 'best' ? bestProducts : sort === 'new' ? newProducts : sortedProducts.slice(0, 8)).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
            {newProducts.length > 0 && <section aria-labelledby="new-arrivals-title"><div className="mb-4 flex items-center justify-between"><h2 id="new-arrivals-title" className="text-xl font-semibold">New Arrivals</h2><Link href="/search?sort=new" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{newProducts.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
            {recommendations.length > 0 && <section aria-labelledby="recommended-title"><div className="mb-4 flex items-center justify-between"><h2 id="recommended-title" className="text-xl font-semibold">Recommended For You</h2><Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{recommendations.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
          </div>
        )}
        </div>
    </PublicShell>
  );
}
