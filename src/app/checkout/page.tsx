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

  if (selectedIds === null) return <main className="min-h-screen bg-[#f7f8fa]" />;
  if (!checkoutItems.length) return <><SiteHeader /><main className="mx-auto max-w-lg px-5 py-20 text-center"><h1 className="text-xl font-semibold">No items selected</h1><p className="mt-2 text-sm text-[#74808d]">Return to your cart and choose the items to check out.</p><Link href="/cart" className="mt-5 inline-flex h-11 items-center bg-[#1769aa] px-5 text-sm font-semibold text-white">Back to cart</Link></main></>;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f8fa] pb-28 text-[#1c2633]">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
          <header className="mb-5 flex items-center gap-3 border-b border-[#e3e7eb] pb-4"><Link href="/cart" aria-label="Back to cart" className="inline-flex size-10 items-center justify-center text-[#26384a]"><ArrowLeft className="size-5" /></Link><div><h1 className="text-xl font-semibold">Checkout</h1></div></header>

          <section className="border-y border-[#e1e6eb] bg-white px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d7b88]"><MapPin className="size-4 text-[#bd923a]" /> Delivery address</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-medium text-[#4d5b68]">Recipient name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" className="h-12 rounded-md border border-[#cfd8e1] px-3 text-sm text-[#1c2633] outline-none focus:border-[#1769aa] focus:ring-2 focus:ring-[#1769aa]/15" placeholder="Full name" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-[#4d5b68]">Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="h-12 rounded-md border border-[#cfd8e1] px-3 text-sm text-[#1c2633] outline-none focus:border-[#1769aa] focus:ring-2 focus:ring-[#1769aa]/15" placeholder="0XX XXX XXXX" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-[#4d5b68] sm:col-span-2">Delivery address<input value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" className="h-12 rounded-md border border-[#cfd8e1] px-3 text-sm text-[#1c2633] outline-none focus:border-[#1769aa] focus:ring-2 focus:ring-[#1769aa]/15" placeholder="House number, street or landmark" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-[#4d5b68] sm:col-span-2">Area / city<input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className="h-12 rounded-md border border-[#cfd8e1] px-3 text-sm text-[#1c2633] outline-none focus:border-[#1769aa] focus:ring-2 focus:ring-[#1769aa]/15" placeholder="e.g. Kotobabi, Accra" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-[#4d5b68] sm:col-span-2">Delivery instructions <span className="font-normal text-[#84909b]">Optional</span><input value={instructions} onChange={(event) => setInstructions(event.target.value)} className="h-12 rounded-md border border-[#cfd8e1] px-3 text-sm text-[#1c2633] outline-none focus:border-[#1769aa] focus:ring-2 focus:ring-[#1769aa]/15" placeholder="Gate, floor, or directions" /></label>
            </div>
          </section>

          <section className="mt-5 border-y border-[#e1e6eb] bg-white px-4 py-4 sm:px-5"><h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d7b88]">Payment method</h2><div className="mt-3 space-y-2">
            <button type="button" onClick={() => setChoice('paystack')} className={`flex w-full items-center gap-3 border px-3 py-3 text-left ${choice === 'paystack' ? 'border-[#1769aa] bg-[#f2f8fc]' : 'border-[#e1e6eb] bg-white'}`}><span className={`flex size-5 items-center justify-center rounded-full border ${choice === 'paystack' ? 'border-[#1769aa]' : 'border-[#aab4bf]'}`}>{choice === 'paystack' && <span className="size-2.5 rounded-full bg-[#1769aa]" />}</span><CreditCard className="size-5 text-[#1769aa]" /><span><span className="block text-sm font-medium">Mobile Money or card</span><span className="mt-0.5 block text-xs text-[#74808d]">Secure payment through Paystack</span></span></button>
            <button type="button" onClick={() => setChoice('cash')} className={`flex w-full items-center gap-3 border px-3 py-3 text-left ${choice === 'cash' ? 'border-[#1769aa] bg-[#f2f8fc]' : 'border-[#e1e6eb] bg-white'}`}><span className={`flex size-5 items-center justify-center rounded-full border ${choice === 'cash' ? 'border-[#1769aa]' : 'border-[#aab4bf]'}`}>{choice === 'cash' && <span className="size-2.5 rounded-full bg-[#1769aa]" />}</span><Banknote className="size-5 text-[#1769aa]" /><span><span className="block text-sm font-medium">Cash on Delivery</span><span className="mt-0.5 block text-xs text-[#74808d]">Pay the seller when your products arrive</span></span></button>
            <div className="flex items-center gap-3 border border-dashed border-[#d6dde4] px-3 py-3 text-left text-[#8a95a1]" aria-disabled="true"><Wallet className="ml-8 size-5" /><span><span className="block text-sm font-medium">Agora Wallet</span><span className="mt-0.5 block text-xs">Not available yet</span></span></div>
          </div></section>

          <section className="mt-5 border-y border-[#e1e6eb] bg-white px-4 py-4 sm:px-5"><div className="flex items-center justify-between"><h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d7b88]">Your order</h2><Link href="/cart" className="text-xs font-medium text-[#1769aa]">Edit cart</Link></div><div className="mt-3 divide-y divide-[#edf0f3]">{checkoutItems.map(({ product, quantity }) => <div key={product.id} className="flex gap-3 py-3"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden bg-[#eef1f4]">{(product as { images?: string[] }).images?.[0] && <img src={(product as { images: string[] }).images[0]} alt="" className="size-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{product.name}</p><p className="mt-1 text-xs text-[#74808d]">Qty: {quantity}</p></div><p className="shrink-0 text-sm font-semibold">{money(Number((product as { discountPrice?: number; price?: number }).discountPrice ?? (product as { price?: number }).price ?? 0) * quantity)}</p></div>)}</div></section>

          <section className="mt-5 border-y border-[#e1e6eb] bg-white px-4 py-4 sm:px-5"><h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d7b88]">Order summary</h2><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><span className="text-[#667482]">Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div><div className="flex justify-between"><span className="text-[#667482]">Delivery</span><span className="text-xs text-[#74808d]">Seller confirms before dispatch</span></div><div className="flex justify-between border-t border-[#edf0f3] pt-3 font-semibold"><span>Order total before delivery</span><span className="tabular-nums">{money(subtotal)}</span></div></div></section>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dce2e8] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(24,41,57,0.06)] backdrop-blur-sm"><div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6"><div className="min-w-0 flex-1"><p className="text-xs text-[#74808d]">Total before delivery</p><p className="text-lg font-semibold tabular-nums">{money(subtotal)}</p></div><button type="button" onClick={placeOrder} disabled={isLoading} className="flex h-12 min-w-44 items-center justify-center gap-2 bg-[#1769aa] px-4 text-sm font-semibold text-white hover:bg-[#12588f] disabled:opacity-60">{isLoading ? <LiquidLoader /> : choice === 'cash' ? <>Place order <span>→</span></> : <>Pay {money(subtotal)} <span>→</span></>}</button></div></div>
    </>
  );
}
