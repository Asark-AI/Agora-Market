import { getActiveProducts } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { electronicsCategoryTree } from '@/lib/electronics-catalog';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage({ searchParams }: { searchParams: { category?: string; department?: string; q?: string } }) {
  const products = await getActiveProducts();
  const selectedCategory = searchParams.category;
  const selectedDepartment = electronicsCategoryTree.find((department) => department.id === searchParams.department);
  const query = searchParams.q?.trim().toLowerCase() || '';
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
        <header className="border-b border-[#e1e6eb] pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a772b]">Agora marketplace</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><h1 className="text-2xl font-semibold tracking-tight text-[#1c2633] sm:text-3xl">Shop by category</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#667482]">Browse departments built for the way people shop for technology, electronics, and everyday products.</p></div>
            <p className="text-sm text-[#74808d]"><span className="font-semibold text-[#1c2633]">{electronicsCategoryTree.length}</span> departments · <span className="font-semibold text-[#1c2633]">{totalCategories}</span> categories</p>
          </div>
          <form action="/categories" className="relative mt-5 max-w-xl"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7d8995]" /><input name="q" defaultValue={searchParams.q || ''} placeholder="Search departments or categories" aria-label="Search departments or categories" className="h-12 w-full rounded-md border border-[#cfd8e1] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#1769aa] focus:ring-2 focus:ring-[#1769aa]/15" /></form>
        </header>

        {selectedDepartment ? (
          <section className="mt-7">
            <Link href={`/categories${query ? `?q=${encodeURIComponent(query)}` : ''}`} className="inline-flex items-center gap-2 text-sm font-medium text-[#1769aa] hover:underline"><ArrowLeft className="size-4" /> All departments</Link>
            <div className="mt-4 border-y border-[#e1e6eb] bg-white px-4 py-5 sm:px-5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a772b]">Department</p><div className="mt-1 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-[#1c2633]">{selectedDepartment.name}</h2><span className="text-xs text-[#74808d]">{selectedDepartment.children?.length || 0} categories</span></div><div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">{selectedDepartment.children?.map((category) => <Link key={category.id} href={`/categories?category=${category.id}&department=${selectedDepartment.id}`} className="flex items-center justify-between border-b border-[#edf0f3] py-3 text-sm text-[#41505f] hover:border-[#1769aa] hover:text-[#1769aa]"><span>{category.name}</span><span className="text-xs text-[#8a95a1]">{productCounts.get(category.id) || 0}</span></Link>)}</div></div>
          </section>
        ) : (
          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-[#1c2633]">Departments</h2><p className="mt-1 text-sm text-[#74808d]">Choose a department to see every category.</p></div>{query && <Link href="/categories" className="text-sm font-medium text-[#1769aa]">Clear search</Link>}</div>
            {visibleDepartments.length > 0 ? <div className="grid gap-x-8 gap-y-0 border-y border-[#e1e6eb] bg-white px-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">{visibleDepartments.map((department) => { const children = department.children || []; const preview = query ? children.filter((category) => category.name.toLowerCase().includes(query)) : children.slice(0, 6); const remaining = Math.max(0, children.length - preview.length); return <section key={department.id} className="border-b border-[#e1e6eb] py-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-[#1c2633]">{department.name}</h3><p className="mt-1 text-xs text-[#74808d]">{children.length} categories</p></div><Link href={`/categories?department=${department.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`} className="inline-flex size-8 items-center justify-center text-[#1769aa]" aria-label={`View all ${department.name} categories`}><ArrowRight className="size-4" /></Link></div><div className="mt-3 space-y-1">{preview.map((category) => <Link key={category.id} href={`/categories?category=${category.id}&department=${department.id}`} className="flex items-center justify-between py-1.5 text-sm text-[#596775] hover:text-[#1769aa]"><span className="truncate pr-3">{category.name}</span><span className="shrink-0 text-[11px] text-[#9aa5af]">{productCounts.get(category.id) || 0}</span></Link>)}</div>{remaining > 0 && <Link href={`/categories?department=${department.id}`} className="mt-3 inline-flex text-xs font-semibold text-[#1769aa]">View all {children.length} categories <ArrowRight className="ml-1 size-3.5" /></Link>}</section>; })}</div> : <div className="border-y border-dashed border-[#d8e0e7] py-16 text-center text-sm text-[#74808d]">No departments or categories match “{searchParams.q}”.</div>}
          </section>
        )}

        {selectedNode && <section className="mt-10"><div className="mb-4 flex items-end justify-between gap-4 border-b border-[#e1e6eb] pb-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a772b]">Category results</p><h2 className="mt-1 text-xl font-semibold text-[#1c2633]">{selectedNode.name}</h2><p className="mt-1 text-sm text-[#74808d]">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available</p></div><Link href={`/categories?department=${selectedDepartment?.id || ''}`} className="text-sm font-medium text-[#1769aa]">Change category</Link></div>{filteredProducts.length > 0 ? <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">{filteredProducts.map((product) => <div key={product.id} className="min-w-0"><ProductCard product={product} /></div>)}</div> : <div className="border-y border-dashed border-[#d8e0e7] py-14 text-center text-sm text-[#74808d]">No products in this category yet.</div>}</section>}
      </main>
    </PublicShell>
  );
}
