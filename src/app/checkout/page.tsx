'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { SiteHeader } from '@/components/site-header';
import { LiquidLoader } from '@/components/liquid-loader';
import { ArrowLeft, Banknote, CreditCard, MapPin, Wallet } from 'lucide-react';
import Link from 'next/link';

const money = (value: number) => `GH₵${value.toFixed(2)}`;
type PaymentChoice = 'paystack' | 'cash';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, removeFromCart } = useCart();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [choice, setChoice] = useState<PaymentChoice>('paystack');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('agora-checkout-selection');
      const ids = raw ? JSON.parse(raw) as string[] : null;
      setSelectedIds(Array.isArray(ids) && ids.length ? ids : items.map(({ product }) => product.id));
    } catch {
      setSelectedIds(items.map(({ product }) => product.id));
    }
  }, [items]);

  useEffect(() => {
    if (user) {
      setCustomerName((current) => current || user.name || '');
      setPhone((current) => current || user.phone || '');
    }
  }, [user]);

  const checkoutItems = useMemo(() => items.filter(({ product }) => selectedIds?.includes(product.id)), [items, selectedIds]);
  const subtotal = checkoutItems.reduce((sum, { product, quantity }) => {
    const item = product as typeof product & { discountPrice?: number; price?: number };
    return sum + Number(item.discountPrice ?? item.price ?? 0) * quantity;
  }, 0);
  const itemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);

  const clearCheckedOutItems = () => checkoutItems.forEach(({ product }) => removeFromCart(product.id));
  const validateAddress = () => {
    if (!customerName.trim() || phone.trim().length < 7 || address.trim().length < 5 || city.trim().length < 2) {
      toast({ variant: 'destructive', title: 'Complete your delivery details', description: 'Enter your name, phone, address and city.' });
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    if (!user) {
      router.push('/sign-in?next=%2Fcheckout');
      return;
    }
    if (!checkoutItems.length) {
      router.push('/cart');
      return;
    }
    if (!validateAddress()) return;
    if (!navigator.onLine) {
      toast({ variant: 'destructive', title: 'Connection required', description: 'Reconnect before placing your order.' });
      return;
    }

    setIsLoading(true);
    const summary = {
      subtotal,
      total: subtotal,
      itemCount,
      items: checkoutItems.map(({ product, quantity }) => ({ productId: product.id, name: product.name, image: (product as { images?: string[] }).images?.[0] || null, quantity })),
      address: `${address.trim()}, ${city.trim()}`,
      paymentMethod: choice,
    };
    try {
      if (choice === 'cash') {
        const response = await fetch('/api/orders/cash-on-delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            customerName,
            phone,
            address,
            city,
            instructions,
            items: checkoutItems.map(({ product, quantity }) => ({ sellerId: product.sellerId, productId: product.id, quantity })),
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.marketplaceOrderId) throw new Error(result.error || 'Could not place your order.');
        window.sessionStorage.setItem('agora-checkout-confirmation', JSON.stringify({ ...summary, orderId: result.marketplaceOrderId, orderIds: result.orderIds, deliveryFeePending: true }));
        clearCheckedOutItems();
        window.sessionStorage.removeItem('agora-checkout-selection');
        router.push(`/checkout/complete?method=cod&orderId=${encodeURIComponent(result.marketplaceOrderId)}`);
        return;
      }

      window.sessionStorage.setItem('agora-checkout-confirmation', JSON.stringify({ ...summary, deliveryFeePending: true }));
      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: user.email,
          amount: Number(subtotal.toFixed(2)),
          amountMajor: Number(subtotal.toFixed(2)),
          callbackUrl: `${window.location.origin}/checkout/complete`,
          address: { name: customerName.trim(), phone: phone.trim(), address: address.trim(), city: city.trim(), instructions: instructions.trim() || null },
          items: checkoutItems.map(({ product, quantity }) => ({ sellerId: product.sellerId, productId: product.id, quantity })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error || 'Unable to start payment.');
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Checkout could not continue', description: error instanceof Error ? error.message : 'Please try again.' });
      setIsLoading(false);
    }
  };

  if (selectedIds === null) return <main className="min-h-screen bg-background" />;
  if (!checkoutItems.length) return <><SiteHeader /><main className="mx-auto max-w-lg px-5 py-20 text-center"><div className="agora-card rounded-2xl px-6 py-10"><h1 className="text-xl font-semibold">No items selected</h1><p className="mt-2 text-sm text-muted-foreground">Return to your cart and choose the items to check out.</p><Link href="/cart" className="mt-5 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">Back to cart</Link></div></main></>;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background pb-28 text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
          <header className="mb-6 flex items-center gap-3 border-b border-border pb-5"><Link href="/cart" aria-label="Back to cart" className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-primary"><ArrowLeft className="size-5" /></Link><div><p className="agora-pill mb-2">Secure checkout</p><h1 className="text-2xl font-semibold tracking-tight">Checkout</h1><p className="mt-1 text-sm text-muted-foreground">Delivery and payment details</p></div></header>

          <section className="agora-card rounded-2xl px-4 py-5 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground"><MapPin className="size-4 text-primary" /> Delivery address</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Recipient name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Full name" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="0XX XXX XXXX" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">Delivery address<input value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="House number, street or landmark" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">Area / city<input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="e.g. Kotobabi, Accra" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">Delivery instructions <span className="font-normal text-muted-foreground">Optional</span><input value={instructions} onChange={(event) => setInstructions(event.target.value)} className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Gate, floor, or directions" /></label>
            </div>
          </section>

          <section className="agora-card mt-5 rounded-2xl px-4 py-5 sm:px-6"><h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">Payment method</h2><div className="mt-3 space-y-2">
            <button type="button" onClick={() => setChoice('paystack')} aria-pressed={choice === 'paystack'} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${choice === 'paystack' ? 'border-primary/60 bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}><span className={`flex size-5 items-center justify-center rounded-full border ${choice === 'paystack' ? 'border-primary' : 'border-border'}`}>{choice === 'paystack' && <span className="size-2.5 rounded-full bg-primary" />}</span><CreditCard className="size-5 text-primary" /><span><span className="block text-sm font-medium">Mobile Money or card</span><span className="mt-0.5 block text-xs text-muted-foreground">Secure payment through Paystack</span></span></button>
            <button type="button" onClick={() => setChoice('cash')} aria-pressed={choice === 'cash'} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${choice === 'cash' ? 'border-primary/60 bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}><span className={`flex size-5 items-center justify-center rounded-full border ${choice === 'cash' ? 'border-primary' : 'border-border'}`}>{choice === 'cash' && <span className="size-2.5 rounded-full bg-primary" />}</span><Banknote className="size-5 text-primary" /><span><span className="block text-sm font-medium">Cash on Delivery</span><span className="mt-0.5 block text-xs text-muted-foreground">Pay the seller when your products arrive</span></span></button>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-3 text-left text-muted-foreground" aria-disabled="true"><Wallet className="ml-8 size-5" /><span><span className="block text-sm font-medium">Agora Wallet</span><span className="mt-0.5 block text-xs">Not available yet</span></span></div>
          </div></section>

          <section className="agora-card mt-5 rounded-2xl px-4 py-5 sm:px-6"><div className="flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-[0.12em]">Your order</h2><Link href="/cart" className="text-xs font-medium text-primary hover:underline">Edit cart</Link></div><div className="mt-3 divide-y divide-border">{checkoutItems.map(({ product, quantity }) => <div key={product.id} className="flex gap-3 py-3"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">{(product as { images?: string[] }).images?.[0] && <img src={(product as { images: string[] }).images[0]} alt="" loading="lazy" decoding="async" className="size-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">Qty: {quantity}</p></div><p className="shrink-0 text-sm font-semibold">{money(Number((product as { discountPrice?: number; price?: number }).discountPrice ?? (product as { price?: number }).price ?? 0) * quantity)}</p></div>)}</div></section>

          <section className="agora-card mt-5 rounded-2xl px-4 py-5 sm:px-6"><h2 className="text-xs font-semibold uppercase tracking-[0.12em]">Order summary</h2><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-xs text-muted-foreground">Seller confirms before dispatch</span></div><div className="flex justify-between border-t border-border pt-3 font-semibold"><span>Order total before delivery</span><span className="tabular-nums">{money(subtotal)}</span></div></div></section>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm"><div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6"><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Total before delivery</p><p className="text-lg font-semibold tabular-nums">{money(subtotal)}</p></div><button type="button" onClick={placeOrder} disabled={isLoading} className="flex h-12 min-w-44 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">{isLoading ? <LiquidLoader /> : choice === 'cash' ? <>Place order <span>→</span></> : <>Pay {money(subtotal)} <span>→</span></>}</button></div></div>
    </>
  );
}
