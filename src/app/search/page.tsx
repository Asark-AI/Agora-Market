import { getActiveProducts, getActiveSellers, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const sellers = await getActiveSellers();
  const products = await getActiveProducts(sellers);
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
            <h1 className="text-3xl font-semibold">Products</h1>
          </div>
          <p className="text-sm text-muted-foreground">Showing {filteredProducts.length} products for “{searchParams.q || 'all products'}”</p>
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
        </div>
      </div>
    </PublicShell>
  );
}
