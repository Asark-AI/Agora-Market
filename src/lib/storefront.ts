import { db } from '@/lib/firebase';
import type { Product, Seller } from '@/lib/types';
import { categories as catalogCategories } from '@/lib/data';

export type StorefrontProduct = Product & {
  seller?: Seller;
  sellerName?: string;
};

const PUBLIC_PRODUCT_LIMIT = 120;

const DEFAULT_PRODUCT_IMAGE = 'https://placehold.co/600x600.png';
const DEFAULT_BANNER = 'https://picsum.photos/seed/store/1200/400';

function sanitizeForClient<T>(value: T): T {
  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  if (value && typeof value === 'object') {
    const maybeJsonValue = value as unknown as { toJSON?: () => unknown };
    if (typeof maybeJsonValue.toJSON === 'function') {
      return sanitizeForClient(maybeJsonValue.toJSON() as T);
    }

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeForClient(item)) as T;
    }

    if (value.constructor === Object) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, sanitizeForClient(entryValue)])
      ) as T;
    }
  }

  return value;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildProductSlug(product: Pick<Product, 'name' | 'id'>) {
  return `${slugify(product.name)}-${product.id}`;
}

export function buildSellerSlug(seller: Pick<Seller, 'name' | 'id'>) {
  return `${slugify(seller.name)}-${seller.id}`;
}

export function getCategoryLabel(categoryId?: string) {
  return catalogCategories.find((category) => category.id === categoryId)?.name || 'General';
}

export function getCategoryOptions() {
  return catalogCategories.filter((category) => category.type === 'product');
}

export function getImageUrl(image?: string | null) {
  return image || DEFAULT_PRODUCT_IMAGE;
}

export function getStoreBannerUrl(image?: string | null) {
  return image || DEFAULT_BANNER;
}

async function getFirestoreModule() {
  if (!db) return null;

  try {
    return await import('firebase/firestore');
  } catch (error) {
    console.warn('Unable to load Firestore module for storefront data:', error);
    return null;
  }
}

export async function getActiveSellers(): Promise<Seller[]> {
  const firestore = await getFirestoreModule();
  if (!db || !firestore) return [];

  try {
    const { collection, getDocs, query, where } = firestore;
    const sellersSnapshot = await getDocs(query(collection(db, 'sellers'), where('status', '==', 'active')));
    return sellersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(sanitizeForClient(doc.data() as Omit<Seller, 'id'>) as Omit<Seller, 'id'>),
    }) as Seller);
  } catch (error) {
    console.warn('Unable to load active sellers:', error);
    return [];
  }
}

export async function getActiveProducts(activeSellers?: Seller[]): Promise<StorefrontProduct[]> {
  const firestore = await getFirestoreModule();
  if (!db || !firestore) return [];

  const firestoreDb = db;
  const { collectionGroup, getDocs, limit, query, where } = firestore;
  let productsSnapshot;
  try {
    // Keep this query to a single-field filter so it works without a deployed composite index.
    productsSnapshot = await getDocs(query(collectionGroup(firestoreDb, 'products'), where('status', '==', 'active'), limit(PUBLIC_PRODUCT_LIMIT)));
  } catch (error) {
    console.warn('Unable to load active products:', error);
    return [];
  }

  const sellers = activeSellers ?? await getActiveSellers();
  const sellersById = new Map(sellers.map((seller) => [seller.id, seller]));

  const products = productsSnapshot.docs.map((document) => {
    const product = sanitizeForClient(document.data() as Omit<Product, 'id'>) as Omit<Product, 'id'>;
    const seller = sellersById.get(product.sellerId);
    return {
      id: document.id,
      ...product,
      seller,
      sellerName: seller?.name,
    } as StorefrontProduct;
  });

  return products.sort((a, b) => (b.views || 0) - (a.views || 0));
}

export async function getProductBySlug(slug: string, activeProducts?: StorefrontProduct[]): Promise<StorefrontProduct | null> {
  const products = activeProducts ?? await getActiveProducts();
  return (
    products.find((product) => {
      const generatedSlug = buildProductSlug(product);
      return generatedSlug === slug || slugify(product.name) === slug || product.id === slug;
    }) || null
  );
}

export async function getSellerBySlug(slug: string): Promise<Seller | null> {
  const sellers = await getActiveSellers();
  return (
    sellers.find((seller) => {
      const generatedSlug = buildSellerSlug(seller);
      return generatedSlug === slug || slugify(seller.name) === slug || seller.id === slug;
    }) || null
  );
}

export async function getProductsByCategory(categoryId: string): Promise<StorefrontProduct[]> {
  const products = await getActiveProducts();
  return products.filter((product) => product.categoryId === categoryId);
}

export async function getRelatedProducts(product: StorefrontProduct, activeProducts?: StorefrontProduct[]): Promise<StorefrontProduct[]> {
  const products = activeProducts ?? await getActiveProducts();
  return products
    .filter((item) => item.id !== product.id && (item.categoryId === product.categoryId || item.sellerId === product.sellerId))
    .slice(0, 6);
}
