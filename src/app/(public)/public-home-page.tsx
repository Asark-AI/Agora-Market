import { getActiveProducts } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Store, TrendingUp, Zap } from 'lucide-react';

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
      <main className="mx-auto max-w-7xl px-3 pb-12 sm:px-4">
        <nav className="-mx-3 mt-4 flex gap-1 overflow-x-auto border-b border-[#1d2227] bg-[#0B0D0F]/80 px-3 py-2 sm:-mx-4 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Shop categories">
          <Link href="/" aria-current="page" className="shrink-0 border-b-2 border-[#D4A72C] px-3 py-2 text-xs font-semibold text-white">All</Link>
          {homeCategories.map((category) => (
            <Link key={category.id} href={`/search?category=${category.id}`} className="shrink-0 px-3 py-2 text-xs font-semibold text-[#B7BCC3] transition hover:text-white">
              {category.label}
            </Link>
          ))}
          <Link href="/categories" className="flex shrink-0 items-center gap-1 px-3 py-2 text-xs font-semibold text-[#B7BCC3] transition hover:text-white">
            More <ArrowRight className="size-3.5" />
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#1d2227] py-3 text-[11px] font-medium text-[#B7BCC3]" aria-label="Agora marketplace benefits">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-[#F0C75E]" /> Buyer protection</span>
          <span className="inline-flex items-center gap-1.5"><Store className="size-3.5 text-[#F0C75E]" /> Local sellers</span>
          <Link href="/products" className="ml-auto inline-flex shrink-0 items-center gap-1 font-semibold text-[#F0C75E]">All products <ArrowRight className="size-3.5" /></Link>
        </div>

        <section className="agora-panel mt-4 overflow-hidden rounded-[28px] p-4 sm:p-6 lg:p-7" aria-labelledby="solutions-title">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <span className="agora-pill">Premium marketplace</span>
              <h1 id="solutions-title" className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Discover the next favorite thing for your life.
              </h1>
              <p className="mt-4 max-w-xl text-sm text-[#B7BCC3] sm:text-base">
                Thoughtful essentials, standout tech, and trusted sellers curated for premium everyday living.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-[#D4A72C] px-5 py-2.5 text-sm font-semibold text-[#0B0D0F] shadow-[0_12px_28px_-16px_rgba(212,167,44,0.8)] transition hover:bg-[#E2BE56]">
                  Shop now <ArrowRight className="size-4" />
                </Link>
                <Link href="/solutions" className="inline-flex items-center gap-2 rounded-full border border-[#2a2f34] bg-[#101316] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#D4A72C]/50 hover:text-[#F0C75E]">
                  Explore solutions
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[#B7BCC3]">
                <span className="inline-flex items-center gap-2"><Sparkles className="size-3.5 text-[#D4A72C]" /> Curated picks</span>
                <span className="inline-flex items-center gap-2"><TrendingUp className="size-3.5 text-[#D4A72C]" /> Trending now</span>
              </div>
            </div>

            <div className="agora-card rounded-[24px] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A72C]">This week</p>
                <span className="rounded-full border border-[#D4A72C]/30 bg-[#D4A72C]/10 px-2 py-1 text-[10px] font-semibold text-[#F0C75E]">Live</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-[#2a2f34] bg-[#101316] p-3">
                  <p className="text-xs text-[#B7BCC3]">Fast movers</p>
                  <p className="mt-1 text-xl font-bold text-white">4.8k</p>
                  <p className="mt-1 text-[11px] text-[#9aa3ab]">Orders processed this week</p>
                </div>
                <div className="rounded-2xl border border-[#2a2f34] bg-[#101316] p-3">
                  <p className="text-xs text-[#B7BCC3]">Buyer favorites</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm"><span className="text-white">Audio gear</span><span className="text-[#F0C75E]">+21%</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-white">Home setup</span><span className="text-[#F0C75E]">+18%</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-white">Travel gear</span><span className="text-[#F0C75E]">+12%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-[#1d2227] bg-[#101316] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">Built for shoppers</p>
              <h2 className="mt-1 text-lg font-bold text-white">Browse by lifestyle</h2>
            </div>
            <Link href="/categories" className="inline-flex items-center gap-1 text-xs font-semibold text-[#F0C75E]">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {homeCategories.map((category) => (
              <Link key={category.id} href={`/search?category=${category.id}`} className="rounded-2xl border border-[#2a2f34] bg-[#171B1F] px-3 py-3 text-sm font-medium text-[#E8EEF4] transition hover:border-[#D4A72C]/50 hover:text-[#F0C75E]">
                {category.label}
              </Link>
            ))}
          </div>
        </section>

        {flashDeals.length > 0 && (
          <section className="mt-5" aria-labelledby="flash-deals-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 id="flash-deals-title" className="inline-flex items-center gap-2 text-lg font-bold text-white"><Zap className="size-4 text-[#D4A72C]" /> Flash Deals</h2>
              </div>
              <Link href="/flash-deals" className="text-xs font-semibold text-[#F0C75E]">See all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
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

        <section className="mt-5" aria-labelledby="for-you-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="for-you-title" className="text-lg font-bold text-white">Popular right now</h2>
            <Link href="/products" className="text-xs font-semibold text-[#F0C75E]">See all <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
          </div>
          {popular.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {popular.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#2a2f34] bg-[#101316] p-8 text-center text-sm text-[#B7BCC3]">New products are arriving soon.</div>
          )}
        </section>

        {newArrivals.length > 0 && (
          <section className="mt-5" aria-labelledby="trending-title">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 id="trending-title" className="text-lg font-bold text-white">New arrivals</h2>
              <Link href="/products" className="text-xs font-semibold text-[#F0C75E]">Explore <ArrowRight className="ml-0.5 inline size-3.5" /></Link>
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
