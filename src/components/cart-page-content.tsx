'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { SiteHeader } from '@/components/site-header';
import type { Product, Seller } from '@/lib/types';
import type { StorefrontProduct } from '@/lib/storefront';

const money = (value: number) => `GH₵${value.toFixed(2)}`;

export function CartPageContent({ recommendations, sellers }: { recommendations: StorefrontProduct[]; sellers: Seller[] }) {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const previousIds = useRef<string[]>([]);
  const sellersById = useMemo(() => new Map(sellers.map((seller) => [seller.id, seller])), [sellers]);

  useEffect(() => {
    const currentIds = items.map(({ product }) => product.id);
    if (!ready) {
      setSelectedIds(currentIds);
      previousIds.current = currentIds;
      setReady(true);
      return;
    }
    setSelectedIds((current) => [
      ...current.filter((id) => currentIds.includes(id)),
      ...currentIds.filter((id) => !previousIds.current.includes(id)),
    ]);
    previousIds.current = currentIds;
  }, [items, ready]);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = items.filter(({ product }) => selected.has(product.id));
  const subtotal = selectedItems.reduce((sum, { product, quantity }) => {
    const item = product as Product;
    return sum + (item.discountPrice ?? item.price ?? 0) * quantity;
  }, 0);
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const allSelected = items.length > 0 && items.every(({ product }) => selected.has(product.id));
  const suggestedProducts = recommendations.filter((product) => !items.some((item) => item.product.id === product.id)).slice(0, 4);

  const toggleAll = () => setSelectedIds(allSelected ? [] : items.map(({ product }) => product.id));
  const toggleItem = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const checkout = () => {
    if (!selectedItems.length) return;
    window.sessionStorage.setItem('agora-checkout-selection', JSON.stringify(selectedItems.map(({ product }) => product.id)));
    router.push('/checkout');
  };

  if (!ready) return <main className="min-h-screen bg-[#f7f8fa]" />;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f8fa] pb-32 text-[#1c2633]">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
          <header className="mb-5 flex items-center gap-3 border-b border-[#e3e7eb] pb-4">
            <Link href="/" aria-label="Continue shopping" className="inline-flex size-10 items-center justify-center text-[#26384a] hover:text-[#1769aa]"><ArrowLeft className="size-5" /></Link>
            <div className="min-w-0 flex-1"><h1 className="text-xl font-semibold">Cart <span className="text-[#788493]">({items.length})</span></h1><p className="mt-0.5 text-xs text-[#74808d]">Products from Agora sellers</p></div>
            {items.length > 0 && <button type="button" onClick={toggleAll} className="inline-flex items-center gap-2 py-2 text-sm font-medium text-[#1769aa]"><span className={`flex size-5 items-center justify-center border ${allSelected ? 'border-[#1769aa] bg-[#1769aa] text-white' : 'border-[#aab4bf] bg-white'}`}>{allSelected && <Check className="size-3.5" />}</span>Select all</button>}
          </header>

          {items.length === 0 ? (
            <section className="grid min-h-[45vh] place-items-center text-center">
              <div><ShoppingBag className="mx-auto size-10 text-[#9aa5b1]" /><h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2><p className="mt-2 text-sm text-[#74808d]">Find something useful from Agora sellers.</p><Link href="/products" className="mt-5 inline-flex h-11 items-center bg-[#1769aa] px-5 text-sm font-semibold text-white hover:bg-[#12588f]">Browse products</Link></div>
            </section>
          ) : (
            <>
              <section aria-label="Cart items" className="divide-y divide-[#e3e7eb] border-y border-[#e3e7eb] bg-white">
                {items.map(({ product, quantity }) => {
                  const item = product as Product;
                  const price = item.discountPrice ?? item.price ?? 0;
                  const sellerName = sellersById.get(item.sellerId)?.name || 'Agora seller';
                  const checked = selected.has(product.id);
                  return (
                    <article key={product.id} className="flex gap-3 px-3 py-4 sm:gap-4 sm:px-4">
                      <button type="button" aria-label={`${checked ? 'Deselect' : 'Select'} ${product.name}`} aria-pressed={checked} onClick={() => toggleItem(product.id)} className={`mt-1 flex size-5 shrink-0 items-center justify-center border ${checked ? 'border-[#1769aa] bg-[#1769aa] text-white' : 'border-[#aab4bf] bg-white'}`}>{checked && <Check className="size-3.5" />}</button>
                      <Link href={`/product/${product.id}`} className="relative size-[88px] shrink-0 overflow-hidden bg-[#f1f3f5] sm:size-24">
                        <Image src={item.images?.[0] || '/placeholder.png'} alt={product.name} fill sizes="96px" className="object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-sm font-medium leading-5 text-[#26384a]">{product.name}</h2>
                        <p className="mt-1 truncate text-xs text-[#74808d]">Seller: {sellerName}</p>
                        <p className="mt-1 text-[11px] text-[#74808d]">Delivery estimate at checkout</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-base font-semibold text-[#1c2633]">{money(price)}</p>
                          <div className="flex h-9 items-center border border-[#d8dee5]">
                            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => updateQuantity(product.id, quantity - 1)} className="flex size-9 items-center justify-center text-[#4d5c6a] disabled:opacity-35"><Minus className="size-4" /></button>
                            <span className="min-w-8 text-center text-sm tabular-nums">{quantity}</span>
                            <button type="button" aria-label="Increase quantity" disabled={quantity >= item.stock} onClick={() => updateQuantity(product.id, quantity + 1)} className="flex size-9 items-center justify-center text-[#1769aa] disabled:opacity-35"><Plus className="size-4" /></button>
                          </div>
                          <button type="button" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`} className="hidden size-9 items-center justify-center text-[#8a95a1] hover:text-[#b42318] sm:inline-flex"><Trash2 className="size-4" /></button>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`} className="inline-flex size-9 shrink-0 items-center justify-center self-end text-[#8a95a1] hover:text-[#b42318] sm:hidden"><Trash2 className="size-4" /></button>
                    </article>
                  );
                })}
              </section>

              {suggestedProducts.length > 0 && <section className="mt-8"><div className="mb-3 flex items-end justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a772b]">Picked for you</p><h2 className="mt-1 text-lg font-semibold">Recommended products</h2></div><Link href="/products" className="text-sm font-medium text-[#1769aa]">See all</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{suggestedProducts.map((product) => <Link key={product.id} href={`/product/${product.id}`} className="min-w-0 bg-white"><div className="relative aspect-square overflow-hidden bg-[#edf0f3]"><Image src={product.images?.[0] || '/placeholder.png'} alt={product.name} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" /></div><div className="p-2.5"><p className="line-clamp-2 min-h-10 text-xs leading-5 text-[#41505f]">{product.name}</p><p className="mt-1 text-sm font-semibold">{money(product.discountPrice ?? product.price)}</p></div></Link>)}</div></section>}
            </>
          )}
        </div>
      </main>
      {items.length > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dce2e8] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(24,41,57,0.06)] backdrop-blur-sm"><div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6"><div className="min-w-0 flex-1"><p className="text-xs text-[#74808d]">{selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected</p><p className="mt-0.5 text-lg font-semibold tabular-nums">{money(subtotal)}</p></div><button type="button" onClick={checkout} disabled={!selectedItems.length} className="flex h-12 min-w-40 items-center justify-center gap-2 bg-[#1769aa] px-5 text-sm font-semibold text-white hover:bg-[#12588f] disabled:cursor-not-allowed disabled:opacity-50">Checkout <span aria-hidden="true">→</span></button></div></div>}
    </>
  );
}
