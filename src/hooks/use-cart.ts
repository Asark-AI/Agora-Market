
'use client';
import { create } from 'zustand';
import type { Product, ServiceProduct } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

type CartItem = {
  product: Product | ServiceProduct;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  addToCart: (product: Product | ServiceProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  addToCart: (product) => {
    const currentItems = get().items;
    const existingItemIndex = currentItems.findIndex((item) => item.product.id === product.id);

    if (existingItemIndex > -1) {
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity += 1;
      set({ items: updatedItems });
    } else {
      set({ items: [...currentItems, { product, quantity: 1 }] });
    }

    toast({ title: 'Added to cart', description: `${product.name} has been added to your cart.` });
  },
  removeFromCart: (productId) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
    toast({ title: 'Item removed', description: 'The item has been removed from your cart.' });
  },
  updateQuantity: (productId, quantity) => {
    const newQuantity = Math.max(0, quantity);
    if (newQuantity === 0) {
      get().removeFromCart(productId);
    } else {
      set({
        items: get().items.map((item) =>
          item.product.id === productId ? { ...item, quantity: newQuantity } : item
        ),
      });
    }
  },
  clearCart: () => set({ items: [] }),
}));
