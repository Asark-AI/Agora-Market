'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Circle, Clock3, MapPin, Package, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { DemoMap } from '@/components/delivery/demo-map';
import { DEMO_OTP, readDemoDeliveryState, resetDemoDeliveryState, type DemoDeliveryState } from '@/lib/delivery/demo';
import type { DeliveryStatus } from '@/lib/types';
import { LiveDeliveryTracking } from '@/components/delivery/live-delivery-tracking';
import Link from 'next/link';

type MarketplaceOrder = {
  id: string;
  marketplaceOrderId?: string;
  date?: string;
  updatedAt?: string;
  status: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number | null;
  deliveryFeeStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  items: Array<{ productId: string; quantity: number; price: number; productName?: string; image?: string | null }>;
  deliveryAddress?: { name?: string; phone?: string; address?: string; city?: string; instructions?: string | null };
  shipmentIds?: string[];
};

const orderStages = ['Order placed', 'Seller confirmed', 'Preparing', 'Ready for pickup', 'Rider assigned', 'Picked up', 'In transit', 'Near you', 'Delivered'];
function stageForStatus(status: string) {
  switch (status.toLowerCase()) {
    case 'fulfilled': return 2;
    case 'ready-for-pickup': return 3;
    case 'shipped': return 6;
    case 'delivered':
    case 'completed': return 8;
    default: return 0;
  }
}

