'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, MapPin, Package, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { resetDemoDeliveryState } from '@/lib/delivery/demo';

export default function DemoProductPage() {
  const router = useRouter();
  const [isBuying, setIsBuying] = useState(false);

  const buyDemoProduct = () => {
    setIsBuying(true);
    resetDemoDeliveryState();
    window.setTimeout(() => router.push('/track-order'), 350);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="font-semibold uppercase tracking-wider">Agora demo store</span><span>Nothing is charged</span></div>
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-8 sm:min-h-[440px]">
            <div className="absolute left-8 top-8 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">Demo bestseller</div>
            <div className="relative flex size-56 items-center justify-center rounded-[30%] bg-slate-950 shadow-2xl shadow-slate-950/20 sm:size-72"><div className="absolute inset-5 rounded-[24%] border border-white/20" /><ShoppingBag className="size-28 text-white sm:size-36" strokeWidth={1.2} /></div>
          </div>
          <div className="flex flex-col justify-center py-2 sm:px-3">
            <p className="text-sm font-medium text-emerald-700">Agora Demo Store · Osu</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Agora Everyday Carry Kit</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">A sample product for testing the complete buyer, seller, rider, and delivery experience.</p>
            <div className="mt-6 flex items-end gap-3"><span className="text-3xl font-bold">GH₵150</span><span className="text-sm text-slate-400 line-through">GH₵190</span><span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">21% off</span></div>
            <div className="mt-6 space-y-3 border-y border-slate-100 py-5 text-sm text-slate-600"><div className="flex items-center gap-3"><Truck className="size-4 text-emerald-600" />Agora Standard · 1–3 days · GH₵20</div><div className="flex items-center gap-3"><MapPin className="size-4 text-emerald-600" />Pickup Osu · Drop-off East Legon</div><div className="flex items-center gap-3"><ShieldCheck className="size-4 text-emerald-600" />Demo buyer protection</div></div>
            <button type="button" onClick={buyDemoProduct} disabled={isBuying} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60">{isBuying ? 'Creating demo order...' : 'Buy demo product · GH₵170'}{!isBuying && <ArrowRight className="size-4" />}</button>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-slate-500"><CheckCircle2 className="size-3.5 text-emerald-600" />This creates a local demo order only.</p>
          </div>
        </div>
        <section className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><Package className="size-5 text-slate-700" /><p className="mt-3 text-sm font-semibold">1. Buy product</p><p className="mt-1 text-xs text-slate-500">Create the simulated order and shipment.</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><Truck className="size-5 text-slate-700" /><p className="mt-3 text-sm font-semibold">2. Rider delivers</p><p className="mt-1 text-xs text-slate-500">Open Rider Demo to accept and move the delivery.</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><ShieldCheck className="size-5 text-slate-700" /><p className="mt-3 text-sm font-semibold">3. Verify OTP</p><p className="mt-1 text-xs text-slate-500">Use the buyer code 4821 to complete delivery.</p></div></section>
      </div>
    </main>
  );
}
