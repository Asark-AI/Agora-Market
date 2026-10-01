'use client';

import { Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname !== '/') return null;

  return (
    <header className="border-b border-border/80 bg-background px-4 py-4 sm:py-5">
      <div className="mx-auto flex max-w-7xl items-center gap-3 sm:gap-5">
        <form action="/search" className="min-w-0 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search products or categories"
            aria-label="Search products or categories"
            className="h-10 w-full rounded-md border-border bg-white pl-10 pr-4 text-sm shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          </div>
        </form>
      </div>
    </header>
  );
}
