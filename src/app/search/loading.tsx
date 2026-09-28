import { PublicShell } from '@/components/public-shell';
import { CategoryNavigationSkeleton, ProductGridSkeleton } from '@/components/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchLoading() {
  return <PublicShell><main className="mx-auto max-w-7xl px-4 py-8 sm:py-12" aria-busy="true" aria-label="Loading Explore"><Skeleton className="h-12 max-w-3xl rounded-md" /><CategoryNavigationSkeleton /><section className="mt-6"><div className="mb-3 flex items-center justify-between"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-16" /></div><ProductGridSkeleton count={8} /></section></main></PublicShell>;
}
