import { getActiveProducts, getCategoryOptions, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { electronicsCategoryTree } from '@/lib/electronics-catalog';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage({ searchParams }: { searchParams: { category?: string } }) {
  const products = await getActiveProducts();
  const selectedCategory = searchParams.category;
  const filteredProducts = selectedCategory ? products.filter((product) => product.categoryId === selectedCategory) : products;
  const selectedNode = electronicsCategoryTree.flatMap((department) => department.children || []).find((category) => category.id === selectedCategory);

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Categories</p>
            <h1 className="text-3xl font-semibold">Shop by category</h1>
          </div>
        </div>
        <div className="space-y-5">
          {electronicsCategoryTree.map((department) => {
            const children = department.children || [];
            return (
              <section key={department.id} className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Department</p>
                    <h2 className="mt-1 text-xl font-semibold">{department.name}</h2>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{children.length} categories</span>
                </div>
                <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {children.map((category) => {
                    const active = selectedCategory === category.id;
                    const count = products.filter((product) => product.categoryId === category.id).length;
                    return (
                      <Link key={category.id} href={`/categories?category=${category.id}`} className={`group flex items-center justify-between gap-3 border-b border-border/50 py-2.5 text-sm transition hover:border-primary ${active ? 'font-semibold text-primary' : 'text-foreground'}`}>
                        <span>{category.name}</span>
                        <span className="text-xs text-muted-foreground group-hover:text-primary">{count}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        {selectedNode && <p className="mt-6 text-sm text-muted-foreground">Showing products in <span className="font-semibold text-foreground">{selectedNode.name}</span>.</p>}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.slice(0, 12).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
