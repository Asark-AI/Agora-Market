'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { PublicShell } from '@/components/public-shell';
import { Button } from '@/components/ui/button';

export default function SearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Explore page failed to render:', error);
  }, [error]);

  return (
    <PublicShell>
      <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#292f35] bg-[#171B1F] p-6 text-center text-white sm:p-8">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">Explore is temporarily unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-[#B7BCC3]">
          Product listings could not be loaded just now. You can retry or use AI and visual search from the search bar.
        </p>
        {error.digest && <p className="mt-3 text-xs text-[#9299A1]">Reference: {error.digest}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={reset}>
            <RefreshCw aria-hidden="true" className="mr-2 size-4" />
            Try again
          </Button>
          <Button asChild type="button" variant="outline" className="border-[#555d65] text-white hover:bg-[#292D31]">
            <Link href="/">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Home
            </Link>
          </Button>
        </div>
      </section>
    </PublicShell>
  );
}
