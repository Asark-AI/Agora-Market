import { getActiveProducts, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
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

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const products = await getActiveProducts();
  const categories = getCategoryOptions();
  const query = searchParams.q?.trim().toLowerCase() || '';
  const selectedCategory = broadCategories.find((category) => category.id === searchParams.category);

  const filteredProducts = products.filter((product) => {
    const matchesQuery = !query || (
      product.name.toLowerCase().includes(query) ||
      product.sellerName?.toLowerCase().includes(query) ||
      product.description?.toString().toLowerCase().includes(query)
    );
    const matchesCategory = !selectedCategory || belongsToBroadCategory(product.categoryId, selectedCategory, categories);
    return matchesQuery && matchesCategory;
  });
  const trendingProducts = products.slice(0, 8);
  const dealProducts = products.filter((product) => product.discountPrice != null).slice(0, 4);
  const newProducts = products.slice().sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || ''))).slice(0, 4);
  const isResultsView = Boolean(query || selectedCategory);

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Agora marketplace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{isResultsView ? 'Search results' : 'Explore'}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{isResultsView ? `Products matching ${query ? `“${searchParams.q}”` : selectedCategory?.label}.` : 'Discover products across Agora.'}</p>
        </div>
        <div className="mt-7 max-w-3xl">
          <form action="/search" className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input defaultValue={searchParams.q || ''} name="q" placeholder="Search products or categories" aria-label="Search products or categories" className="h-12 rounded-full border-border/80 bg-background pl-12" />
          </form>
        </div>

        <section className="mt-9">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Categories</h2><span className="text-xs text-muted-foreground">Swipe to explore</span></div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {broadCategories.map((category) => (
              <Link key={category.id} href={`/search?category=${category.id}`} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition ${selectedCategory?.id === category.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border/80 bg-background hover:border-primary hover:text-primary'}`}>
                {category.label}
              </Link>
            ))}
          </div>
        </section>

        {isResultsView ? (
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-4"><div><p className="text-sm font-semibold">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</p><p className="mt-1 text-sm text-muted-foreground">Refine your search or browse another category.</p></div><Link href="/search" className="text-sm font-medium text-primary hover:underline">Clear</Link></div>
            {filteredProducts.length > 0 ? <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="border-y border-border py-20 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Search className="size-5" /></div><h2 className="mt-4 text-lg font-semibold">No products found</h2><p className="mt-2 text-sm text-muted-foreground">Try a different search or choose another category.</p><Link href="/search" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">Back to Explore</Link></div>}
          </section>
        ) : (
          <div className="mt-10 space-y-10">
            <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Trending</h2><p className="mt-1 text-sm text-muted-foreground">Popular picks from across Agora.</p></div><Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{trendingProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
            {dealProducts.length > 0 && <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Flash Deals</h2><Link href="/flash-deals" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{dealProducts.map((product) => <ProductCard key={product.id} product={product} dealMode />)}</div></section>}
            {newProducts.length > 0 && <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">New Arrivals</h2><Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{newProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
          </div>
        )}
        </div>
    </PublicShell>
  );
}
