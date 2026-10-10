import { getActiveProducts, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { MarketplaceProductsBrowser } from '@/components/marketplace-products-browser';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const products = await getActiveProducts();
  const sellers = products.flatMap((product) => product.seller ? [product.seller] : []).filter((seller, index, all) => all.findIndex((entry) => entry.id === seller.id) === index);
  const categories = getCategoryOptions();

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-7xl px-0 py-4 sm:py-8">
        <MarketplaceProductsBrowser initialProducts={products} categories={categories} sellers={sellers} initialQuery={resolvedSearchParams.q || ''} />
      </div>
    </PublicShell>
  );
}
