import { CartPageContent } from '@/components/cart-page-content';
import { getActiveProducts, getActiveSellers } from '@/lib/storefront';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const [products, sellers] = await Promise.all([getActiveProducts(), getActiveSellers()]);
  return <CartPageContent recommendations={products} sellers={sellers} />;
}
