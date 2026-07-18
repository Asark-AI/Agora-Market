import { collection, collectionGroup, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, Seller } from '@/lib/types';
import { categories as catalogCategories } from '@/lib/data';

export type StorefrontProduct = Product & {
  seller?: Seller;
  sellerName?: string;
};

const DEFAULT_PRODUCT_IMAGE = 'https://placehold.co/600x600.png';
const DEFAULT_BANNER = 'https://picsum.photos/seed/store/1200/400';

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

export async function getActiveSellers(): Promise<Seller[]> {
  if (!db) return [];

  const sellersSnapshot = await getDocs(query(collection(db, 'sellers'), where('status', '==', 'active')));
  return sellersSnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Seller, 'id'>) } as Seller));
}

export async function getActiveProducts(): Promise<StorefrontProduct[]> {
  if (!db) return [];

  const sellers = await getActiveSellers();
  const products: StorefrontProduct[] = [];

  for (const seller of sellers) {
    const sellerProductsSnapshot = await getDocs(query(collection(db, 'sellers', seller.id, 'products'), where('status', '==', 'active')));
    const sellerProducts = sellerProductsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Product, 'id'>),
      seller,
      sellerName: seller.name,
    })) as StorefrontProduct[];

    products.push(...sellerProducts);
  }

  return products.sort((a, b) => (b.views || 0) - (a.views || 0));
}

export async function getProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const products = await getActiveProducts();
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

export async function getRelatedProducts(product: StorefrontProduct): Promise<StorefrontProduct[]> {
  const products = await getActiveProducts();
  return products
    .filter((item) => item.id !== product.id && (item.categoryId === product.categoryId || item.sellerId === product.sellerId))
    .slice(0, 6);
}
