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
      <section className="mt-7 border-y border-border/70 py-4" aria-labelledby="quick-discovery-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="quick-discovery-title" className="text-base font-semibold">Quick discovery</h2>
          <Link href="/categories" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See all categories <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="grid grid-cols-5 gap-y-5 sm:grid-cols-10 sm:gap-y-4">
          {shortcuts.map((shortcut) => {
            const Icon = shortcutIcons[shortcut.id];
            return (
              <Link key={shortcut.id} href={shortcut.href} className="group flex min-w-0 flex-col items-center gap-2 text-center">
                <span className="flex size-14 items-center justify-center rounded-full border border-border/80 bg-[#f7f6f2] text-foreground transition group-hover:border-primary group-hover:text-primary group-active:scale-95 sm:size-16">
                  <Icon className="size-6" strokeWidth={1.7} />
                </span>
                <span className="line-clamp-2 min-h-[28px] px-0.5 text-[11px] font-medium leading-3.5 text-foreground">{shortcut.label}</span>
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
