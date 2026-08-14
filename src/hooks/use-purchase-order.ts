"use client";
import { create } from 'zustand';
import type { Product } from '@/lib/types';

type PurchaseOrderItem = {
  product: Product;
  quantity: number;
  cost: number;
};

interface PurchaseOrderState {
  items: PurchaseOrderItem[];
  addItem: (product: Product) => void;
  updateItem: (productId: string, field: 'quantity' | 'cost', value: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalCost: () => number;
}

export const usePurchaseOrder = create<PurchaseOrderState>((set, get) => ({
  items: [],
  addItem: (product) => {
    const existing = get().items.find((i) => i.product.id === product.id);
    if (!existing) {
      set({ items: [...get().items, { product, quantity: 1, cost: 0 }] });
    }
  },
  updateItem: (productId, field, value) => {
    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, [field]: Math.max(0, value) } : item
      ),
    });
  },
  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) });
  },
  clear: () => set({ items: [] }),
  totalCost: () => get().items.reduce((acc, it) => acc + it.quantity * it.cost, 0),
}));

export default usePurchaseOrder;
