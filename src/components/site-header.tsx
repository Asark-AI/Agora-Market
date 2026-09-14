'use client';

import { Search, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname !== '/') return null;

  return (
    <header className="border-b border-border/80 bg-background px-4 py-4 sm:py-5">
      <div className="mx-auto flex max-w-7xl items-center gap-5">
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="flex size-8 items-center justify-center bg-foreground text-sm font-bold text-background">A</span>
          <span className="text-sm font-semibold tracking-[0.16em] text-foreground">AGORA</span>
        </div>
        <form action="/search" className="min-w-0 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search products, stores & brands"
            aria-label="Search products, stores and brands"
            className="h-11 w-full rounded-full border-border/80 bg-muted/30 pl-11 pr-4 text-sm shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-1 focus-visible:ring-primary"
          />
          </div>
        </form>
        <div className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground md:flex"><ShieldCheck className="size-4 text-emerald-700" />Verified marketplace</div>
      </div>
    </header>
  );
}
