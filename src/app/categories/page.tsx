import { getActiveProducts } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { electronicsCategoryTree } from '@/lib/electronics-catalog';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ category?: string; department?: string; q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const products = await getActiveProducts();
  const selectedCategory = resolvedSearchParams.category;
  const selectedDepartment = electronicsCategoryTree.find((department) => department.id === resolvedSearchParams.department);
  const query = resolvedSearchParams.q?.trim().toLowerCase() || '';
  const selectedNode = electronicsCategoryTree.flatMap((department) => department.children || []).find((category) => category.id === selectedCategory);
  const productCounts = new Map<string, number>();

  products.forEach((product) => productCounts.set(product.categoryId, (productCounts.get(product.categoryId) || 0) + 1));

  const visibleDepartments = electronicsCategoryTree.filter((department) => {
    if (!query) return true;
    return department.name.toLowerCase().includes(query) || department.children?.some((category) => category.name.toLowerCase().includes(query));
  });
  const filteredProducts = selectedCategory ? products.filter((product) => product.categoryId === selectedCategory) : [];
  const totalCategories = electronicsCategoryTree.reduce((sum, department) => sum + (department.children?.length || 0), 0);

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <header className="border-b border-border pb-5">
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><p className="agora-pill mb-3">Discover something new</p><h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Shop by category</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Browse departments built for the way people shop for technology, electronics, and everyday products.</p></div>
            <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{electronicsCategoryTree.length}</span> departments · <span className="font-semibold text-foreground">{totalCategories}</span> categories</p>
          </div>
        </header>

        {selectedDepartment ? (
          <section className="mt-7">
            <Link href={`/categories${query ? `?q=${encodeURIComponent(query)}` : ''}`} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" /> All departments</Link>
            <div className="agora-card mt-4 rounded-2xl px-4 py-5 sm:px-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Department</p><div className="mt-1 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-foreground">{selectedDepartment.name}</h2><span className="text-xs text-muted-foreground">{selectedDepartment.children?.length || 0} categories</span></div><div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">{selectedDepartment.children?.map((category) => <Link key={category.id} href={`/categories?category=${category.id}&department=${selectedDepartment.id}`} className="flex items-center justify-between border-b border-border py-3 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-primary"><span>{category.name}</span><span className="text-xs">{productCounts.get(category.id) || 0}</span></Link>)}</div></div>
          </section>
        ) : (
          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-foreground">Departments</h2><p className="mt-1 text-sm text-muted-foreground">Choose a department to see every category.</p></div>{query && <Link href="/categories" className="text-sm font-medium text-primary">Clear search</Link>}</div>
            {visibleDepartments.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleDepartments.map((department) => { const children = department.children || []; const preview = query ? children.filter((category) => category.name.toLowerCase().includes(query)) : children.slice(0, 6); const remaining = Math.max(0, children.length - preview.length); return <section key={department.id} className="agora-card rounded-2xl p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-foreground">{department.name}</h3><p className="mt-1 text-xs text-muted-foreground">{children.length} categories</p></div><Link href={`/categories?department=${department.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`} className="inline-flex size-8 items-center justify-center rounded-full border border-border text-primary transition hover:border-primary/50 hover:bg-primary/10" aria-label={`View all ${department.name} categories`}><ArrowRight className="size-4" /></Link></div><div className="mt-3 space-y-1">{preview.map((category) => <Link key={category.id} href={`/categories?category=${category.id}&department=${department.id}`} className="flex items-center justify-between py-1.5 text-sm text-muted-foreground transition hover:text-primary"><span className="truncate pr-3">{category.name}</span><span className="shrink-0 text-[11px]">{productCounts.get(category.id) || 0}</span></Link>)}</div>{remaining > 0 && <Link href={`/categories?department=${department.id}`} className="mt-3 inline-flex text-xs font-semibold text-primary">View all {children.length} categories <ArrowRight className="ml-1 size-3.5" /></Link>}</section>; })}</div> : <div className="agora-card rounded-2xl border-dashed py-16 text-center text-sm text-muted-foreground">No departments or categories match “{resolvedSearchParams.q}”.</div>}
          </section>
        )}

        {selectedNode && <section className="mt-10"><div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Category results</p><h2 className="mt-1 text-xl font-semibold text-foreground">{selectedNode.name}</h2><p className="mt-1 text-sm text-muted-foreground">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available</p></div><Link href={`/categories?department=${selectedDepartment?.id || ''}`} className="text-sm font-medium text-primary">Change category</Link></div>{filteredProducts.length > 0 ? <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">{filteredProducts.map((product) => <div key={product.id} className="min-w-0"><ProductCard product={product} /></div>)}</div> : <div className="agora-card rounded-2xl border-dashed py-14 text-center text-sm text-muted-foreground">No products in this category yet.</div>}</section>}
      </main>
    </PublicShell>
  );
}
