import { getActiveProducts, getActiveSellers, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';

export default async function PublicHomePage() {
  const [products, sellers] = await Promise.all([getActiveProducts(), getActiveSellers()]);
  const categories = getCategoryOptions();
  const flashDeals = products.filter((product) => product.discountPrice && product.discountPrice < product.price).slice(0, 8);
  const flashDealIds = new Set(flashDeals.map((product) => product.id));
  const feed = products.filter((product) => !flashDealIds.has(product.id));
  const forYou = feed.slice(0, 24);
  const trending = feed.slice(24, 32);

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 pb-8">
        <nav className="-mx-4 flex gap-2 overflow-x-auto border-b border-border/50 bg-background px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Product categories">
          <Link href="/products" className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">All</Link>
          {categories.slice(0, 10).map((category) => (
            <Link key={category.id} href={`/categories?category=${category.id}`} className="shrink-0 rounded-full border border-border/70 bg-background px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
              {category.name}
            </Link>
          ))}
          <Link href="/categories" className="flex shrink-0 items-center gap-1 rounded-full border border-border/70 px-4 py-1.5 text-sm font-medium text-muted-foreground">
            More <ArrowRight className="size-3.5" />
          </Link>
        </nav>

        {flashDeals.length > 0 && (
          <section className="mt-3 rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50 to-background p-3 sm:p-4" aria-labelledby="flash-deals-title">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">Deal drop</p>
                <h2 id="flash-deals-title" className="mt-0.5 flex items-center gap-1.5 text-lg font-bold text-foreground"><span aria-hidden="true">🔥</span> Flash Deals</h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" /> Ends in 02:35:18</p>
              </div>
              <Link href="/products?filter=deals" className="shrink-0 text-xs font-semibold text-rose-600">View all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
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

        <section className="mt-5" aria-labelledby="for-you-title">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Picked for you</p>
              <h2 id="for-you-title" className="mt-0.5 text-xl font-bold text-foreground">For You</h2>
            </div>
            <Link href="/products" className="text-xs font-semibold text-primary">See all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
          </div>
          {forYou.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {forYou.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">New products are arriving soon.</div>
          )}
        </section>

        {trending.length > 0 && (
          <section className="mt-5" aria-labelledby="trending-title">
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Popular now</p>
                <h2 id="trending-title" className="mt-0.5 text-xl font-bold text-foreground">Trending in Ghana</h2>
              </div>
              <Link href="/products" className="text-xs font-semibold text-primary">Explore <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {trending.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}

        {sellers.length > 0 && (
          <section className="mt-5 border-t border-border/60 pt-4" aria-labelledby="stores-title">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="stores-title" className="text-base font-bold">Popular stores</h2>
              <Link href="/stores" className="text-xs font-semibold text-primary">Browse stores <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sellers.slice(0, 6).map((seller) => (
                <Link key={seller.id} href={`/store/${seller.id}`} className="min-w-[150px] rounded-xl border border-border/70 bg-background p-3 text-sm">
                  <p className="truncate font-semibold">{seller.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{seller.productCount ?? 0} products</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </PublicShell>
  );
}
