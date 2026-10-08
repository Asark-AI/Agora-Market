type PurchaseOrder = {
  sellerId?: unknown;
  items?: unknown;
};

export function orderContainsProduct(
  order: PurchaseOrder,
  sellerId: string,
  productId: string,
  sellerScopeId?: string
) {
  const orderSellerId = sellerScopeId || (typeof order.sellerId === 'string' ? order.sellerId : undefined);
  if (orderSellerId !== sellerId || !Array.isArray(order.items)) return false;

  return order.items.some((item) =>
    item !== null
    && typeof item === 'object'
    && 'productId' in item
    && item.productId === productId
  );
}
