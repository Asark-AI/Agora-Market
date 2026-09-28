import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';

type RequestedLine = { sellerId: string; productId: string; quantity: number };
export type ValidatedCheckoutLine = RequestedLine & { unitPrice: number; productName: string; image: string | null };

export class CheckoutValidationError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = 'CheckoutValidationError';
  }
}

export async function validateCheckoutLines(input: unknown): Promise<{ lines: ValidatedCheckoutLine[]; subtotal: number }> {
  if (!Array.isArray(input) || input.length === 0 || input.length > 50) {
    throw new CheckoutValidationError('Select at least one item to continue.');
  }

  const seen = new Set<string>();
  const requested: RequestedLine[] = input.map((raw: unknown) => {
    const line = raw as Record<string, unknown>;
    const sellerId = typeof line?.sellerId === 'string' ? line.sellerId.trim() : '';
    const productId = typeof line?.productId === 'string' ? line.productId.trim() : '';
    const quantity = Number(line?.quantity);
    const key = `${sellerId}/${productId}`;
    if (!sellerId || !productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || seen.has(key)) {
      throw new CheckoutValidationError('One or more cart items are invalid. Review your cart and try again.');
    }
    seen.add(key);
    return { sellerId, productId, quantity };
  });

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
    const stock = Number(product.stock ?? 0);
    if (!Number.isInteger(stock) || stock < line.quantity) {
      throw new CheckoutValidationError(`${String(product.name || 'A product')} does not have enough stock.`, 409);
    }
    const unitPrice = Number(product.discountPrice ?? product.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new CheckoutValidationError('A product in your cart has an invalid price.', 409);
    }
    return {
      ...line,
      unitPrice,
      productName: String(product.name || 'Marketplace product'),
      image: Array.isArray(product.images) && typeof product.images[0] === 'string' ? product.images[0] : null,
    };
  });

  return { lines, subtotal: Number(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0).toFixed(2)) };
}
