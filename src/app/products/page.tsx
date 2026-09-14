import { getActiveProducts, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { MarketplaceProductsBrowser } from '@/components/marketplace-products-browser';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getActiveProducts();
  const sellers = products.flatMap((product) => product.seller ? [product.seller] : []).filter((seller, index, all) => all.findIndex((entry) => entry.id === seller.id) === index);
  const categories = getCategoryOptions();

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <MarketplaceProductsBrowser initialProducts={products} categories={categories} sellers={sellers} />
      </div>
    </PublicShell>
  );
}