function MarketplaceOrderTracking({ orderId }: { orderId: string }) {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { credentials: 'include', cache: 'no-store' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Unable to load this order.');
        if (active) { setOrders(result.orders || []); setError(''); }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load this order.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, [orderId]);

  if (loading) return <main className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading order updates...</main>;
  if (error || orders.length === 0) return <main className="min-h-screen bg-background p-6"><div className="agora-card mx-auto max-w-lg rounded-2xl p-6"><p className="text-sm text-destructive">{error || 'Order not found.'}</p><Link href="/profile?tab=orders" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">View your orders</Link></div></main>;

  const activeStage = Math.min(...orders.map((order) => stageForStatus(order.status)));
  const firstOrder = orders[0];
  const items = orders.flatMap((order) => order.items || []);
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const deliveryAddress = firstOrder.deliveryAddress;
  const paymentMethod = firstOrder.paymentStatus === 'SUCCESS'
    ? 'Paid through Paystack'
    : firstOrder.paymentMethod === 'cash' ? 'Cash on delivery' : 'Awaiting payment';
  const deliveryInProgress = orders.some((order) => ['shipped', 'delivered', 'completed'].includes(order.status.toLowerCase()));
  const deliveryIds = orders.flatMap((order) => order.shipmentIds || []);
  if (deliveryIds.length > 0) return <LiveDeliveryTracking deliveryId={deliveryIds[0]} />;

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-8 sm:py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="border-b border-border pb-4"><Link href="/profile?tab=orders" className="text-xs font-medium text-primary hover:underline">← My orders</Link><p className="agora-pill mt-4">Order tracking</p><h1 className="mt-2 text-xl font-semibold">Order #{orderId}</h1><p className="mt-1 text-sm text-muted-foreground">{money(total)} · {itemCount} {itemCount === 1 ? 'item' : 'items'} · {paymentMethod}</p></header>
        <section className="agora-panel rounded-2xl px-5 py-6 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Truck className="size-6" /></div><p className="mt-3 text-lg font-semibold">{deliveryInProgress ? 'Your products are on the way' : activeStage === 0 ? 'Waiting for seller confirmation' : 'Seller is preparing your order'}</p><p className="mt-1 text-sm text-muted-foreground">{deliveryInProgress ? 'Delivery updates will appear as they are shared.' : 'The seller will confirm dispatch and delivery timing.'}</p></section>
        <section className="agora-card rounded-2xl px-5 py-5"><h2 className="text-sm font-semibold">Order progress</h2><ol className="mt-5 space-y-0">{orderStages.map((label, index) => { const complete = index <= activeStage; const current = index === activeStage; return <li key={label} className="relative flex min-h-12 gap-3"><span className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}>{complete ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}</span>{index < orderStages.length - 1 && <span className={`absolute left-[11px] top-6 h-7 w-px ${index < activeStage ? 'bg-primary' : 'bg-border'}`} />}<span className={`pb-5 text-sm ${current ? 'font-semibold text-foreground' : complete ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>{label}{current && <span className="ml-2 text-xs font-normal text-primary">Current</span>}</span></li>; })}</ol><p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Updates refresh automatically.</p></section>
        <section className="agora-card grid gap-5 rounded-2xl px-5 py-5 sm:grid-cols-2"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-primary" />Delivery address</h2><p className="mt-3 text-sm">{deliveryAddress?.name || 'Recipient'}</p><p className="text-sm text-muted-foreground">{[deliveryAddress?.address, deliveryAddress?.city].filter(Boolean).join(', ') || 'Address will be confirmed with the seller.'}</p><p className="mt-1 text-xs text-muted-foreground">{deliveryAddress?.phone || ''}</p>{deliveryAddress?.instructions && <p className="mt-2 text-xs text-muted-foreground">{deliveryAddress.instructions}</p>}</div><div><h2 className="flex items-center gap-2 text-sm font-semibold"><Package className="size-4 text-primary" />Order details</h2><ul className="mt-3 space-y-2">{items.map((item, index) => <li key={`${item.productId}-${index}`} className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{item.quantity} × {item.productName || 'Marketplace item'}</span><span className="shrink-0">{money(item.price * item.quantity)}</span></li>)}</ul><div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold"><span>Subtotal</span><span>{money(total)}</span></div><p className="mt-2 text-xs text-muted-foreground">Delivery fee: {firstOrder.deliveryFee == null ? 'seller to confirm' : money(firstOrder.deliveryFee)}</p></div></section>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw className="size-3.5" />Last order update {firstOrder.updatedAt ? new Date(firstOrder.updatedAt).toLocaleString() : firstOrder.date ? new Date(firstOrder.date).toLocaleString() : 'available now'}</p>
      </div>
    </main>
  );
}

function money(value: number) { return `GH₵${Number(value || 0).toFixed(2)}`; }

const demoTimeline: { status: DeliveryStatus; label: string }[] = [
  { status: 'CREATED', label: 'Order placed' },
  { status: 'ASSIGNED', label: 'Rider assigned' },
  { status: 'PICKED_UP', label: 'Picked up' },
  { status: 'IN_TRANSIT', label: 'Out for delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

function DemoTracking() {
  const [state, setState] = useState<DemoDeliveryState | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setState(readDemoDeliveryState());
    const sync = () => setState(readDemoDeliveryState());
    window.addEventListener('storage', sync);
    const interval = window.setInterval(sync, 800);
    return () => { window.removeEventListener('storage', sync); window.clearInterval(interval); };
  }, []);
  if (!mounted || !state) return <div className="min-h-screen bg-[#f7f8fa] p-6" />;
  const currentIndex = demoTimeline.findIndex((step) => step.status === state.delivery.status);
  const delivered = state.delivery.status === 'DELIVERED';
  return <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-[#1c2633] sm:px-8 sm:py-10"><div className="mx-auto max-w-3xl space-y-5"><header className="flex items-center justify-between border-b border-[#dfe5eb] pb-4"><div><p className="text-xs text-[#74808d]">Agora / Orders</p><h1 className="mt-1 text-xl font-semibold">Track your order</h1></div><span className="border border-[#e7d6ac] bg-[#fff9e9] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8b6b24]">Demo tracking</span></header><section className="border-b border-[#dfe5eb] pb-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[#74808d]">Order</p><h2 className="mt-1 text-lg font-semibold">#{state.order.id}</h2><p className="mt-1 text-sm text-[#74808d]">Agora Standard · GH₵20 delivery</p></div><div className="text-right"><p className="text-xs text-[#74808d]">Total</p><p className="mt-1 text-lg font-semibold">GH₵{state.order.total}</p></div></div><div className="mt-5"><DemoMap status={state.delivery.status} role="buyer" /></div></section><section className="border-b border-[#dfe5eb] pb-6"><h2 className="font-semibold">Delivery progress</h2><div className="mt-5 space-y-4">{demoTimeline.map((step, index) => { const complete = index <= currentIndex; const active = index === currentIndex; return <div key={step.status} className="flex items-center gap-3"><div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-[#1769aa] text-white' : 'border border-[#c8d1da] bg-white text-[#9aa5af]'}`}>{complete ? <Check className="size-4" /> : <Circle className="size-3" />}</div><span className={`text-sm ${active ? 'font-semibold' : ''}`}>{step.label}</span>{active && <span className="ml-auto text-xs text-[#21744a]">Current</span>}</div>; })}</div></section><section className="grid gap-5 border-b border-[#dfe5eb] pb-6 sm:grid-cols-2"><div className="flex items-center gap-3"><Truck className="size-5 text-[#1769aa]" /><div><p className="text-xs text-[#74808d]">Demo rider</p><p className="font-semibold">Kwame Mensah</p><p className="text-xs text-[#74808d]">Motorcycle · ★ 4.8</p></div></div><div><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#21744a]" /><h2 className="font-semibold">Delivery verification</h2></div><p className="mt-2 text-xs text-[#74808d]">Give this code to your rider when they arrive.</p><p className="mt-3 border-y border-[#dfe5eb] py-3 text-lg font-bold tracking-[0.35em]">{DEMO_OTP}</p></div></section><div className="flex items-center justify-between text-xs text-[#74808d]"><span className="flex items-center gap-2"><Clock3 className="size-3.5" />Demo updates sync with Rider Center</span><button type="button" onClick={() => setState(readDemoDeliveryState())} className="flex items-center gap-1 font-medium text-[#1769aa]"><RefreshCw className="size-3.5" />Refresh</button></div><button type="button" onClick={() => setState(resetDemoDeliveryState())} className="w-full text-xs text-[#74808d] underline underline-offset-4">Reset delivery demo</button></div></main>;
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const deliveryId = searchParams.get('deliveryId');
  const orderId = searchParams.get('orderId');
  if (deliveryId) return <LiveDeliveryTracking deliveryId={deliveryId} />;
  if (orderId) return <MarketplaceOrderTracking orderId={orderId} />;
  return <DemoTracking />;
}
