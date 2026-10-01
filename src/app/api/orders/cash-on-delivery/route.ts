import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/server/admin-auth';
import { CheckoutValidationError, validateCheckoutLines } from '@/lib/server/checkout-validation';

export async function POST(request: Request) {
  const identity = await verifySession();
  if (!identity) return NextResponse.json({ error: 'Sign in to place your order.' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const address = typeof body?.address === 'string' ? body.address.trim() : '';
    const city = typeof body?.city === 'string' ? body.city.trim() : '';
    const instructions = typeof body?.instructions === 'string' ? body.instructions.trim() : '';
    if (customerName.length < 2 || phone.length < 7 || address.length < 5 || city.length < 2) {
      return NextResponse.json({ error: 'Enter your name, phone number, delivery address and city.' }, { status: 400 });
    }

    const { lines, subtotal } = await validateCheckoutLines(body?.items);
    const db = getAdminDb();
    const orderGroupId = `AGO-${Date.now().toString().slice(-6)}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const sellerIds = [...new Set(lines.map((line) => line.sellerId))];
    const groupedLines = new Map(sellerIds.map((sellerId) => [sellerId, lines.filter((line) => line.sellerId === sellerId)]));
    const orderRefs = new Map(sellerIds.map((sellerId) => [sellerId, db.collection('sellers').doc(sellerId).collection('orders').doc()]));
    const productRefs = lines.map((line) => db.collection('sellers').doc(line.sellerId).collection('products').doc(line.productId));
    const sellerRefs = sellerIds.map((sellerId) => db.collection('sellers').doc(sellerId));
    const now = new Date().toISOString();
    const addressRecord = { name: customerName, phone, address, city, instructions: instructions || null };

    await db.runTransaction(async (transaction) => {
      const [sellerSnapshots, productSnapshots] = await Promise.all([
        Promise.all(sellerRefs.map((ref) => transaction.get(ref))),
        Promise.all(productRefs.map((ref) => transaction.get(ref))),
      ]);
      if (sellerSnapshots.some((snapshot) => !snapshot.exists || snapshot.data()?.status !== 'active')) {
        throw new CheckoutValidationError('A seller in your cart is currently unavailable.', 409);
      }
      const liveLines = lines.map((line, index) => {
        const snapshot = productSnapshots[index];
        const product = snapshot.data();
        if (!snapshot.exists || product?.status !== 'active') throw new CheckoutValidationError('A product in your cart is no longer available.', 409);
        const stock = Number(product.stock ?? 0);
        if (stock < line.quantity) throw new CheckoutValidationError(`${String(product.name || 'A product')} does not have enough stock.`, 409);
        const unitPrice = Number(product.discountPrice ?? product.price);
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new CheckoutValidationError('A product has an invalid price.', 409);
        return { ...line, unitPrice, productName: String(product.name || line.productName), image: Array.isArray(product.images) ? product.images[0] || null : null, index, stockBefore: stock };
      });
      const currentSubtotal = liveLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
      if (Math.abs(currentSubtotal - subtotal) > 0.01) throw new CheckoutValidationError('A product price changed. Review your order and try again.', 409);

      for (const line of liveLines) {
        const product = productSnapshots[line.index].data();
        const soldCount = Number(product?.soldCount ?? 0);
        transaction.update(productRefs[line.index], {
          stock: line.stockBefore - line.quantity,
          soldCount: Math.max(0, Number.isFinite(soldCount) ? soldCount : 0) + line.quantity,
        });
      }
      for (const sellerId of sellerIds) {
        const sellerLines = liveLines.filter((line) => line.sellerId === sellerId);
        const orderTotal = sellerLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
        transaction.set(orderRefs.get(sellerId)!, {
          marketplaceOrderId: orderGroupId,
          buyerId: identity.uid,
          userId: identity.uid,
          date: now,
          createdAt: now,
          updatedAt: now,
          total: Number(orderTotal.toFixed(2)),
          subtotal: Number(orderTotal.toFixed(2)),
          deliveryFee: null,
          deliveryFeeStatus: 'seller_to_confirm',
          status: 'pending',
          paymentMethod: 'cash',
          paymentStatus: 'PENDING',
          items: sellerLines.map(({ index: _index, stockBefore: _stockBefore, ...line }) => ({ productId: line.productId, quantity: line.quantity, price: line.unitPrice, productName: line.productName, image: line.image, sellerId })),
          deliveryAddress: addressRecord,
        });
      }
    });

    return NextResponse.json({
      ok: true,
      marketplaceOrderId: orderGroupId,
      orderIds: Object.fromEntries([...orderRefs.entries()].map(([sellerId, ref]) => [sellerId, ref.id])),
      subtotal,
    });
  } catch (error) {
    const status = error instanceof CheckoutValidationError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unable to place your order.';
    return NextResponse.json({ error: message }, { status });
  }
}
