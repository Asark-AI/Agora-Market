import { getActiveProducts, getCategoryOptions } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { FlashDealsBrowser } from '@/components/flash-deals-browser';

export default async function FlashDealsPage() {
  const categories = getCategoryOptions();
  const products = await getActiveProducts();
  return <PublicShell><FlashDealsBrowser products={products} categories={categories} /></PublicShell>;
}