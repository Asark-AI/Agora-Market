import { getActiveProducts, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicHomePage() {
  const products = await getActiveProducts();
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

        <section className="mt-5 border-b border-border pb-5" aria-labelledby="home-intro-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Made for Ghana</p><h1 id="home-intro-title" className="mt-1 max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Find what fits your life.</h1><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Shop useful things from independent sellers, manufacturers, and stores across Agora.</p></div>
            <Link href="/products" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">Browse marketplace <ArrowRight className="size-4" /></Link>
          </div>
        </section>

        {flashDeals.length > 0 && (
          <section className="mt-3 border-y border-border bg-background py-3 sm:py-4" aria-labelledby="flash-deals-title">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-600">Worth a closer look</p>
                <h2 id="flash-deals-title" className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-foreground">Offers ending soon</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Limited-time prices while stock lasts.</p>
              </div>
              <Link href="/flash-deals" className="shrink-0 text-xs font-semibold text-rose-600">View all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
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
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Selected from Agora</p>
              <h2 id="for-you-title" className="mt-0.5 text-2xl font-semibold tracking-[-0.02em] text-foreground">Popular right now</h2>
            </div>
            <Link href="/products" className="text-xs font-semibold text-primary">See all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
          </div>
          {forYou.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {forYou.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
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

      </main>
    </PublicShell>
  );
}
