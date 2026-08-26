'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product, ServiceProduct } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { enqueueOfflineAction, indexedDbStorage } from '@/lib/offline/storage';

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

export const useWishlist = create<WishlistState>()(persist((set, get) => ({
  items: [],
  addToWishlist: (product) => {
    const existing = get().items.some((item) => item.product.id === product.id);
    if (existing) return;
    set({ items: [...get().items, { product }] });
    void enqueueOfflineAction('wishlist-add', { productId: product.id, product });
    toast({ title: 'Saved to wishlist', description: `${product.name} was added to your wishlist.` });
  },
  removeFromWishlist: (productId) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
    void enqueueOfflineAction('wishlist-remove', { productId });
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
}), {
  name: 'agora-wishlist',
  storage: createJSONStorage(() => indexedDbStorage),
  partialize: (state) => ({ items: state.items }),
}));
