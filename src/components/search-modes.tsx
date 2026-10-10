'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiShoppingPlanner } from '@/components/ai-shopping-planner';
import { VisualProductSearch } from '@/components/visual-product-search';

type SolutionOption = {
  slug: string;
  name: string;
  category: string;
  metadata?: {
    useCases: string[];
    outcomes: string[];
  };
  requirements: Array<{ name: string; keywords: string[] }>;
};

export function SearchModes({ normalContent, solutions }: { normalContent: ReactNode; solutions: SolutionOption[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'visual'
    ? 'visual'
    : searchParams.get('mode') === 'ai'
      ? 'ai'
      : 'normal';
  const setMode = (nextMode: 'ai' | 'normal') => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextMode === 'normal') params.delete('mode');
    else params.set('mode', nextMode);
    const query = params.toString();
    window.history.pushState(null, '', `${pathname}${query ? `?${query}` : ''}`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="min-w-0">
        <div hidden={mode !== 'normal'}>{normalContent}</div>
        <div hidden={mode !== 'ai'} className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setMode('normal')} className="text-[#B7BCC3] hover:text-white">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />Back to products
            </Button>
            <AiShoppingPlanner solutions={solutions} />
            <Link href="/solutions" className="inline-flex items-center gap-2 rounded-xl border border-[#292f35] bg-[#171B1F] px-4 py-3 text-sm font-semibold text-[#F0C75E] transition hover:border-[#D4A72C]/60">
              Explore curated solutions <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
        </div>
        <div hidden={mode !== 'visual'}><VisualProductSearch /></div>
      </div>
    </div>
  );
}
