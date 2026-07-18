import { getActiveProducts, getActiveSellers, getCategoryOptions, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Store, TrendingUp, BadgePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default async function PublicHomePage() {
  const [products, sellers] = await Promise.all([getActiveProducts(), getActiveSellers()]);
  const featuredProducts = products.slice(0, 8);
  const categories = getCategoryOptions().slice(0, 8);

  return (
    <PublicShell>
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-12 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-primary" /> Premium marketplace for Ghanaian sellers
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Shop trusted products from local and regional sellers.
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                Discover fashion, electronics, home essentials and more—packed with fast delivery, secure checkout and curated deals.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/search">Explore products</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/categories">Browse categories</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="overflow-hidden border-0 shadow-lg rounded-4xl">
                <div className="relative aspect-[4/3] sm:aspect-[5/4]">
                  <Image src="https://picsum.photos/seed/hero/800/600" alt="Featured marketplace" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              </Card>
              <Card className="overflow-hidden border-0 shadow-lg rounded-4xl">
                <div className="relative aspect-[4/3] sm:aspect-[5/4]">
                  <Image src="https://picsum.photos/seed/hero2/800/600" alt="Featured products" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Shop by category</p>
            <h2 className="text-2xl font-semibold">Popular categories</h2>
          </div>
          <Link href="/categories" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories?category=${category.id}`} className="block">
              <Card className="h-full min-h-[140px] transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">{category.name}</h3>
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

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Featured deals</p>
            <h2 className="text-2xl font-semibold">Trending products</h2>
          </div>
          <Link href="/search" className="text-sm font-medium text-primary hover:underline">See more</Link>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Popular stores</p>
            <h2 className="text-2xl font-semibold">Featured stores</h2>
          </div>
          <Link href="/search" className="text-sm font-medium text-primary hover:underline">Discover stores</Link>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.slice(0, 6).map((seller) => (
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
                <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{seller.description}</p>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link href={`/store/${seller.id}`}>Visit store</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-12">
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                <BadgePercent className="size-4" /> Exclusive deals every week
              </div>
              <h2 className="mt-4 text-3xl font-semibold">Get weekly offers and new arrivals in your inbox.</h2>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/sign-up">Join Agora <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
