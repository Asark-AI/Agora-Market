'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PublicShell } from '@/components/public-shell';
import { SearchModes } from '@/components/search-modes';
import { Button } from '@/components/ui/button';

export default function SearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Explore page failed to render:', error);
  }, [error]);

  return (
    <PublicShell>
      <SearchModes
        solutions={[]}
        normalContent={
          <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#292f35] bg-[#171B1F] p-6 text-center text-white sm:p-8">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
              <AlertTriangle aria-hidden="true" className="size-5" />
            </span>
            <h1 className="mt-4 text-xl font-semibold">Explore is temporarily unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-[#B7BCC3]">
              Product listings could not be loaded just now. You can retry or use AI and visual search from the search bar.
            </p>
            {error.digest && <p className="mt-3 text-xs text-[#9299A1]">Reference: {error.digest}</p>}
            <Button type="button" onClick={reset} className="mt-5">
              <RefreshCw aria-hidden="true" className="mr-2 size-4" />
              Try again
            </Button>
          </section>
        }
      />
    </PublicShell>
  );
}
