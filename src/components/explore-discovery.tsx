'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  BatteryCharging,
  Crown,
  Gift,
  Home,
  Laptop,
  MoreHorizontal,
  PackagePlus,
  Shirt,
  Sparkles,
  Star,
} from 'lucide-react';

const shortcutIcons = {
  new: PackagePlus,
  best: Crown,
  deals: BadgePercent,
  electronics: Laptop,
  fashion: Shirt,
  power: BatteryCharging,
  home: Home,
  beauty: Sparkles,
  smart: Star,
  more: MoreHorizontal,
};

export type ExploreShortcut = {
  id: keyof typeof shortcutIcons;
  label: string;
  href: string;
};

export type ExplorePromotion = {
  id: string;
  amount: string;
  minimum: string;
  expires?: string;
};

export function ExploreDiscovery({ shortcuts, promotions = [] }: { shortcuts: ExploreShortcut[]; promotions?: ExplorePromotion[] }) {
  return (
    <>
      <section className="mt-7 rounded-2xl border border-border/70 bg-[#121518] p-4 sm:p-5" aria-labelledby="quick-discovery-title">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 id="quick-discovery-title" className="text-base font-semibold tracking-tight">Quick discovery</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Explore popular picks and departments</p>
          </div>
          <Link
            href="/categories"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            All categories <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-x-1 gap-y-4 sm:gap-x-2 md:grid-cols-10">
          {shortcuts.map((shortcut) => {
            const Icon = shortcutIcons[shortcut.id];
            return (
              <Link
                key={shortcut.id}
                href={shortcut.href}
                className="group flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl border border-border/80 bg-[#1C1F22] text-primary shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/60 group-hover:bg-[#292D31] group-hover:shadow-[0_6px_18px_rgba(212,167,44,0.12)] group-active:scale-95 sm:size-[52px]">
                  <Icon className="size-[21px]" strokeWidth={1.8} />
                </span>
                <span className="line-clamp-2 min-h-8 px-0.5 text-[11px] font-medium leading-4 text-muted-foreground transition-colors group-hover:text-foreground">{shortcut.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {promotions.length > 0 && (
        <section className="mt-5 overflow-hidden border border-[#d9e4d8] bg-[#eef5ed]" aria-labelledby="agora-promotions-title">
          <div className="flex items-center justify-between gap-4 border-b border-[#d9e4d8] px-4 py-3 sm:px-5">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#397253]">Agora offers</p><h2 id="agora-promotions-title" className="mt-0.5 text-lg font-semibold text-[#173b2b]">Save more on your next order</h2></div>
            <Gift className="size-5 shrink-0 text-[#397253]" />
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {promotions.map((promotion) => <div key={promotion.id} className="min-w-[145px] flex-1 border border-[#cfe1ce] bg-white px-3 py-3"><p className="text-lg font-bold text-[#173b2b]">{promotion.amount} off</p><p className="mt-1 text-xs text-[#52705a]">Orders over {promotion.minimum}</p>{promotion.expires && <p className="mt-2 text-[10px] text-[#7a8b7d]">Ends {promotion.expires}</p>}</div>)}
          </div>
          <div className="px-4 pb-4 sm:px-5"><Link href="/products" className="inline-flex items-center gap-1 text-xs font-semibold text-[#24553d] hover:underline">Shop eligible products <ArrowRight className="size-3.5" /></Link></div>
        </section>
      )}
    </>
  );
}
