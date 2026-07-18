'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, ServiceProduct } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export type WishlistItem = {
  product: Product | ServiceProduct;
};

interface WishlistState {
  items: WishlistItem[];
  addToWishlist: (product: Product | ServiceProduct) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product | ServiceProduct) => void;
  isFavorite: (productId: string) => boolean;
}

export const useWishlist = create(
  persist<WishlistState>(
    (set, get) => ({
      items: [],
      addToWishlist: (product) => {
        const existing = get().items.some((item) => item.product.id === product.id);
        if (existing) return;
        set({ items: [...get().items, { product }] });
        toast({ title: 'Saved to wishlist', description: `${product.name} was added to your wishlist.` });
      },
      removeFromWishlist: (productId) => {
        set({ items: get().items.filter((item) => item.product.id !== productId) });
        toast({ title: 'Removed from wishlist', description: 'The item was removed from your wishlist.' });
      },
      toggleWishlist: (product) => {
        const existing = get().items.some((item) => item.product.id === product.id);
        if (existing) {
          get().removeFromWishlist(product.id);
        } else {
          get().addToWishlist(product);
        }
      },
      isFavorite: (productId) => get().items.some((item) => item.product.id === productId),
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
