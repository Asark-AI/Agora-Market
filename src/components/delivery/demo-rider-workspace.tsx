'use client';

import { useState } from 'react';
import { Check, CheckCircle2, MapPin, Navigation, PackageCheck, UserRound, X } from 'lucide-react';
import { DEMO_OTP, advanceDemoDelivery, readDemoDeliveryState, resetDemoDeliveryState, writeDemoDeliveryState, type DemoDeliveryState } from '@/lib/delivery/demo';
import { DemoMap } from '@/components/delivery/demo-map';

export function DemoRiderWorkspace() {
  const [isOnline, setIsOnline] = useState(false);
  const [demoState, setDemoState] = useState<DemoDeliveryState>(() => readDemoDeliveryState());
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const deliveryStatus = demoState.delivery.status;
  const statusSteps = [
    { key: 'accepted', label: 'Accepted' },
    { key: 'picked_up', label: 'Picked up' },
    { key: 'in_transit', label: 'In transit' },
    { key: 'delivered', label: 'Delivered' },
  ] as const;
  const currentStep = statusSteps.findIndex((step) => step.key === deliveryStatus.toLowerCase());
  const nextAction = deliveryStatus === 'ACCEPTED'
    ? { label: "I've picked it up", next: 'PICKED_UP' as const, icon: PackageCheck }
    : deliveryStatus === 'PICKED_UP'
      ? { label: 'Start delivery', next: 'IN_TRANSIT' as const, icon: Navigation }
      : null;
  const ActionIcon = nextAction?.icon;
  const updateDemoState = (next: DemoDeliveryState) => { setDemoState(next); writeDemoDeliveryState(next); };
  const acceptDelivery = () => updateDemoState(advanceDemoDelivery(demoState, 'ACCEPTED'));
  const declineDelivery = () => { const next = resetDemoDeliveryState(); updateDemoState(next); setIsOnline(false); };
  const advanceDelivery = () => { if (nextAction) updateDemoState(advanceDemoDelivery(demoState, nextAction.next)); };
  const completeDelivery = () => {
    if (otp !== DEMO_OTP) { setOtpError('Incorrect demo OTP. Use 4821.'); return; }
    setOtpError('');
    updateDemoState(advanceDemoDelivery({ ...demoState, proof: { method: 'OTP', verifiedAt: new Date().toISOString(), reference: DEMO_OTP } }, 'DELIVERED'));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-24 pt-5 text-slate-950 sm:px-8 sm:pt-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Agora Rider</p><h1 className="text-2xl font-semibold tracking-tight">Good afternoon, Kwame</h1></div><div className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white"><UserRound className="size-5 text-slate-500" /></div></header>
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="font-semibold">DEMO MODE</span><span>Local workflow preview</span></div>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Today&apos;s earnings</p><p className="mt-2 text-2xl font-semibold">GH₵185</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Deliveries</p><p className="mt-2 text-2xl font-semibold">12</p></div><div className="hidden rounded-xl border border-slate-200 bg-white p-4 sm:block"><p className="text-xs text-slate-500">Rating</p><p className="mt-2 text-2xl font-semibold">4.8</p></div></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Availability</p><p className="mt-1 text-xl font-semibold">{isOnline ? "You're online" : "You're offline"}</p></div><span className={`size-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} /></div><button type="button" onClick={() => setIsOnline((value) => !value)} className={`mt-5 h-12 w-full rounded-lg text-sm font-semibold transition-colors ${isOnline ? 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50' : 'bg-slate-950 text-white hover:bg-slate-800'}`}>{isOnline ? 'Go offline' : 'Go online'}</button></section>
        {isOnline && deliveryStatus === 'ASSIGNED' && demoState.assignment.status === 'OFFERED' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">New delivery</p><span className="text-xs text-slate-500">Expires in 02:45</span></div><h2 className="mt-4 text-lg font-semibold">Order #AG-10482</h2><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-500">Pickup</p><p className="mt-1 font-medium">Agora Seller, Osu</p></div><div><p className="text-xs text-slate-500">Drop-off</p><p className="mt-1 font-medium">East Legon, Accra</p></div><div><p className="text-xs text-slate-500">Distance</p><p className="mt-1 font-medium">7.4 km</p></div><div><p className="text-xs text-slate-500">Estimated earnings</p><p className="mt-1 font-medium">GH₵18</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={declineDelivery} className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"><X className="size-4" />Decline</button><button type="button" onClick={acceptDelivery} className="h-12 rounded-lg bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800">Accept delivery</button></div></section>}
        {deliveryStatus !== 'ASSIGNED' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{deliveryStatus === 'DELIVERED' ? 'Completed delivery' : 'Active delivery'}</p><h2 className="mt-2 text-lg font-semibold">Order #AG-10482</h2></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{deliveryStatus}</span></div><div className="mt-5"><DemoMap status={deliveryStatus} /></div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-500">Pickup</p><p className="mt-1 font-medium">Agora Seller, Osu</p></div><div><p className="text-xs text-slate-500">Deliver to</p><p className="mt-1 font-medium">East Legon, Accra</p></div></div><div className="mt-6 grid grid-cols-4 gap-1">{statusSteps.map((step, index) => <div key={step.key} className="space-y-2"><div className={`h-1 rounded-full ${index <= currentStep ? 'bg-slate-950' : 'bg-slate-200'}`} /><p className="text-[11px] text-slate-500">{step.label}</p></div>)}</div>{nextAction && ActionIcon && <button type="button" onClick={advanceDelivery} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"><ActionIcon className="size-4" />{nextAction.label}</button>}{deliveryStatus === 'IN_TRANSIT' && <div className="mt-5 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold">Buyer delivery OTP</p><p className="text-xs text-slate-500">Ask the buyer for the 4-digit code before completing delivery.</p><input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="Enter OTP" className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-center text-lg tracking-[0.5em]" />{otpError && <p className="text-xs text-red-600">{otpError}</p>}<button type="button" onClick={completeDelivery} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 text-sm font-semibold text-white"><Check className="size-4" />Verify OTP and deliver</button></div>}{deliveryStatus === 'DELIVERED' && <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="size-4" /> Delivery completed with OTP proof. GH₵18 added to demo earnings.</div>}</section>}
        <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Delivery history</h2><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm"><span>Order #AG-10482</span><span className="text-xs text-slate-500">{deliveryStatus === 'DELIVERED' ? 'Delivered · GH₵18' : 'In progress'}</span></div></section>
        <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3 text-sm"><MapPin className="size-4 text-slate-500" /><span className="text-slate-600">Location sharing activates only while online.</span></div></section>
      </div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-3"><div className="mx-auto grid max-w-3xl grid-cols-4 text-center text-xs font-medium text-slate-500"><span className="text-slate-950">Home</span><span>Deliveries</span><span>Earnings</span><span>Profile</span></div></nav>
    </main>
  );
}
