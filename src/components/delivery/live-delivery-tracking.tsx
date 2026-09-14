'use client';

import { useEffect, useState } from 'react';
import { Clock3, ExternalLink, MapPin, MessageSquare, Phone, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DeliveryStatus } from '@/lib/types';

type LiveDelivery = {
  id: string;
  status: DeliveryStatus;
  deliveryCode?: string;
  pickup?: { sellerName?: string; address?: string; mapsUrl?: string; contactPhone?: string };
  destination?: { address?: string; landmark?: string; instructions?: string };
  rider?: { name?: string; photoURL?: string; vehicleType?: string; ratingAverage?: number };
  order?: { id?: string; total?: number; items?: Array<{ productId: string; quantity: number; price: number; name?: string }> };
  updatedAt?: string;
};

const statusLabels: Record<string, string> = {
  CREATED: 'Order confirmed', ASSIGNED: 'Courier assigned', ACCEPTED: 'Courier accepted', PICKUP_STARTED: 'Going to pickup',
  PICKED_UP: 'Package picked up', IN_TRANSIT: 'Your order is on its way', OUT_FOR_DELIVERY: 'Out for delivery', ARRIVED: 'Courier is nearby', DELIVERED: 'Order delivered',
};

export function LiveDeliveryTracking({ deliveryId }: { deliveryId: string }) {
  const [delivery, setDelivery] = useState<LiveDelivery | null>(null);
  const [error, setError] = useState('');
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}`, { cache: 'no-store' });
        const data = await response.json() as { delivery?: LiveDelivery; error?: string };
        if (!response.ok) throw new Error(data.error || 'Unable to load delivery.');
        if (active) { setDelivery(data.delivery || null); setConnectionLost(false); }
      } catch (loadError) {
        if (active) { setConnectionLost(true); setError(loadError instanceof Error ? loadError.message : 'Unable to load delivery.'); }
      }
    };
    void load();
    const interval = window.setInterval(load, 10000);
    return () => { active = false; window.clearInterval(interval); };
  }, [deliveryId]);

  if (!delivery && !error) return <main className="min-h-screen p-6"><p className="text-sm text-muted-foreground">Loading delivery...</p></main>;
  if (error && !delivery) return <main className="min-h-screen p-6"><p className="text-sm text-destructive">{error}</p></main>;

  const status = delivery?.status || 'CREATED';
  const pickupUrl = delivery?.pickup?.mapsUrl;
  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        {connectionLost && <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Connection interrupted. Showing the last known delivery information.</div>}
        <header className="flex items-center justify-between border-b pb-4"><div><p className="text-xs text-muted-foreground">Agora / Order tracking</p><h1 className="mt-1 text-2xl font-semibold">{statusLabels[status] || 'Delivery update'}</h1></div><span className="text-xs font-medium uppercase text-muted-foreground">{status.replaceAll('_', ' ')}</span></header>
        <section className="grid min-h-[360px] place-items-center border bg-muted/40 p-6 text-center"><div><MapPin className="mx-auto size-10 text-primary" /><p className="mt-3 font-semibold">Live delivery map</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Courier location and route will appear here when active GPS coordinates are available.</p></div></section>
        <section className="grid gap-4 border-b pb-5 md:grid-cols-2"><div><p className="text-4xl font-bold">{status === 'DELIVERED' ? 'Delivered' : 'Tracking active'}</p><p className="mt-1 text-muted-foreground">Status updates refresh automatically.</p></div><div className="flex flex-wrap gap-2 md:justify-end"><Button variant="outline" disabled={!delivery?.rider}><MessageSquare className="mr-2 size-4" />Message</Button><Button variant="outline" disabled={!delivery?.rider}><Phone className="mr-2 size-4" />Call</Button></div></section>
        <section className="grid gap-5 border-b pb-5 md:grid-cols-2"><div><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-muted"><Truck className="size-5" /></div><div><p className="text-xs text-muted-foreground">Courier</p><p className="font-semibold">{delivery?.rider?.name || 'Finding a courier...'}</p><p className="text-xs text-muted-foreground">{delivery?.rider?.vehicleType || 'Details will appear after assignment'}</p></div></div></div><div className="flex items-start gap-3"><ShieldCheck className="mt-1 size-5 text-emerald-600" /><div><p className="font-semibold">Delivery verification code</p><p className="mt-1 text-xs text-muted-foreground">Give this code to the courier when your order arrives.</p><p className="mt-2 text-2xl font-bold tracking-[0.35em]">{delivery?.deliveryCode || '----'}</p></div></div></section>
        <section className="grid gap-5 border-b pb-5 md:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Pickup</p><p className="mt-1 font-semibold">{delivery?.pickup?.sellerName || 'Seller pickup'}</p><p className="text-sm text-muted-foreground">{delivery?.pickup?.address || 'Pickup details unavailable'}</p>{pickupUrl && <a className="mt-2 inline-flex items-center gap-1 text-sm font-medium underline" href={pickupUrl} target="_blank" rel="noreferrer">Open pickup point <ExternalLink className="size-3.5" /></a>}</div><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Delivery to</p><p className="mt-1 flex items-start gap-2 font-semibold"><MapPin className="mt-0.5 size-4" />{delivery?.destination?.address || 'Delivery address unavailable'}</p><p className="mt-1 text-sm text-muted-foreground">{delivery?.destination?.landmark || delivery?.destination?.instructions || ''}</p></div></section>
        <section className="border-b pb-5"><p className="font-semibold">Order {delivery?.order?.id ? `#${delivery.order.id}` : ''}</p><p className="mt-1 text-sm text-muted-foreground">{delivery?.order?.items?.length || 0} item(s) · GH₵{Number(delivery?.order?.total || 0).toFixed(2)}</p></section>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Last updated {delivery?.updatedAt ? new Date(delivery.updatedAt).toLocaleString() : 'just now'}</p>
      </div>
    </main>
  );
}
