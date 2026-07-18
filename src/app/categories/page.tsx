import { getActiveProducts, getCategoryOptions, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default async function CategoriesPage({ searchParams }: { searchParams: { category?: string } }) {
  const [products, categories] = await Promise.all([getActiveProducts(), Promise.resolve(getCategoryOptions())]);
  const selectedCategory = searchParams.category;
  const filteredProducts = selectedCategory ? products.filter((product) => product.categoryId === selectedCategory) : products;

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Categories</p>
            <h1 className="text-3xl font-semibold">Shop by category</h1>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <Link key={category.id} href={`/categories?category=${category.id}`} className="block">
                <Card className={`h-full ${active ? 'border-primary shadow-md' : ''}`}>
                  <CardContent className="p-5">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{filteredProducts.filter((product) => product.categoryId === category.id).length} products</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.slice(0, 12).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
