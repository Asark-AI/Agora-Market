'use client';

import { Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname !== '/') return null;

  return (
    <header className="border-b border-border bg-background px-4 pb-3 pt-3">
      <form action="/search" className="mx-auto max-w-7xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search products, stores & brands"
            aria-label="Search products, stores and brands"
            className="h-11 w-full rounded-md border-border bg-background pl-10 pr-4 text-sm shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </form>
    </header>
  );
}
