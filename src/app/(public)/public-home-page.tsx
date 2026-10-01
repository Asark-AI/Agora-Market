import { getActiveProducts } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Store, Zap } from 'lucide-react';

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
      <main className="mx-auto max-w-7xl px-3 pb-8 sm:px-4">
        <nav className="-mx-3 flex gap-1 overflow-x-auto border-b border-border/60 bg-background px-3 py-2 sm:-mx-4 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Shop categories">
          <Link href="/" aria-current="page" className="shrink-0 border-b-2 border-[#d65a24] px-3 py-2 text-xs font-semibold text-foreground">All</Link>
          {homeCategories.map((category) => (
            <Link key={category.id} href={`/search?category=${category.id}`} className="shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
              {category.label}
            </Link>
          ))}
          <Link href="/categories" className="flex shrink-0 items-center gap-1 px-3 py-2 text-xs font-semibold text-muted-foreground">More <ArrowRight className="size-3.5" /></Link>
        </nav>

        <div className="flex items-center gap-5 border-b border-border/60 py-2 text-[11px] font-medium text-muted-foreground" aria-label="Agora marketplace benefits">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-700" /> Buyer protection</span>
          <span className="inline-flex items-center gap-1.5"><Store className="size-3.5 text-emerald-700" /> Local sellers</span>
          <Link href="/products" className="ml-auto inline-flex shrink-0 items-center gap-1 font-semibold text-primary">All products <ArrowRight className="size-3.5" /></Link>
        </div>

        {flashDeals.length > 0 && (
          <section className="border-b border-border/70 py-3" aria-labelledby="flash-deals-title">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2"><h2 id="flash-deals-title" className="inline-flex items-center gap-1.5 text-base font-bold text-foreground"><Zap className="size-4 text-[#d65a24]" />Flash Deals</h2><p className="hidden text-[11px] text-muted-foreground sm:block">Discounted prices on selected products</p></div>
              <Link href="/flash-deals" className="shrink-0 text-xs font-semibold text-primary">See all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {flashDeals.map((product) => (
                <div key={product.id} className="w-[148px] shrink-0 sm:w-[176px]">
                  <ProductCard product={product} dealMode />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-3" aria-labelledby="for-you-title">
          <div className="mb-2 flex items-end justify-between gap-3">
            <h2 id="for-you-title" className="text-base font-bold text-foreground">Popular right now</h2>
            <Link href="/products" className="text-xs font-semibold text-primary">See all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
          </div>
          {popular.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {popular.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">New products are arriving soon.</div>
          )}
        </section>

        {newArrivals.length > 0 && (
          <section className="mt-4" aria-labelledby="trending-title">
            <div className="mb-2 flex items-end justify-between gap-3">
              <h2 id="trending-title" className="text-base font-bold text-foreground">New Arrivals</h2>
              <Link href="/products" className="text-xs font-semibold text-primary">Explore <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}

      </main>
    </PublicShell>
  );
}
