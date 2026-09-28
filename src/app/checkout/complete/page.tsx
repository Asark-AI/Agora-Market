'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, CheckCircle2, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiquidLoader } from '@/components/liquid-loader';
import { SiteHeader } from '@/components/site-header';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

type Confirmation = {
  orderId?: string;
  subtotal: number;
  total: number;
  itemCount: number;
  items: Array<{ productId?: string; name: string; image?: string | null; quantity: number }>;
  address?: string;
  paymentMethod?: 'paystack' | 'cash';
  deliveryFeePending?: boolean;
};

type ViewState = 'loading' | 'success' | 'failed';
const money = (value: number) => `GH₵${Number(value || 0).toFixed(2)}`;

export default function CheckoutCompletePage() {
  const searchParams = useSearchParams();
  const { removeFromCart } = useCart();
  const { toast } = useToast();
  const started = useRef(false);
  const [status, setStatus] = useState<ViewState>('loading');
  const [message, setMessage] = useState('Confirming your order...');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const isCashOrder = searchParams.get('method') === 'cod';
    const orderIdFromUrl = searchParams.get('orderId');
    let summary: Confirmation | null = null;
    try {
      const raw = window.sessionStorage.getItem('agora-checkout-confirmation');
      summary = raw ? JSON.parse(raw) as Confirmation : null;
      setConfirmation(summary);
    } catch {
      summary = null;
    }

    const confirm = async () => {
      try {
        let orderId = orderIdFromUrl || undefined;
        if (isCashOrder) {
          if (!orderId) throw new Error('No order reference was provided.');
          const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { credentials: 'include', cache: 'no-store' });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || 'Unable to load your order.');
          orderId = result.orderGroupId || orderId;
          setMessage('Your cash-on-delivery order has been placed.');
        } else {
          if (!reference) throw new Error('No payment reference was provided.');
          const response = await fetch('/api/payments/paystack/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ reference }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result.verified) throw new Error(result.error || 'Payment verification failed.');
          orderId = result.marketplaceOrderId || orderId;
          setMessage('Your payment has been confirmed and your order is being processed.');
          toast({ title: 'Payment confirmed', description: 'Your order is being prepared by the seller.' });
        }

        setConfirmation((current) => current ? { ...current, orderId } : { orderId, subtotal: 0, total: 0, itemCount: 0, items: [], paymentMethod: isCashOrder ? 'cash' : 'paystack' });
        summary?.items.forEach((item) => { if (item.productId) removeFromCart(item.productId); });
        window.sessionStorage.removeItem('agora-checkout-selection');
        window.sessionStorage.removeItem('agora-checkout-confirmation');
        setStatus('success');
      } catch (error) {
        setStatus('failed');
        setMessage(error instanceof Error ? error.message : 'We could not confirm this order.');
        toast({ variant: 'destructive', title: 'Order confirmation failed', description: 'Your order status could not be confirmed. Keep your payment reference and contact support.' });
      }
    };
    void confirm();
  }, [removeFromCart, searchParams, toast]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#f7f8fa] px-4 py-8 pb-12 text-[#1c2633] sm:px-6">
        <div className="mx-auto max-w-xl">
          {status === 'loading' ? (
            <section className="grid min-h-[55vh] place-items-center text-center"><div><LiquidLoader /><p className="mt-4 text-sm text-[#667482]">{message}</p></div></section>
          ) : status === 'failed' ? (
            <section className="border-y border-[#e1e6eb] bg-white px-5 py-10 text-center"><div className="mx-auto flex size-12 items-center justify-center border border-[#e6b8b4] bg-[#fff5f4] text-[#b42318]"><span className="text-xl font-semibold">!</span></div><h1 className="mt-4 text-xl font-semibold">We couldn&apos;t confirm the order</h1><p role="alert" className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#667482]">{message}</p><Link href="/profile?tab=orders" className="mt-6 inline-flex h-12 items-center justify-center bg-[#1769aa] px-5 text-sm font-semibold text-white">View my orders</Link></section>
          ) : (
            <>
              <header className="border-y border-[#e1e6eb] bg-white px-5 py-8 text-center sm:py-10"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#e9f4ee] text-[#21744a]"><Check className="size-6" /></div><p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a17d32]">Agora order confirmation</p><h1 className="mt-2 text-2xl font-semibold">Order placed</h1><p className="mt-2 text-sm text-[#667482]">{message}</p><p className="mt-5 text-sm font-medium text-[#41505f]">Order #{confirmation?.orderId || 'Confirmed'}</p><p className="mt-1 text-xl font-semibold">{money(confirmation?.total || 0)}</p></header>
              <section className="mt-4 divide-y divide-[#edf0f3] border-y border-[#e1e6eb] bg-white px-5"><div className="flex items-center gap-3 py-4"><Package className="size-5 text-[#1769aa]" /><div><p className="text-sm font-medium">{confirmation?.itemCount || 0} {confirmation?.itemCount === 1 ? 'item' : 'items'}</p><p className="text-xs text-[#74808d]">{confirmation?.paymentMethod === 'cash' ? 'Cash on delivery' : 'Payment confirmed'}</p></div></div><div className="flex items-start gap-3 py-4"><Truck className="mt-0.5 size-5 text-[#1769aa]" /><div><p className="text-sm font-medium">Delivery</p><p className="text-xs leading-5 text-[#74808d]">The seller will confirm the delivery fee and estimated arrival before dispatch.</p>{confirmation?.address && <p className="mt-2 text-xs text-[#41505f]">{confirmation.address}</p>}</div></div></section>
              {confirmation?.items?.length ? <section className="mt-4 border-y border-[#e1e6eb] bg-white px-5 py-4"><h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7b88]">Order details</h2><ul className="mt-3 space-y-3">{confirmation.items.map((item, index) => <li key={`${item.productId || item.name}-${index}`} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate">{item.quantity} × {item.name}</span><CheckCircle2 className="size-4 shrink-0 text-[#21744a]" /></li>)}</ul><div className="mt-4 flex justify-between border-t border-[#edf0f3] pt-3 text-sm"><span className="text-[#667482]">Subtotal</span><span className="font-semibold">{money(confirmation.subtotal)}</span></div></section> : null}
              <div className="mt-5 grid gap-3"><Button asChild className="h-12 rounded-sm bg-[#1769aa] text-sm font-semibold text-white hover:bg-[#12588f]"><Link href={confirmation?.orderId ? `/track-order?orderId=${encodeURIComponent(confirmation.orderId)}` : '/profile?tab=orders'}>Track order</Link></Button><Button asChild variant="outline" className="h-12 rounded-sm border-[#cfd8e1] bg-white text-sm font-semibold text-[#26384a]"><Link href="/products">Continue shopping</Link></Button></div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
