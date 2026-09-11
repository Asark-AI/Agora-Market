'use client';

import { useEffect, useState } from 'react';
import { Check, Circle, Clock3, MapPin, Package, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { DemoMap } from '@/components/delivery/demo-map';
import { DEMO_OTP, readDemoDeliveryState, resetDemoDeliveryState, type DemoDeliveryState } from '@/lib/delivery/demo';
import type { DeliveryStatus } from '@/lib/types';

const timeline: { status: DeliveryStatus; label: string }[] = [
  { status: 'CREATED', label: 'Order placed' },
  { status: 'ASSIGNED', label: 'Rider assigned' },
  { status: 'PICKED_UP', label: 'Picked up' },
  { status: 'IN_TRANSIT', label: 'Out for delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

export default function TrackOrderDemoPage() {
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

  if (!mounted || !state) return <div className="min-h-screen bg-slate-50 p-6" />;
  const currentIndex = timeline.findIndex((step) => step.status === state.delivery.status);
  const delivered = state.delivery.status === 'DELIVERED';

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-slate-950 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between border-b border-slate-200 pb-4"><div><p className="text-sm font-medium text-slate-500">Agora / Orders</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Track your order</h1></div><span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">Demo tracking</span></header>
        <section className="border-b border-slate-200 pb-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-slate-500">Order</p><h2 className="mt-1 text-xl font-semibold">#{state.order.id}</h2><p className="mt-1 text-sm text-slate-500">Agora Standard · GH₵20 delivery</p></div><div className="text-right"><p className="text-xs text-slate-500">Total</p><p className="mt-1 text-lg font-semibold">GH₵{state.order.total}</p></div></div><div className="mt-5"><DemoMap status={state.delivery.status} role="buyer" /></div></section>

        <section className="border-b border-slate-200 pb-6"><div className="flex items-center justify-between"><h2 className="font-semibold">Delivery progress</h2><span className="text-xs uppercase tracking-wider text-slate-500">{state.delivery.status.replaceAll('_', ' ')}</span></div><div className="mt-5 space-y-4">{timeline.map((step, index) => { const complete = index <= currentIndex; const active = index === currentIndex; return <div key={step.status} className="flex items-center gap-3"><div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-slate-950 text-white' : 'border border-slate-300 bg-white text-slate-400'}`}>{complete ? <Check className="size-4" /> : <Circle className="size-3" />}</div><span className={`text-sm ${active ? 'font-semibold text-slate-950' : complete ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>{active && <span className="ml-auto text-xs text-emerald-700">Current</span>}</div>; })}</div></section>

        <section className="grid gap-5 border-b border-slate-200 pb-6 md:grid-cols-2"><div><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center bg-slate-100"><Truck className="size-5" /></div><div><p className="text-xs text-slate-500">Your rider</p><p className="font-semibold">Kwame Mensah</p><p className="text-xs text-slate-500">Motorcycle · ★ 4.8</p></div></div><div className="mt-4 flex items-center gap-2 text-xs text-slate-600"><MapPin className="size-3.5" /> {delivered ? 'Delivered successfully' : 'Arriving in about 15 minutes'}</div></div><div className="border-l border-slate-200 pl-4"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-600" /><h2 className="font-semibold">Delivery verification</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">Give this code to your rider when they arrive.</p><div className="mt-3 flex items-center justify-between border-y border-slate-200 px-1 py-3"><span className="text-xs text-slate-500">Demo OTP</span><strong className="text-lg tracking-[0.35em]">{DEMO_OTP}</strong></div></div></section>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"><span className="flex items-center gap-2"><Clock3 className="size-3.5" /> Updates sync with Rider Center</span><button type="button" onClick={() => setState(readDemoDeliveryState())} className="flex items-center gap-1 font-medium text-slate-900"><RefreshCw className="size-3.5" /> Refresh</button></div>
        <button type="button" onClick={() => setState(resetDemoDeliveryState())} className="w-full text-xs text-slate-500 underline underline-offset-4">Reset delivery demo</button>
      </div>
    </main>
  );
}
