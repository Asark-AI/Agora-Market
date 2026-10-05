import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import { CheckoutValidationError, checkoutSubtotal, currentProductUnitPrice, parseCheckoutLines, type RequestedCheckoutLine } from '@/lib/server/checkout-pricing';

export { CheckoutValidationError } from '@/lib/server/checkout-pricing';

export type ValidatedCheckoutLine = RequestedCheckoutLine & { unitPrice: number; productName: string; image: string | null };

export async function validateCheckoutLines(input: unknown): Promise<{ lines: ValidatedCheckoutLine[]; subtotal: number }> {
  const requested = parseCheckoutLines(input);

  const db = getAdminDb();
  const sellers = [...new Set(requested.map((line) => line.sellerId))];
  const [sellerSnapshots, productSnapshots] = await Promise.all([
    Promise.all(sellers.map((sellerId) => db.collection('sellers').doc(sellerId).get())),
    Promise.all(requested.map((line) => db.collection('sellers').doc(line.sellerId).collection('products').doc(line.productId).get())),
  ]);
  const sellerData = new Map(sellers.map((sellerId, index) => [sellerId, sellerSnapshots[index].data()]));

  const lines = requested.map((line, index) => {
    const productSnapshot = productSnapshots[index];
    const product = productSnapshot.data();
    if (!sellerData.get(line.sellerId) || sellerData.get(line.sellerId)?.status !== 'active') {
      throw new CheckoutValidationError('A seller in your cart is currently unavailable.', 409);
    }
    if (!productSnapshot.exists || product?.status !== 'active') {
      throw new CheckoutValidationError('A product in your cart is no longer available. Review your cart.', 409);
    }
    const stock = product.stock;
    if (typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < line.quantity) {
      throw new CheckoutValidationError(`${String(product.name || 'A product')} does not have enough stock.`, 409);
    }
    const unitPrice = currentProductUnitPrice(product);
    return {
      ...line,
      unitPrice,
      productName: String(product.name || 'Marketplace product'),
      image: Array.isArray(product.images) && typeof product.images[0] === 'string' ? product.images[0] : null,
    };
  });

  return { lines, subtotal: checkoutSubtotal(lines) };
}
