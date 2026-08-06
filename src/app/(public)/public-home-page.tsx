import { getActiveProducts, getActiveSellers, getCategoryOptions, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import NextImage from 'next/image';
import {
  ArrowRight,
  Award,
  BadgePercent,
  Clock3,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Shield,
  Zap,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default async function PublicHomePage() {
  const [products, sellers] = await Promise.all([getActiveProducts(), getActiveSellers()]);
  const featuredProducts = products.slice(0, 8);
  const categories = getCategoryOptions().slice(0, 8);
  const flashDeals = featuredProducts.slice(0, 4);
  const trendingProducts = featuredProducts.slice(0, 4);
  const newArrivals = products.slice(4, 8);
  const bestSellers = products.slice(8, 12);
  const featuredStores = sellers.slice(0, 6);

  const heroStats = [
    { label: 'Verified sellers', value: '1.2k+' },
    { label: 'Fast delivery', value: '24h+' },
    { label: 'Curated products', value: `${featuredProducts.length * 10}+` },
  ];

  const benefitCards = [
    {
      title: 'Curated quality',
      description: 'Premium products selected for trusted value and performance.',
      icon: Shield,
    },
    {
      title: 'Fast checkout',
      description: 'Simplified purchasing flow built for conversion and convenience.',
      icon: Zap,
    },
    {
      title: 'Trusted shops',
      description: 'Verified vendors with transparent ratings and fast support.',
      icon: ShieldCheck,
    },
  ];

  return (
    <PublicShell>
      <section className="overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-10 sm:py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4" /> Premium marketplace experience
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Discover trusted products faster with a premium, mobile-first marketplace.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                Agora brings curated sellers, verified quality, and conversion-optimized shopping into one polished storefront for buyers and businesses.
              </p>

              <form action="/search" className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Input
                  name="q"
                  placeholder="Search products, stores, or brands"
                  className="h-14 rounded-full px-5 text-sm"
                />
                <Button type="submit" size="lg" className="rounded-full px-8">
                  Search Agora
                </Button>
              </form>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {heroStats.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border/70 bg-background/80 p-5 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/30 to-transparent" />
              <div className="relative grid gap-4">
                <div className="grid gap-3 rounded-[28px] bg-white/10 p-6">
                  <div className="text-sm uppercase tracking-[0.28em] text-primary">Agora Spotlight</div>
                  <div className="text-3xl font-semibold">Curated collections for your next order</div>
                  <p className="text-sm leading-6 text-slate-200">
                    High-conversion hero content, featured sellers, and lightning-fast product discovery designed for modern commerce.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[28px] bg-white/10 p-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.28em] text-white/80">
                      <BadgePercent className="size-4" /> Flash deals
                    </div>
                    <p className="mt-4 text-lg font-semibold">Up to 35% off top-rated items.</p>
                  </div>
                  <div className="rounded-[28px] bg-white/10 p-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.28em] text-white/80">
                      <Store className="size-4" /> Verified stores
                    </div>
                    <p className="mt-4 text-lg font-semibold">Shop from trusted local brands.</p>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-10 right-0 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Browse by category</p>
            <h2 className="text-3xl font-semibold text-foreground">Shop smarter with curated categories</h2>
          </div>
          <Link href="/categories" className="text-sm font-medium text-primary hover:underline">
            View all categories
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories?category=${category.id}`} className="group block overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{category.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Curated for modern purchasing.</p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary transition group-hover:bg-primary/20">
                    <TrendingUp className="size-5" />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
                  Explore
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="rounded-[32px] border border-border/70 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Enterprise trust</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Secure commerce for buyers and businesses.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Agora helps enterprise customers move faster with verified sellers, transparent logistics, and a premium checkout experience designed for scale.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Verified Seller Network', value: '1,200+', icon: ShieldCheck },
                  { label: 'Fast Delivery Promise', value: '24h+', icon: Truck },
                  { label: 'Top-rated Products', value: '4.8/5', icon: Star },
                  { label: 'Business Ready', value: 'Integrated workflows', icon: Award },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-3xl bg-white/5 p-5">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <stat.icon className="size-5" />
                    </div>
                    <p className="mt-4 text-sm text-slate-300">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-slate-900/90 p-6 shadow-xl ring-1 ring-white/10">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/90 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Enterprise-ready purchase flow</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">Speed through procurement with confidence.</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Support faster approvals, clear shipping windows, and simplified order tracking for every transaction.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3 rounded-3xl bg-white/5 p-4">
                    <ShieldCheck className="size-5 text-primary" />
                    <div>
                      <p className="font-semibold text-white">Verified vendor onboarding</p>
                      <p className="text-sm text-slate-400">Partner only with sellers who meet Agora’s reliability standards.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-3xl bg-white/5 p-4">
                    <Truck className="size-5 text-primary" />
                    <div>
                      <p className="font-semibold text-white">Fast fulfillment visibility</p>
                      <p className="text-sm text-slate-400">Track shipping and delivery windows from one clean dashboard.</p>
                    </div>
                  </div>
                </div>
                <Button asChild variant="secondary" className="mt-6 w-full rounded-full px-6 py-4 text-sm font-semibold">
                  <Link href="/products">Explore enterprise products</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Flash deals</p>
            <h2 className="text-3xl font-semibold text-foreground">Today’s best savings</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted-foreground">
            <Clock3 className="size-4 text-primary" /> Live now
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          {flashDeals.map((product) => (
            <Card key={product.id} className="overflow-hidden border border-border/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative aspect-[4/3] bg-slate-100">
                <NextImage src={getImageUrl(product.images?.[0])} alt={product.name} fill className="object-cover" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Limited stock</span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">-{Math.max(10, Math.round((1 - ((product.discountPrice ?? product.price) / (product.price || 1))) * 100))}%</span>
                </div>
                <Link href={`/product/${product.id}`} className="mt-4 block text-lg font-semibold text-foreground">
                  {product.name}
                </Link>
                <div className="mt-4 flex items-center gap-3 text-sm">
                  <span className="text-xl font-semibold text-foreground">GH₵{(product.discountPrice ?? product.price).toFixed(2)}</span>
                  <span className="text-muted-foreground line-through">GH₵{product.price.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Featured collections</p>
            <h2 className="text-3xl font-semibold text-foreground">Trending products for every mission</h2>
          </div>
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">
            Shop all products
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">New arrivals</p>
            <h2 className="text-3xl font-semibold text-foreground">Fresh launches from trusted sellers</h2>
          </div>
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">
            Discover new items
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="grid gap-4 lg:grid-cols-3">
          {benefitCards.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="rounded-[28px] border border-border/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardContent className="p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Seller spotlight</p>
            <h2 className="text-3xl font-semibold text-foreground">Trusted partners shaping the marketplace</h2>
          </div>
          <Link href="/stores" className="text-sm font-medium text-primary hover:underline">
            Browse stores
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredStores.map((seller) => (
            <Card key={seller.id} className="overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative h-40 bg-slate-100">
                <NextImage src={getImageUrl(seller.storefrontBannerUrl)} alt={seller.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary text-xl font-semibold">
                    {seller.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{seller.name}</h3>
                    <p className="text-sm text-muted-foreground">{seller.businessType}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                  <Star className="size-4 text-amber-500" />
                  <span>4.8 rating</span>
                  <span>•</span>
                  <span>{seller.followerCount || 0} followers</span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{seller.description}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="flex-1 min-w-[120px]">
                    <Link href={`/store/${seller.id}`}>Visit store</Link>
                  </Button>
                  <Button asChild className="flex-1 min-w-[120px]">
                    <Link href="/stores">Explore</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-12">
        <Card className="overflow-hidden rounded-[32px] border-0 bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground shadow-2xl">
          <CardContent className="flex flex-col gap-6 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/90">Launch your next order</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Scale faster with Agora’s premium marketplace experience.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" className="rounded-full px-6" asChild>
                <Link href="/products">Shop now</Link>
              </Button>
              <Button variant="outline" className="rounded-full border-white/50 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href="/stores">Find sellers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
