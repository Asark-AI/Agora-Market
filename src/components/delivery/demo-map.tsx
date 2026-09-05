'use client';

import { useState } from 'react';
import { LocateFixed, MapPin, Navigation } from 'lucide-react';
import type { DeliveryStatus } from '@/lib/types';

export function DemoMap({ status, role = 'rider' }: { status: DeliveryStatus; role?: 'rider' | 'buyer' }) {
  const [centered, setCentered] = useState(false);
  const riderPosition = status === 'ASSIGNED' || status === 'ACCEPTED' || status === 'PICKUP_STARTED' ? 'left-[28%] top-[49%]' : status === 'PICKED_UP' || status === 'IN_TRANSIT' ? 'left-[52%] top-[40%]' : 'left-[72%] top-[29%]';
  return (
    <div className="relative h-64 overflow-hidden rounded-xl border border-slate-200 bg-[#d9e4d3] shadow-inner sm:h-80">
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(28deg, transparent 47%, #fff 48%, #fff 52%, transparent 53%), linear-gradient(118deg, transparent 46%, #fff 47%, #fff 51%, transparent 52%), linear-gradient(90deg, transparent 49%, #c6d6bd 50%, transparent 51%), linear-gradient(0deg, transparent 49%, #c6d6bd 50%, transparent 51%)', backgroundSize: '96px 82px, 120px 110px, 34px 34px, 42px 42px' }} />
      <div className="absolute left-[12%] top-[18%] text-[10px] font-semibold uppercase tracking-wider text-slate-500">Osu</div>
      <div className="absolute right-[12%] top-[16%] text-[10px] font-semibold uppercase tracking-wider text-slate-500">East Legon</div>
      <div className="absolute left-[43%] bottom-[18%] text-[10px] font-semibold uppercase tracking-wider text-slate-500">Accra</div>
      <div className="absolute left-[20%] top-[58%] h-3 w-3 rounded-full border-2 border-white bg-orange-500 shadow-md" title="Pickup location" />
      <div className="absolute right-[18%] top-[22%] h-3 w-3 rounded-full border-2 border-white bg-rose-600 shadow-md" title="Drop-off location" />
      <div className={`absolute ${riderPosition} flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-white shadow-lg transition-all duration-700`} title="Rider location"><Navigation className="size-4 rotate-45" /></div>
      <div className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600 shadow">Demo map · {role === 'buyer' ? 'Live rider preview' : 'Route preview'}</div>
      <button type="button" onClick={() => setCentered((value) => !value)} className={`absolute right-3 top-3 flex size-9 items-center justify-center rounded-md border bg-white shadow-sm ${centered ? 'text-slate-950' : 'text-slate-500'}`} aria-label="Center map"><LocateFixed className="size-4" /></button>
      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow"><MapPin className="size-3 text-orange-500" /> Pickup <MapPin className="size-3 text-rose-600" /> Drop-off</div>
    </div>
  );
}