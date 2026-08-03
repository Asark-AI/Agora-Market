import { getActiveProducts, getActiveSellers, getCategoryOptions, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgePercent, Clock3, Sparkles, Store, TrendingUp, ShoppingBag, Star, ShieldCheck } from 'lucide-react';
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

  return (
    <PublicShell>
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-8 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-primary" /> Premium discovery for trusted products and stores
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Find what you need faster with a cleaner marketplace experience.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                Explore curated deals, browse by category, and discover sellers that match your taste without the clutter.
              </p>
              <form action="/search" className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Input name="q" placeholder="Search products, stores, or brands" className="h-12 rounded-full" />
                <Button type="submit" size="lg" className="rounded-full">
                  Explore now
                </Button>
              </form>
              <div className="mt-6 flex flex-wrap gap-2">
                {categories.slice(0, 6).map((category) => (
                  <Link key={category.id} href={`/categories?category=${category.id}`} className="rounded-full border bg-background/80 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary">
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="overflow-hidden rounded-[24px] border-0 shadow-lg">
                <div className="relative aspect-[4/3]">
                  <Image src="https://picsum.photos/seed/hero/800/600" alt="Marketplace discovery" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              </Card>
              <Card className="overflow-hidden rounded-[24px] border-0 shadow-lg">
                <div className="relative aspect-[4/3]">
                  <Image src="https://picsum.photos/seed/hero2/800/600" alt="Featured products" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Featured categories</p>
            <h2 className="text-2xl font-semibold">Popular picks for every shopper</h2>
          </div>
          <Link href="/categories" className="text-sm font-medium text-primary hover:underline">View all categories</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories?category=${category.id}`} className="block">
              <Card className="h-full min-h-[140px] transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold">{category.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Curated picks</p>
                    </div>
                    <div className="rounded-full bg-primary/10 p-2 text-primary"><TrendingUp className="size-4" /></div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Flash deals</p>
            <h2 className="text-2xl font-semibold">Limited-time savings</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground">
            <Clock3 className="size-4 text-primary" /> Ends in 04:22:15
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {flashDeals.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                <Image src={getImageUrl(product.images?.[0])} alt={product.name} fill className="object-cover" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Limited stock</span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">-{Math.max(10, Math.round((1 - ((product.discountPrice ?? product.price) / (product.price || 1))) * 100))}%</span>
                </div>
                <Link href={`/product/${product.id}`} className="mt-3 block font-semibold">{product.name}</Link>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-semibold">GH₵{(product.discountPrice ?? product.price).toFixed(2)}</span>
                  <span className="text-muted-foreground line-through">GH₵{product.price.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Trending now</p>
            <h2 className="text-2xl font-semibold">Curated picks for your next order</h2>
          </div>
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">View all products</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">New arrivals</p>
            <h2 className="text-2xl font-semibold">Freshly added to the marketplace</h2>
          </div>
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">See more</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Best sellers</p>
            <h2 className="text-2xl font-semibold">Most-loved items this week</h2>
          </div>
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">Browse best sellers</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid gap-3 lg:grid-cols-3">
          {[{title:'Free shipping', description:'On orders above GH₵200', icon: ShoppingBag}, {title:'Weekend deals', description:'Save on essentials and electronics', icon: BadgePercent}, {title:'Verified sellers', description:'Shop with trusted local partners', icon: ShieldCheck}].map(({title, description, icon: Icon}) => (
            <Card key={title} className="border-0 bg-muted/40">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="rounded-2xl bg-background p-3 text-primary"><Icon className="size-5" /></div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Featured stores</p>
            <h2 className="text-2xl font-semibold">Trusted sellers near the top</h2>
          </div>
          <Link href="/stores" className="text-sm font-medium text-primary hover:underline">View all stores</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredStores.map((seller) => (
            <Card key={seller.id} className="overflow-hidden transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative h-32 bg-muted">
                <Image src={getImageUrl(seller.storefrontBannerUrl)} alt={seller.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{seller.name.slice(0, 1)}</div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{seller.name}</h3>
                    <p className="text-sm text-muted-foreground">{seller.businessType}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span>4.8</span>
                  <span>•</span>
                  <span>{seller.followerCount || 0} followers</span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{seller.description}</p>
                <div className="mt-5 flex gap-2">
                  <Button asChild className="flex-1" variant="outline">
                    <Link href={`/store/${seller.id}`}>Visit store</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/stores">Explore</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                <BadgePercent className="size-4" /> Discover more every week
              </div>
              <h2 className="mt-4 text-3xl font-semibold">Browse all products or explore the best stores on Agora.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <Link href="/products">View all products <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href="/stores">View all stores <Store className="ml-2 size-4" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
