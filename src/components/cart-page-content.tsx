'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { SiteHeader } from '@/components/site-header';
import { ProductCard } from '@/components/product-card';
import type { Product, Seller } from '@/lib/types';
import { getImageUrl, type StorefrontProduct } from '@/lib/storefront';

const moneyFormatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value: number) => moneyFormatter.format(value);
const currentPrice = (product: Product) => product.discountPrice != null && product.discountPrice < product.price ? product.discountPrice : product.price;

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
    return sum + currentPrice(item) * quantity;
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

  if (!ready) return <main className="min-h-screen bg-background" />;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background pb-32 text-foreground">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
          <header className="mb-6 flex items-center gap-3 border-b border-border pb-5">
            <Link href="/" aria-label="Continue shopping" className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:text-primary"><ArrowLeft className="size-5" /></Link>
            <div className="min-w-0 flex-1"><p className="agora-pill mb-2">Your selection</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Shopping cart <span className="text-muted-foreground">({items.length})</span></h1><p className="mt-1 text-sm text-muted-foreground">Products from Agora sellers</p></div>
            {items.length > 0 && <button type="button" onClick={toggleAll} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"><span className={`flex size-5 items-center justify-center rounded border ${allSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{allSelected && <Check className="size-3.5" />}</span>Select all</button>}
          </header>

          {items.length === 0 ? (
            <>
              <section className="agora-card flex flex-wrap items-center justify-between gap-5 rounded-2xl px-5 py-6 sm:px-7 sm:py-7" aria-labelledby="empty-cart-title">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><ShoppingBag className="size-5" /></div>
                  <div><h2 id="empty-cart-title" className="text-base font-semibold">Your cart is empty</h2><p className="mt-1 text-sm text-muted-foreground">Find something useful from Agora sellers.</p></div>
                </div>
                <Link href="/products" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Browse products</Link>
              </section>
              {suggestedProducts.length > 0 ? (
                <section className="mt-6" aria-labelledby="empty-cart-recommendations-title">
                  <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">A good place to start</p><h2 id="empty-cart-recommendations-title" className="mt-1 text-lg font-semibold">Recommended products</h2></div><Link href="/products" className="text-sm font-medium text-primary hover:underline">See all</Link></div>
                  <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {suggestedProducts.map((product) => <div key={product.id} className="min-w-0"><ProductCard product={product} /></div>)}
                  </div>
                </section>
              ) : <p className="py-10 text-center text-sm text-muted-foreground">New products are arriving soon.</p>}
            </>
          ) : (
            <>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div className="min-w-0">
              <section aria-label="Cart items" className="space-y-3">
                {items.map(({ product, quantity }) => {
                  const item = product as Product;
                  const price = currentPrice(item);
                  const originalPrice = price < item.price ? item.price : null;
                  const discountPercent = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
                  const sellerName = sellersById.get(item.sellerId)?.name || 'Agora seller';
                  const checked = selected.has(product.id);
                  return (
                    <article key={product.id} className="agora-card grid grid-cols-[20px_80px_minmax(0,1fr)] gap-3 rounded-2xl p-3 sm:grid-cols-[20px_112px_minmax(0,1fr)] sm:gap-4 sm:p-4">
                      <button type="button" aria-label={`${checked ? 'Deselect' : 'Select'} ${product.name}`} aria-pressed={checked} onClick={() => toggleItem(product.id)} className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{checked && <Check className="size-3.5" />}</button>
                      <Link href={`/product/${product.id}`} className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-28">
                        <Image src={getImageUrl(item.images?.[0])} alt={product.name} fill sizes="(max-width: 640px) 80px, 112px" className="object-contain p-1.5" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/product/${product.id}`} className="line-clamp-2 text-sm font-semibold leading-5 text-foreground transition hover:text-primary">{product.name}</Link>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{sellerName}</p>
                          </div>
                          <button type="button" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`} className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">Delivery estimate at checkout</p>
                        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <p className="text-base font-bold text-foreground">{money(price)}</p>
                          {originalPrice && <><p className="text-xs text-muted-foreground line-through">{money(originalPrice)}</p><span className="text-[10px] font-semibold text-primary">-{discountPercent}%</span></>}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex h-9 items-center rounded-lg border border-border bg-background">
                            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => updateQuantity(product.id, quantity - 1)} className="flex size-9 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:opacity-35"><Minus className="size-4" /></button>
                            <span className="min-w-8 text-center text-sm tabular-nums">{quantity}</span>
                            <button type="button" aria-label="Increase quantity" disabled={quantity >= item.stock} onClick={() => updateQuantity(product.id, quantity + 1)} className="flex size-9 items-center justify-center text-primary transition hover:text-primary/80 disabled:opacity-35"><Plus className="size-4" /></button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              {suggestedProducts.length > 0 && <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Picked for you</p><h2 className="mt-1 text-lg font-semibold">Recommended products</h2></div><Link href="/products" className="rounded px-2 py-1 text-sm font-medium text-primary transition hover:bg-primary/10">See all</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{suggestedProducts.map((product) => <Link key={product.id} href={`/product/${product.id}`} className="agora-card min-w-0 overflow-hidden rounded-xl transition hover:border-primary/40"><div className="relative aspect-square overflow-hidden bg-muted"><Image src={product.images?.[0] || '/placeholder.png'} alt={product.name} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" /></div><div className="p-3"><p className="line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{product.name}</p><p className="mt-1 text-sm font-semibold">{money(product.discountPrice ?? product.price)}</p></div></Link>)}</div></section>}
                </div>
                <aside className="hidden lg:block" aria-label="Order summary">
                  <div className="agora-card sticky top-6 rounded-2xl p-5">
                    <h2 className="text-base font-semibold">Order summary</h2>
                    <dl className="mt-5 space-y-3 border-b border-border pb-4 text-sm">
                      <div className="flex justify-between gap-4 text-muted-foreground"><dt>Selected items</dt><dd className="font-medium tabular-nums text-foreground">{selectedCount}</dd></div>
                      <div className="flex justify-between gap-4 text-muted-foreground"><dt>Subtotal</dt><dd className="font-semibold tabular-nums text-foreground">{money(subtotal)}</dd></div>
                    </dl>
                    <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShoppingBag className="mt-0.5 size-4 shrink-0 text-primary" /><p>Delivery and any applicable fees are calculated at checkout.</p></div>
                    <button type="button" onClick={checkout} disabled={!selectedItems.length} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">Continue to checkout <span aria-hidden="true">→</span></button>
                    <Link href="/products" className="mt-3 flex h-10 items-center justify-center rounded-lg text-sm font-medium text-primary transition hover:bg-primary/10">Continue shopping</Link>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      {items.length > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:hidden"><div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6"><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected</p><p className="mt-0.5 text-lg font-semibold tabular-nums">{money(subtotal)}</p></div><button type="button" onClick={checkout} disabled={!selectedItems.length} className="flex h-12 min-w-40 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">Checkout <span aria-hidden="true">→</span></button></div></div>}
    </>
  );
}
