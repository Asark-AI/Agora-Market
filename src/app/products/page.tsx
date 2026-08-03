import { getActiveProducts, getActiveSellers, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { MarketplaceProductsBrowser } from '@/components/marketplace-products-browser';

export default async function ProductsPage() {
  const [products, sellers] = await Promise.all([getActiveProducts(), getActiveSellers()]);
  const categories = getCategoryOptions();

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <MarketplaceProductsBrowser initialProducts={products} categories={categories} sellers={sellers} />
      </div>
    </PublicShell>
  );
}
