import { getActiveProducts, getActiveSellers, getCategoryOptions, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Store, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const [products, sellers] = await Promise.all([getActiveProducts(), getActiveSellers()]);
  const categories = getCategoryOptions();
  const query = searchParams.q?.trim().toLowerCase() || '';

  const filteredProducts = products.filter((product) => {
    if (!query) return true;
    return (
      product.name.toLowerCase().includes(query) ||
      product.sellerName?.toLowerCase().includes(query) ||
      product.description?.toString().toLowerCase().includes(query)
    );
  });

  const filteredStores = sellers.filter((seller) => {
    if (!query) return true;
    return [seller.name, seller.businessType, seller.description].filter(Boolean).join(' ').toLowerCase().includes(query);
  });

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-3xl border bg-muted/30 p-6">
          <form action="/search" className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input defaultValue={searchParams.q || ''} name="q" placeholder="Search products, stores or categories" className="h-12 rounded-full pl-12" />
          </form>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.slice(0, 8).map((category) => (
              <Link key={category.id} href={`/categories?category=${category.id}`} className="rounded-full border bg-background px-3 py-1 text-sm hover:bg-primary/5">
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Search results</p>
            <h1 className="text-3xl font-semibold">Products and stores</h1>
          </div>
          <p className="text-sm text-muted-foreground">Showing {filteredProducts.length} products and {filteredStores.length} stores for “{searchParams.q || 'all results'}”</p>
        </div>

        <div className="mt-8 space-y-10">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Products</h2>
              <Link href="/products" className="text-sm font-medium text-primary hover:underline">Browse all products</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Stores</h2>
              <Link href="/stores" className="text-sm font-medium text-primary hover:underline">Browse all stores</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredStores.slice(0, 6).map((seller) => (
                <Card key={seller.id} className="overflow-hidden transition hover:-translate-y-1 hover:shadow-md">
                  <div className="relative h-32 bg-muted">
                    <Image src={getImageUrl(seller.storefrontBannerUrl)} alt={seller.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{seller.name.slice(0, 1)}</div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{seller.name}</h3>
                        <p className="text-sm text-muted-foreground">{seller.businessType}</p>
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{seller.description || 'Trusted seller on Agora Marketplace.'}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="size-4" />
                      <span>{seller.followerCount || 0} followers</span>
                      <span className="text-xs">•</span>
                      <span className="inline-flex items-center gap-1"><Users className="size-4" /> Verified</span>
                    </div>
                    <Link href={`/store/${seller.id}`} className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">Visit store</Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
