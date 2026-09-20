import { getActiveProducts } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const homeCategories = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'mobile', label: 'Phones & Tablets' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'home', label: 'Home & Living' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'tools', label: 'Tools & Hardware' },
  { id: 'sports', label: 'Sports' },
];

export default async function PublicHomePage() {
  const products = await getActiveProducts();
  const flashDeals = products.filter((product) => product.discountPrice && product.discountPrice < product.price).slice(0, 8);
  const flashDealIds = new Set(flashDeals.map((product) => product.id));
  const feed = products.filter((product) => !flashDealIds.has(product.id));
  const popular = feed.slice(0, 12);
  const newArrivals = products.slice().sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || ''))).slice(0, 8);

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 pb-8">
        <section className="border-b border-border py-3" aria-labelledby="home-shopping-title">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Agora marketplace</p><h1 id="home-shopping-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Shop what&apos;s new</h1></div>
            <Link href="/products" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">All products <ArrowRight className="size-4" /></Link>
          </div>
        </section>

        <nav className="-mx-4 flex gap-2 overflow-x-auto border-b border-border/50 bg-background px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Shop categories">
          {homeCategories.map((category, index) => (
            <Link key={category.id} href={`/search?category=${category.id}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${index === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 bg-background text-foreground hover:border-primary hover:text-primary'}`}>
              {category.label}
            </Link>
          ))}
          <Link href="/categories" className="flex shrink-0 items-center gap-1 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground">More <ArrowRight className="size-3.5" /></Link>
        </nav>

        {flashDeals.length > 0 && (
          <section className="mt-3 border-y border-border bg-background py-3 sm:py-4" aria-labelledby="flash-deals-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><h2 id="flash-deals-title" className="text-xl font-semibold tracking-[-0.02em] text-foreground">Flash Deals</h2><p className="mt-0.5 text-xs text-muted-foreground">Limited-time prices while stock lasts.</p></div>
              <Link href="/flash-deals" className="shrink-0 text-xs font-semibold text-primary">See all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {flashDeals.map((product) => (
                <div key={product.id} className="w-[156px] shrink-0 sm:w-[184px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6" aria-labelledby="for-you-title">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <h2 id="for-you-title" className="text-xl font-semibold tracking-[-0.02em] text-foreground">Popular right now</h2>
            <Link href="/products" className="text-xs font-semibold text-primary">See all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
          </div>
          {popular.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {popular.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">New products are arriving soon.</div>
          )}
        </section>

        {newArrivals.length > 0 && (
          <section className="mt-5" aria-labelledby="trending-title">
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <h2 id="trending-title" className="text-xl font-semibold text-foreground">New Arrivals</h2>
              <Link href="/products" className="text-xs font-semibold text-primary">Explore <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}

      </main>
    </PublicShell>
  );
}
