import { getActiveProducts, getActiveSellers, getCategoryOptions, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import NextImage from 'next/image';
import { Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// Note: render the initial product grid server-side so products appear immediately on first load

export default async function PublicHomePage() {
  const [products, sellers] = await Promise.all([getActiveProducts(), getActiveSellers()]);

  const categories = getCategoryOptions();
  const featuredStores = sellers.slice(0, 6);

  // Merge deals into feed (deals flagged) but primary feed is products
  const primaryFeed = products.slice(0, 200);

  return (
    <PublicShell>
      {/* Top: compact search + categories */}
      <section className="sticky top-14 z-20 border-b bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <form action="/search" className="flex w-full items-center gap-3">
            <Input name="q" placeholder="Search products, stores & brands" className="h-12 w-full rounded-full px-4 text-sm" />
            <Button type="submit" className="rounded-full px-4 py-2">Search</Button>
          </form>

          <div className="mt-2 flex items-center gap-2 overflow-x-auto py-2">
            <Link href="/products" className="whitespace-nowrap rounded-full border border-border/70 bg-background px-3 py-2 text-sm font-semibold">All</Link>
            {categories.slice(0, 12).map(c => (
              <Link key={c.id} href={`/categories?category=${c.id}`} className="whitespace-nowrap rounded-full border border-border/70 bg-white px-3 py-2 text-sm font-medium">{c.name}</Link>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-3 overflow-x-auto py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">✓ Free shipping</span>
            <span className="flex items-center gap-2">✓ Buyer protection</span>
            <span className="flex items-center gap-2">✓ Verified sellers</span>
            <span className="flex items-center gap-2">✓ Secure payments</span>
          </div>
        </div>
      </section>

      {/* Secondary nav: marketplace categories & quick tabs */}
      <nav className="border-b bg-background/60">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 overflow-x-auto py-2 text-sm">
            <Link href="/categories" className="font-semibold">Categories</Link>
            <Link href="/?tab=deals" className="whitespace-nowrap">Deals</Link>
            <Link href="/?tab=5star" className="whitespace-nowrap">5-Star Rated</Link>
            <Link href="/?tab=best" className="whitespace-nowrap">Best Sellers</Link>
            <Link href="/?tab=new" className="whitespace-nowrap">New Arrivals</Link>
            {categories.slice(0, 12).map(c => (
              <Link key={c.id} href={`/categories?category=${c.id}`} className="whitespace-nowrap text-muted-foreground">{c.name}</Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Left sidebar */}
          <aside className="hidden flex-col gap-3 lg:flex">
            <div className="rounded-lg border border-border/70 bg-white p-3">
              <h4 className="text-sm font-semibold">Shop by Category</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/categories" className="block">All Categories</Link></li>
                <li><Link href="/categories?category=electronics" className="block">Electronics</Link></li>
                <li><Link href="/categories?category=phones" className="block">Phones</Link></li>
                <li><Link href="/categories?category=computers" className="block">Computers</Link></li>
                <li><Link href="/categories?category=fashion" className="block">Fashion</Link></li>
                <li><Link href="/categories?category=home" className="block">Home & Living</Link></li>
                <li><Link href="/categories?category=cars" className="block">Cars</Link></li>
                <li><Link href="/categories?category=machinery" className="block">Machinery</Link></li>
                <li><Link href="/categories?category=sports" className="block">Sports</Link></li>
                <li><Link href="/categories?category=beauty" className="block">Beauty</Link></li>
              </ul>
            </div>
            <div className="rounded-lg border border-border/70 bg-white p-3">
              <h4 className="text-sm font-semibold">Filters</h4>
              <div className="mt-3 text-sm text-muted-foreground">Price, Rating, Seller, Shipping, Location</div>
            </div>
          </aside>

          {/* Main content */}
          <section>
            {/* Flash deals horizontal */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">🔥 Flash Deals</p>
                  <h3 className="text-lg font-semibold text-foreground">Limited time offers</h3>
                </div>
                <Link href="/flash-deals" className="text-sm text-primary">View all deals →</Link>
              </div>
              <div className="-mx-4 overflow-x-auto px-4">
                <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                  {primaryFeed.filter(p => p.discountPrice).slice(0, 10).map(p => (
                    <div key={p.id} className="w-[220px] shrink-0">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Discovery tabs + product grid */}
            <div className="mb-4 flex items-center gap-3 overflow-x-auto py-2">
              {['all','deals','5star','best','new','recommended'].map(t => (
                <a key={t} href={`/?tab=${t}`} className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold bg-background border border-border/70">{t==='5star' ? '⭐ 5-Star' : t==='best'? 'Best-Selling' : t==='new'? 'New Arrivals' : t==='deals'? '🔥 Deals' : t==='recommended' ? 'Recommended' : 'All'}</a>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {primaryFeed.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Continuous sections: Trending / New Arrivals / Best Sellers (use same grid) */}
      <section className="container mx-auto max-w-7xl px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Trending now</p>
            <h3 className="text-lg font-semibold text-foreground">Popular with shoppers today</h3>
          </div>
          <Link href="/products" className="text-sm font-medium text-primary">See all</Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {products.slice(0, 8).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Verified stores</p>
            <h3 className="text-lg font-semibold text-foreground">Trusted sellers on Agora</h3>
          </div>
          <Link href="/stores" className="text-sm font-medium text-primary">Browse stores</Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {featuredStores.map(s => (
            <Link key={s.id} href={`/store/${s.id}`} className="flex items-center gap-3 rounded-lg border border-border/70 bg-white p-3">
              <div className="h-12 w-12 rounded-md bg-muted/20 flex items-center justify-center font-semibold text-foreground">{s.name?.slice?.(0,1)}</div>
              <div className="text-sm">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">✓ Verified • {s.productCount || 0} products</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
