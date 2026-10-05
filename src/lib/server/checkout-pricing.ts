export class CheckoutValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'CheckoutValidationError';
    this.status = status;
  }
}

export type RequestedCheckoutLine = { sellerId: string; productId: string; quantity: number };
export type PricedCheckoutLine = { unitPrice: number; quantity: number };

const MAX_LINES = 50;
const MAX_QUANTITY = 99;
const MAX_DOCUMENT_ID_LENGTH = 128;

function toMinorUnits(value: unknown, label: string, allowZero = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    throw new CheckoutValidationError(`${label} is invalid.`, 409);
  }

  const minorUnits = Math.round(value * 100);
  if (!Number.isSafeInteger(minorUnits) || Math.abs(value * 100 - minorUnits) > 1e-7) {
    throw new CheckoutValidationError(`${label} is invalid.`, 409);
  }
  return minorUnits;
}

function isValidDocumentId(value: string) {
  return value.length <= MAX_DOCUMENT_ID_LENGTH
    && value !== '.'
    && value !== '..'
    && !/[\/\u0000-\u001f\u007f]/.test(value);
}

export function parseCheckoutLines(input: unknown): RequestedCheckoutLine[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_LINES) {
    throw new CheckoutValidationError('Select at least one item to continue.');
  }

  const seen = new Set<string>();
  return input.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new CheckoutValidationError('One or more cart items are invalid. Review your cart and try again.');
    }

    const line = raw as Record<string, unknown>;
    const sellerId = typeof line.sellerId === 'string' ? line.sellerId.trim() : '';
    const productId = typeof line.productId === 'string' ? line.productId.trim() : '';
    const quantity = line.quantity;
    const key = `${sellerId.length}:${sellerId}${productId}`;
    if (
      !sellerId ||
      !productId ||
      !isValidDocumentId(sellerId) ||
      !isValidDocumentId(productId) ||
      typeof quantity !== 'number' ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY ||
      seen.has(key)
    ) {
      throw new CheckoutValidationError('One or more cart items are invalid. Review your cart and try again.');
    }
    seen.add(key);
    return { sellerId, productId, quantity };
  });
}

export function currentProductUnitPrice(product: Record<string, unknown>) {
  const priceMinor = toMinorUnits(product.price, 'A product in your cart has an invalid price.');
  const discountPrice = product.discountPrice;
  if (discountPrice === undefined || discountPrice === null || discountPrice === 0) {
    return priceMinor / 100;
  }

  const discountMinor = toMinorUnits(discountPrice, 'A product in your cart has an invalid discount price.');
  if (discountMinor >= priceMinor) {
    throw new CheckoutValidationError('A product in your cart has an invalid discount price.', 409);
  }
  return discountMinor / 100;
}

export function checkoutSubtotalMinor(lines: readonly PricedCheckoutLine[]) {
  let totalMinor = 0;
  for (const line of lines) {
    const unitMinor = toMinorUnits(line.unitPrice, 'A product in your cart has an invalid price.');
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) {
      throw new CheckoutValidationError('One or more cart quantities are invalid.');
    }
    const lineMinor = unitMinor * line.quantity;
    if (!Number.isSafeInteger(lineMinor) || !Number.isSafeInteger(totalMinor + lineMinor)) {
      throw new CheckoutValidationError('The order total is outside the supported range.');
    }
    totalMinor += lineMinor;
  }
  return totalMinor;
}

export function checkoutSubtotal(lines: readonly PricedCheckoutLine[]) {
  return checkoutSubtotalMinor(lines) / 100;
}

export function assertSubmittedSubtotalMatches(body: Record<string, unknown>, subtotal: number) {
  if ('currency' in body && body.currency !== 'GHS') {
    throw new CheckoutValidationError('Only GHS payments are currently supported.', 409);
  }

  for (const field of ['shippingFee', 'deliveryFee', 'discount', 'discountAmount', 'finalTotal', 'total'] as const) {
    if (field in body) {
      throw new CheckoutValidationError(`The submitted ${field} is not supported; checkout totals are calculated by Agora.`, 409);
    }
  }

  for (const field of ['amountMajor', 'amount'] as const) {
    if (!(field in body)) continue;
    const submittedMinor = toMinorUnits(body[field], 'The submitted order total is invalid.', true);
    if (submittedMinor !== toMinorUnits(subtotal, 'The current order total is invalid.', true)) {
      throw new CheckoutValidationError('Product prices changed. Review your cart and try again.', 409);
    }
  }
}
